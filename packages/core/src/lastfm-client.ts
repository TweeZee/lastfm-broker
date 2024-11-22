import type {Track} from 'shared/src/model';
import {recentTracksResponseSchema} from "shared/src/model";
import {LoggingFacade, URLQueryBuilder} from "shared";

interface Paginated {
    page?: number;
    limit?: number;
}

interface RecentTrackParams extends Paginated {
    user: string;
    extended?: boolean;
}

type RequestResult<T> = { data: T; success: true } | { error: Error; success: false };

export class LastFmClient {
    private logger = new LoggingFacade({name: 'LastFmClient', color: "red"});

    constructor(
        private baseUrl: string,
        private apiKey: string
    ) {
    }

    public async getRecentTracks(params: RecentTrackParams): Promise<RequestResult<Track[]>> {
        const url = URLQueryBuilder
            .from(this.baseUrl)
            .addParams({
                ...params,
                method: 'user.getrecenttracks',
                format: 'json',
                api_key: this.apiKey
            })
            .build();

        this.logger.debug(`Fetching recent tracks from ${url}`);

        const response: Response = await fetch(url);

        if (!response.ok) {
            return {error: new Error(`[${response.status}]: ${response.statusText}`), success: false};
        }

        const {data, error, success} = recentTracksResponseSchema.safeParse(await response.json());

        if (!success) {
            return {error: new Error(error!.message), success: false};
        }

        return {data: data!.recenttracks.track, success: true};
    }
}
