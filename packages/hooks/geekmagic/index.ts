import type {Env} from "env";
import sharp from "sharp";
import {LoggingFacade, Track} from "shared";
import {LastHook} from "shared/src/model/hook.ts";

type GeekMagicConfig = {
    url: string;
    coverFileName?: string;
}

type SpaceInfo = {
    free: number,
    total: number,
}

export const geekMagic = (config: GeekMagicConfig) => (env: Env) => new GeekMagicHook(config, env);

class GeekMagicHook implements LastHook {
    private static COVER_FILE_NAME = "cover.jpg";
    private lastCoverUrl: string;

    private logger: LoggingFacade = new LoggingFacade({name: 'GeekMagic', color: "orange"});

    constructor(protected config: GeekMagicConfig, protected env: Env) {
        if (!config.url) {
            this.logger.warn('URL is required for GeekMagicHook');
            throw new Error('URL is required for GeekMagicHook');
        }
    }

    async onTrackChange(track: Track) {
        if (!this.config.url) {
            this.logger.warn('GeekMagic URL not set');
            return;
        }

        if (!track.image) {
            this.logger.warn('No image found in track data');
            return;
        }

        if (track.image[3]?.text === this.lastCoverUrl) {
            this.logger.info('Image already sent to GeekMagic. Skipping...');
            return;
        }

        this.logger.log('Sending image to GeekMagic');

        try {
            const buffer = await this.fetchImage(track.image[3].text).catch();
            const response: Response | undefined = await this.sendImageToGeekMagic(buffer);

            if (!response?.ok) {
                this.logger.error(`Failed to send image to GeekMagic: ${response?.statusText}`);
                return;
            }
            this.logger.log('Image sent to GeekMagic');
            this.lastCoverUrl = track.image[3].text;
        } catch (e) {
            this.logger.error(`Failed to send image to GeekMagic: ${e}`);
            this.logger.trace(`${track.image[3].text}`);
            return;
        }
    }

    private async fetchImage(url: string): Promise<Buffer> {
        const response = await fetch(url);

        if (!response.ok) {
            this.logger.error(`Failed to fetch image from Last.fm: ${response.statusText}`);
        }

        // Read the response as an ArrayBuffer to handle binary data without ever saving it to disk
        const buffer = await response.arrayBuffer();

        // Resize the image and convert it to JPEG as it's the only format besides GIF supported by GeekMagic
        return await sharp(Buffer.from(buffer))
            .resize(240, 240)
            .jpeg()
            .toBuffer();
    }

    private async sendImageToGeekMagic(buffer: Buffer) {
        // Convert the buffer back to an ArrayBuffer
        const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

        const coverFileName = this.config.coverFileName || GeekMagicHook.COVER_FILE_NAME;

        const blob = new Blob([arrayBuffer], {type: 'image/jpeg'});
        const file = new File([blob], coverFileName, {type: "image/jpeg"});

        const spaceAvailable = await fetch(`${this.config.url}/space.json`)
            .then(async (res) => await res.json() as Promise<SpaceInfo>)
            .then((data) => data.free);

        if (spaceAvailable < buffer.byteLength) {
            this.logger.error('Not enough space available on GeekMagic');
            return;
        }

        const formData = new FormData();
        formData.append("image", file, coverFileName);

        return await fetch(`${this.config.url}/doUpload?dir=/image/`, {
            method: "POST",
            body: formData,
        });
    }
}
