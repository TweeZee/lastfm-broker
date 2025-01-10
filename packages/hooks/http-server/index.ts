import type {Env} from "env";
import {LoggingFacade, Track} from "shared";
import {LastHook} from "shared/src/model/hook.ts";
import {Elysia} from "elysia";

type HttpServerConfig = {
    port?: number;
}

export const httpServer = (config: HttpServerConfig = {}) => (env: Env) => new HttpServerHook(config, env);

class HttpServerHook implements LastHook {
    private app = new Elysia().get('/current', () => this.current);
    private current: Track;
    private logger = new LoggingFacade({name: 'HttpServer', color: "green"});

    constructor(protected config: HttpServerConfig, protected env: Env) {
    }

    setup(): Promise<void> {
        const port = this.config.port ?? 1457;
        this.logger.info('Server starting on port ' + port);
        this.app.listen(port);
        return Promise.resolve();
    }

    onTrackChange(track: Track): Promise<void> {
        this.current = track;
        return Promise.resolve();
    }

    teardown(): Promise<void> {
        return this.app.stop();
    }
}