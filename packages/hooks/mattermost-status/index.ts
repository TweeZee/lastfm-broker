import type {Env} from "env";
import {formatTrack, LastHook, LoggingFacade, Track} from "shared";

type MattermostStatusConfig = {
    url: string;
    token: string;
    emoji?: string;
}

export const mattermostStatus = (config: MattermostStatusConfig) => (env: Env) => new MattermostStatus(config, env);

class MattermostStatus implements LastHook {
    private currentTrack: string;
    private logger = new LoggingFacade({name: 'MattermostStatus', color: "blue"});

    constructor(protected config: MattermostStatusConfig, protected env: Env) {
    }

    setup(): Promise<void> {
        this.config.emoji = this.config.emoji || "musical_note";
        return Promise.resolve();
    }

    async onTrackChange(track: Track): Promise<void> {
        const formatted = formatTrack(track);
        if (this.currentTrack && this.currentTrack === formatted) {
            this.logger.info("Track already set as status, skipping...");
            return Promise.resolve();
        }
        this.currentTrack = formatted;

        return await this.setCustomStatus(formatTrack(track))
            .then((res: Response) => res.json() as Promise<{ status: string }>)
            .then((res) => void (res?.status !== "OK" && this.logger.warn(res)))
            .catch((e) => this.logger.error(`Error setting status: ${JSON.stringify(e)}`));
    }

    async teardown(): Promise<void> {
        // Clear status
        return await this.setCustomStatus("");
    }

    private async setCustomStatus(status: string) {
        this.logger.info(status.length ? "Setting status" : "Clearing status");

        const req = new Request(`${this.config.url}/api/v4/users/me/status/custom`, {
            method: status.length ? 'PUT' : 'DELETE',
            mode: 'cors',
            headers: {
                'Authorization': `Bearer ${this.config.token}`
            },
            body: status.length ? JSON.stringify({
                emoji: this.config.emoji,
                text: status,
            }) : undefined,
        });

        return await fetch(req).catch((e) => this.logger.error(`Error ${status.length ? 'setting' : 'clearing'} status: ${JSON.stringify(e)}`));
    }
}
