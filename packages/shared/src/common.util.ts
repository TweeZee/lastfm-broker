import type {Track} from "./model";
import {z} from "zod";
import {Env} from "env";

export class URLQueryBuilder {
    private readonly baseUrl: URL;

    private constructor(baseUrl: string) {
        this.baseUrl = new URL(baseUrl);
    }

    public static from(baseUrl: string): URLQueryBuilder {
        return new URLQueryBuilder(baseUrl);
    }

    public addParam(key: string, value?: string | number | boolean): this {
        if (value) {
            this.baseUrl.searchParams.append(key, value.toString());
        }
        return this;
    }

    public addParams(params: Record<string, string | number | boolean>): this {
        Object.entries(params).forEach(([key, value]) => value && this.addParam(key, value));
        return this;
    }

    public build() {
        return this.baseUrl.toString();
    }
}

export const formatTrack = (track: Track | undefined, showInactive: boolean) =>
    track && (showInactive || track.attr?.nowplaying) ? `${track.artist.text} - ${track.name}` : '';
