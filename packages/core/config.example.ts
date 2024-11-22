import {LOG_LEVEL} from "shared";
import {Config} from "shared/src/model/config.ts";
import {Env} from "env";
import {fileDump} from "file-dump";

export default {
    logLevel: LOG_LEVEL.ERROR,
    lastFmUserNames: [],
    hooks: [
        // hook packages expose a single configuration function, e.g.:
        /*fileDump({
            outFile: "out.txt",
            maxLength: 100
        })*/
    ],
} as Config<Env>;
