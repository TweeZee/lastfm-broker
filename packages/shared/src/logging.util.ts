import {Primitive} from "zod";

export const logErrorAndExit = (error: Error, messageOnly = false, caller?: string): never => {
    formatError(messageOnly ? error : error.message, {caller});
    return process.exit(1);
}

export const logAndExitGracefully = (message: string): never => {
    console.log('\x1b[32m', message);
    return process.exit(0);
}

export enum LOG_LEVEL {
    NONE,
    LOG,
    INFO,
    WARN,
    ERROR,
    DEBUG,
    TRACE,
}

let logLevel = LOG_LEVEL.ERROR;

export const setLogLevel = (level: LOG_LEVEL) => logLevel = level;

const colorMarkers = [
    'black',
    'red',
    'green',
    'orange',
    'blue',
    'lightblue',
    'pink',
    'reset',
] as const;

type ColorMarker = (typeof colorMarkers)[number];

/**
 * template literal function for coloring parts of console output using coloration markers <br>
 * Usage: dye\`Default ${"red"} <span style="color: red">This is Red </span> ${"green"}
 * <span style="color: green"> Green numbers: ${420} </span> ${"reset"} And this is back to normal.
 * ${stringOrNumberVariable} can be included as well.\`
 * @param strings an array of all the substrings that come before, after and between args, in order
 * @param args can be either numbers, arbitrary strings or {@link ColorMarker}, marking the start of coloration.
 * the 'reset' marker will remove coloring, enabling you to colorize certain parts of the template string
 * (including other interpolated values)
 */
export function dye(
    strings: TemplateStringsArray,
    ...args: (ColorMarker | Primitive | {})[]
) {
    if (!args.length) {
        return strings.reduce((prev, cur) => prev + cur);
    }

    let res = '';
    let marked = false;
    strings.forEach((str, i) => {
        const arg = args[i];

        if (colorMarkers.includes(arg as ColorMarker)) {
            res += str + getMarkerByName(arg as ColorMarker);
            marked = true;
            return;
        }
        res += str + (typeof arg === "object" ? JSON.stringify(arg, null, 2) : arg?.toString() ?? '');
    });

    return marked ? res + getMarkerByName('reset') : res;
}

export const formatCaller = (caller?: string, color?: ColorMarker) =>
    dye`${color ?? ''}${caller ? `[${caller}]` : ''}`;

export const formatLogMessage = (
    message: unknown,
    caller?: string,
    prefix = ' ',
    callerColor?: ColorMarker,
) => `${prefix} ${formatCaller(caller, callerColor)} ${
    typeof message === "object"
        ? JSON.stringify(message, null, 2)
        : message
}`;

export const formatLog: LogFormatter = (
    message,
    {
        caller,
        prefix = '📜',
        logger = console.log,
        callerColor
    } = {},
) => logLevel >= LOG_LEVEL.LOG && logger(formatLogMessage(message, caller, prefix, callerColor));

export const formatInfo: LogFormatter = (
    message,
    {
        caller,
        prefix = '🛈 ',
        logger = console.info,
        callerColor
    } = {}
) => logLevel >= LOG_LEVEL.INFO && logger(formatLogMessage(message, caller, prefix, callerColor));

export const formatDebug: LogFormatter = (
    message,
    {
        caller,
        prefix = '🪲',
        logger = console.debug,
        callerColor,
    } = {}
) => logLevel >= LOG_LEVEL.DEBUG && logger(formatLogMessage(message, caller, prefix, callerColor));

export const formatWarn: LogFormatter = (
    message,
    {
        caller,
        prefix = '⚠️',
        logger = console.warn,
        callerColor,
    } = {}
) => logLevel >= LOG_LEVEL.WARN && logger(formatLogMessage(dye`${'orange'}${message}`, caller, prefix, callerColor));

export const formatError: LogFormatter = (
    message,
    {
        caller,
        prefix = '❌',
        logger = console.error,
        callerColor,
    } = {}
) => logLevel >= LOG_LEVEL.ERROR && logger(formatLogMessage(dye`${'red'}${message}`, caller, prefix, callerColor));

export const formatTrace: LogFormatter = (
    message,
    {
        caller,
        prefix = '📝',
        logger = console.trace,
        callerColor,
    } = {}
) => logLevel >= LOG_LEVEL.TRACE && logger(formatLogMessage(message, caller, prefix, callerColor));

function getMarkerByName(marker: ColorMarker) {
    switch (marker) {
        case 'black':
            return '\x1b[30m';
        case 'red':
            return '\x1b[31m';
        case 'green':
            return '\x1b[32m';
        case 'orange':
            return '\x1b[33m';
        case 'blue':
            return '\x1b[34m';
        case 'pink':
            return '\x1b[35m';
        case 'lightblue':
            return '\x1b[36m';
        case 'reset':
            return '\x1b[0m';
        default:
            return '';
    }
}

type LoggingFacadeConfig = {
    name: string;
    logger: Logger;
    color: Exclude<ColorMarker, 'reset'>;
    disableColoring: boolean;
};

export class LoggingFacade {
    private static readonly DEFAULT_CONFIG = {
        logger: console,
        color: 'lightblue',
    } satisfies Partial<LoggingFacadeConfig>;

    public log: NamedLogFormatter;
    public info: NamedLogFormatter;
    public debug: NamedLogFormatter;
    public warn: NamedLogFormatter;
    public error: NamedLogFormatter;
    public trace: NamedLogFormatter;

    constructor({logger: _logger, name, color, disableColoring}: Partial<LoggingFacadeConfig> = {}) {
        const logger = _logger ?? LoggingFacade.DEFAULT_CONFIG.logger;
        const callerColor = disableColoring ? undefined : color ?? LoggingFacade.DEFAULT_CONFIG.color;

        this.log = (message, prefix?) =>
            formatLog(message, {caller: name, prefix, logger: logger.log, callerColor});
        this.error = (message, prefix?) =>
            formatError(message, {caller: name, prefix, logger: logger.error, callerColor});
        this.info = (message, prefix?) =>
            formatInfo(message, {caller: name, prefix, logger: logger.info, callerColor});
        this.debug = (message, prefix?) =>
            formatDebug(message, {caller: name, prefix, logger: logger.debug, callerColor});
        this.warn = (message, prefix?) =>
            formatWarn(message, {caller: name, prefix, logger: logger.warn, callerColor});
        this.trace = (message, prefix?) =>
            formatTrace(message, {caller: name, prefix, logger: logger.trace, callerColor});
    }
}

type LoggerFunction = (message: string) => void;

interface Logger {
    log: LoggerFunction;
    error: LoggerFunction;
    info?: LoggerFunction;
    debug?: LoggerFunction;
    warn?: LoggerFunction;
    trace?: LoggerFunction;
}

type NamedLogFormatter = (message: string, prefix?: string) => void;

type FormattingConfig = {
    caller: string;
    prefix: string;
    logger: LoggerFunction;
    callerColor: ColorMarker;
}

type LogFormatter = (
    message: unknown,
    config?: Partial<FormattingConfig>,
) => void;