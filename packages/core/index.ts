import {logErrorAndExit} from "shared";
import {main} from "./src";

main().catch(logErrorAndExit);
