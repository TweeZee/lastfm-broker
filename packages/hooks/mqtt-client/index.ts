import {formatTrack, LoggingFacade, Track} from "shared";
import {LastHook} from "shared/src/model/hook.ts"
import {connect, IClientOptions} from 'mqtt';
import {Env} from "env";
import {format} from "node:util";

type MqttConfig = Omit<IClientOptions, "log"> & {
    topic: string;
}

type MqttClient = ReturnType<typeof connect>

export const mqtt = (config: MqttConfig) => (env: Env) => new MqttHook(config, env);

class MqttHook implements LastHook {
    private client!: MqttClient;
    private logger = new LoggingFacade({name: "MQTT", color: "pink"})

    constructor(protected config: MqttConfig, protected env: Env) {
    }

    setup(): Promise<void> {
        const {topic, ...options} = this.config;
        this.client = connect({
            ...options,
            log: (...args) => {
                const [template, ...templateArgs] = args;

                this.logger.debug(format(template, ...templateArgs));
            },
        });
        this.logger.info("Connected to broker");
        return Promise.resolve();
    }

    teardown(): Promise<void> {
        this.client.end();
        this.logger.info("Disconnected from broker");
        return Promise.resolve();
    }

    onTrackChange(track: Track): Promise<void> {
        this.client.publish(this.config.topic, formatTrack(track, false));
        this.logger.info("Published track to Broker");
        return Promise.resolve();
    }
}