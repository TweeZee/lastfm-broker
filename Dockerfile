FROM oven/bun
WORKDIR /app
COPY . .
RUN bun install
WORKDIR /app/packages/core

CMD ["bun", "dev"]
# TODO EXPOSE port from config/env