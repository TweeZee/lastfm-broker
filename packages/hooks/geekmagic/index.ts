import type {Env} from "env";
import sharp from "sharp";
import {LoggingFacade, Track} from "shared";
import {LastHook} from "shared/src/model/hook.ts";

type GeekMagicConfig = {
    url: string;
    coverFileName?: string;
    autoSwitch?: boolean;
}

type SpaceInfo = {
    free: number,
    total: number,
}

export const geekMagic = (config: GeekMagicConfig) => (env: Env) => new GeekMagicHook(config, env);

class GeekMagicHook implements LastHook {
    private static COVER_FILE_NAME = "cover.jpg";
    private lastCoverUrl: string;

    private themeState: number;
    private playingState = false;
    private imagePathState: string;

    private logger: LoggingFacade = new LoggingFacade({name: 'GeekMagic', color: "orange"});

    constructor(protected config: GeekMagicConfig, protected env: Env) {
        if (!config.url) {
            this.logger.warn('URL is required for GeekMagicHook');
            throw new Error('URL is required for GeekMagicHook');
        }

        if (!config.autoSwitch) {
            return;
        }

        this.getThemeState()
            .then(async ({theme}) => theme === 3 ? {theme, filePath: await this.getActiveImage()} : {theme})
            .then(({theme, filePath}) => {
                this.themeState = theme;
                if (filePath) {
                    this.imagePathState = filePath;
                }
            });
    }

    async getThemeState() {
        return await fetch(`${this.config.url}/app.json`)
            .then((res) => res.json() as Promise<ThemeState>);
    }

    async setTheme(theme: number) {
        return await fetch(`${this.config.url}/set?theme=${theme}`);
    }

    async setActiveImage(filePath: string) {
        return await fetch(`${this.config.url}/set?img=${filePath}`);
    }

    async getActiveImage() {
        return await fetch(`${this.config.url}/img.json`)
            .then((res) => res.json() as Promise<ImageState>);
    }

    async onTrackChange(track: Track) {
        if (!this.config.url) {
            this.logger.warn('GeekMagic URL not set');
            return;
        }

        if (this.config.autoSwitch) {
            if (!this.playingState && track.attr.nowplaying) {
                this.themeState = (await this.getThemeState()).theme;
                await this.setTheme(3); // TODO check for SmallTV model and use according Photo Album theme
                //TODO if prev state was a photo also get the file path so that it can be changed back
                this.imagePathState = (await this.getActiveImage()).img;
                await this.setActiveImage(GeekMagicHook.COVER_FILE_NAME);

            } else if (this.playingState && !track.attr.nowplaying) {
                await this.setTheme(this.themeState);
                await this.setActiveImage(this.imagePathState);
            }
        }

        this.playingState = track.attr.nowplaying;

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

type ThemeState = {
    theme: number;
}

type ImageState = {
    img: string;
}