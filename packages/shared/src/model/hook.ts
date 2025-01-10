import {Env} from "env";
import type {Track} from "./lastfm.model.ts";

export abstract class LastHook {
    protected constructor(config: Record<string, unknown>, env: Env) {}

    abstract setup?(): Promise<void>;

    abstract onTrackChange(track: Track): Promise<void>;

    abstract teardown?(): Promise<void>;
}
