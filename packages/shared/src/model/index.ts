import {Track} from "./lastfm.model.ts";
import type {Env} from "env";

export * from './lastfm.model.ts'
export {LastHook} from './hook.ts';
export type {Config} from './config.ts';

export type Hook = (track: Track, env: Env) => Promise<void>;
