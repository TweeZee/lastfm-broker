import {z} from "zod";
import {LoggingFacade, logErrorAndExit, zz} from "shared";
import {parseArgs} from "util";

const logger = new LoggingFacade({name: "ENV"});

const envSchema = z.object({
    REQUEST_INTERVAL_MS: z.number().min(1).default(10000),
    // TODO not quite behaving as expected vvv
    SHOW_INACTIVE_TRACKS: zz.boolish().default(false),
    LASTFM_API_KEY: z.string().min(1),
    LASTFM_API_URL: z.string().url(),
    LASTFM_USERNAME: z.string().min(1),
    SHOW_HELP: z.boolean().default(false),
});

const argsSchema = z.object({
    interval: zz.numeric().optional().default(10000).pipe(z.number().min(1)),
    'allow-inactive-tracks': z.boolean().optional(),
    help: zz.boolish().optional().default(false),
}).strict().transform(({interval, 'allow-inactive-tracks': allowInactive, help, port}) => ({
    REQUEST_INTERVAL_MS: interval,
    SHOW_INACTIVE_TRACKS: allowInactive || undefined,
    SHOW_HELP: help,
}));

export function getEnv(runtimeEnv: Record<string, unknown>, runtimeArgs: string[]): Env {
    const args = getArgs(runtimeArgs);
    logger.log('Parsing environment variables...');
    const {data, error, success} = envSchema.safeParse({
        ...runtimeEnv,
        ...args
    });

    if (!success) {
        logErrorAndExit(new Error('Invalid environment variables: ' + error!.message), false, 'ENV');
    }

    logger.log('Successfully parsed environment variables');
    logger.info('Environment created')

    return data!;
}

function getArgs(runtimeArgs: string[]): Args {
    logger.log('Parsing command line arguments...');
    const {data, error, success} = argsSchema.safeParse(parseArgs({
        args: runtimeArgs,
        options: {
            interval: {
                type: 'string',
            },
            'allow-inactive-tracks': {
                type: 'boolean',
            },
            help: {
                type: 'boolean',
            }
        },
        strict: true,
        allowPositionals: true,
    }).values);

    if (!success) {
        return logErrorAndExit(new Error('Invalid command line arguments: ' + error!.message), false, 'ENV');
    }

    logger.log('Successfully parsed command line arguments');
    return data!;
}

export type Env = z.infer<typeof envSchema>;
export type Args = z.infer<typeof argsSchema>;
