import {formatTrack, LoggingFacade, Track} from "shared";
import {LastHook} from "shared/src/model/hook.ts";
import {Env} from "env";

type FileDumpConfig = {
    outFile?: string;
    maxLength?: number;
}

export const fileDump = (config: FileDumpConfig = {}) => (env: Env) => new FileDumpHook(config, env);

class FileDumpHook implements LastHook {
    private static readonly DEFAULT_OUT_FILE = 'output.txt';

    private logger = new LoggingFacade({name: 'FileDump', color: "blue"});

    constructor(protected config: FileDumpConfig, protected env: Env) {
    }

    async onTrackChange(track: Track): Promise<void> {
        let res = formatTrack(track, this.env.SHOW_INACTIVE_TRACKS);

        if (this.config.maxLength && res.length > this.config.maxLength) {
            const ellipsis = '...';
            res = res.slice(0, this.config.maxLength - ellipsis.length) + ellipsis;
        }

        this.logger.log('Writing to file');
        await Bun.write(this.config.outFile || FileDumpHook.DEFAULT_OUT_FILE, res);
    }
}