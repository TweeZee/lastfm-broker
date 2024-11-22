import {LastHook} from "./hook.ts";
import {LOG_LEVEL} from "../logging.util.ts";

export type Config<TEnv> = {
    logLevel?: LOG_LEVEL;
    lastFmUserNames: string[];
    hooks: ((env: TEnv) => LastHook)[];
}