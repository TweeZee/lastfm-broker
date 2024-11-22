import {
    LoggingFacade,
    dye,
    formatTrack,
    LOG_LEVEL,
    logAndExitGracefully,
    logErrorAndExit,
    setLogLevel,
    Track
} from "shared";
import {getEnv} from "env";
import {LastFmClient} from "./lastfm-client.ts";
import {LastHook} from "shared/src/model/hook.ts";
import config from "../config.ts";

const env = getEnv(process.env, process.argv.slice(2));

setLogLevel(config.logLevel ?? LOG_LEVEL.ERROR);

const logger = new LoggingFacade({name: 'MAIN'});

let current = '';
let currentlyTrackedUser = '';

export async function main() {
    if (env.SHOW_HELP) {
        console.log('Options:');
        console.log('  --interval <ms>            Request interval in milliseconds (default: 10000)');
        console.log('  --file <path>              File path to write the current track to (default: ./output.txt)');
        console.log('  --length <chars>           Maximum length of the track string (default: 50)');
        console.log('  --allow-inactive-tracks    Include inactive tracks in the output');
        console.log('  --help                     Show this help message');
        return process.exit(0);
    }

    const client = new LastFmClient(env.LASTFM_API_URL, env.LASTFM_API_KEY);

    logger.log('Setting up hooks...');

    const activeHooks: LastHook[] = config.hooks.map((hook) => hook(env));
    await Promise.all(activeHooks.map(async (hook) => await hook.setup?.())).catch((e) => logger.error(e));
    logger.log('Hooks set up');

    await update();
    const updateTask = setInterval(async () => await update(), env.REQUEST_INTERVAL_MS);

    ['SIGTERM', 'SIGINT', 'SIGKILL'].forEach((signal) => process.on(signal, async () => {
        clearInterval(updateTask);
        await Promise.all(activeHooks.map(async (hook) => await hook.teardown?.()));
        logger.info('Server stopped');
        logAndExitGracefully('Exiting...')
    }));

    async function update() {
        const track = await fetchFromLastFm();
        const formatted = formatTrack(track, env.SHOW_INACTIVE_TRACKS);

        if (!track || formatted === current) {
            return;
        }

        logger.log(dye`Received new track: ${"lightblue"}${formatted}`);
        current = formatted;

        for (const hook of activeHooks) {
            await hook.onTrackChange(track).catch(logger.error);
        }
    }

    async function fetchFromLastFm() {
        let recentTrackResult: Awaited<ReturnType<typeof client.getRecentTracks>>;
        let results = new Map<string, typeof recentTrackResult>();

        for (const user of config.lastFmUserNames) {
            logger.debug(dye`Fetching recent tracks for user: ${"lightblue"}${user}`);
            recentTrackResult = await client.getRecentTracks({
                user,
                limit: 1,
            });

            if (recentTrackResult.success && recentTrackResult.data.length > 0 && recentTrackResult.data[0].attr?.nowplaying) {
                currentlyTrackedUser = user;

                if (formatTrack(recentTrackResult.data[0], true) !== current) {
                    logger.log(dye`Found currently playing track for user: ${"lightblue"}${user}`);
                }

                return recentTrackResult.data[0];
            }

            results.set(user, recentTrackResult);
        }

        const result = results.get(currentlyTrackedUser) ?? recentTrackResult;

        if (!result.success) {
            logger.warn(`Failed to fetch recent tracks from Last.fm, trying again in ${env.REQUEST_INTERVAL_MS / 1000} seconds`);
            return undefined;
        }

        return result.data[0];
    }
}