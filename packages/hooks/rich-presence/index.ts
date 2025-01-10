import type {Hook, Track} from "shared";
import {LoggingFacade, formatTrack} from "shared";
import {Env} from "env";
import {z} from "zod";
import {DiscordSDK, RPCCloseCodes} from "@discord/embedded-app-sdk";
import {LastHook} from "shared/src/model/hook.ts";

export const richPresence: Hook = async (track, env) => {
    const a = new RichPresenceHook(env);
}

export class RichPresenceHook implements LastHook {
    private client: DiscordSDK;
    private logger: LoggingFacade = new LoggingFacade({name: 'RichPresenceHook', color: "pink"});

    public envSchema = z.object({
        DISCORD_CLIENT_ID: z.string(),
    });

    constructor(protected env: Env) {
        if (!env.DISCORD_CLIENT_ID) {
            this.logger.error('DISCORD_CLIENT_ID is required for RichPresenceHook');
            throw new Error('DISCORD_CLIENT_ID is required for RichPresenceHook');
        }

        this.client = new DiscordSDK(env.DISCORD_CLIENT_ID, {disableConsoleLogOverride: false});
        this.logger.debug('Created DiscordSDK instance');
    }

    async setup(): Promise<void> {
        console.log("Setting up");
        try {
            await this.client.ready().then(() => this.logger.info("Discord SDK ready!")).catch(this.logger.error);
        } catch (e) {
            this.logger.error(e);
        }
    }


    async onTrackChange(track: Track): Promise<void> {
        if (!track.attr?.nowplaying) {
            //TODO handle
            return;
        }

        return void await this.client.commands.setActivity({
            activity: {
                type: 2, // Listening to
                details: formatTrack(track, false),
                //state: 'In Mainframe',
                assets: {
                    large_image: track.image[3].size,
                    large_text: 'in a group',
                    //TODO play pause icons
                    // small_image: 'map-mainframe',
                    // small_text: 'in mainframe'
                },
                timestamps: {
                    start: Date.now(),
                },
            }
        }).catch(this.logger.error);
    }

    async teardown(): Promise<void> {
        return this.client.close(RPCCloseCodes.CLOSE_NORMAL, 'Shutting down');
    }
}

type ExtendedEnv<TExtension extends z.ZodObject<unknown>> = Env & z.infer<TExtension>;
