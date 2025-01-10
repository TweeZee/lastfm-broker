# lastfm-broker

Small tool to continuously fetch current track information and pass it to simple, customizable hooks e.g. dumping into a text file for a now-playing-bar in livestreams or publishing it to your home assistant via MQTT.
Bare-bones, with support for configuration via command line arguments, .env files and a typescript config file.

## Available Hooks
- [MQTT](packages/hooks/mqtt-client) - publish the current track info to a MQTT broker
- [File Dump](packages/hooks/file-dump) - write the current track info to a text file
- [HTTP Server](packages/hooks/http-server) - expose the current track info via a simple HTTP endpoint
- [GeekMagic](packages/hooks/geekmagic) - send the current track's album cover to a [GeekMagic device](https://www.aliexpress.com/store/1102731495)


## Configuration and Development

0. Install [bun](https://bun.sh) and (optionally) [go-task](https://taskfile.dev)

1. Get yourself a last.fm API-Key [here](https://www.last.fm/api/account/create) (you do not need to enter a callback URL for this tool). 

2. go into `packages/core`, copy the `.env.example`-file and rename the copy to `.env`. enter your last.fm API-Key and your last.fm username.

3. Install dependencies:

```shell
bun install
```
4. copy the `config.example.ts` file in `packages/core/src` to `config.ts` and adjust the configuration to your needs. Every hook-package should expose a builder function that can be used to create a hook. 
The hook will be called with the current track info every time it changes.

5. run the tool:

```shell
bun run --bun index.ts
```
from the `packages/core` directory or (if you installed go-task) simply run

```shell
task dev
```
anywhere in the repository.

the following parameter are available

- `--interval <number>` - the interval (in milliseconds)  in which the current track info should be requested and updated (don't set this too low or you might run into API limits)
- `--allow-inactive-tracks` - whether the broker should pass inactive tracks to the hooks; if not set, the broker will only pass actively playing tracks to the hooks
- `--help` - show a help message

## Deployment and Usage
there are multiple ways to deploy and use this tool:

- simply run it on your local machine using `bun run`
- run it in a docker container using the provided Dockerfile (you can build and run the image using `task container:up`)
- compile it to a binary using `task build` and run it on your server

If you have written a cool hook, feel free to open a PR and I might add it to the repository!