# syntax=docker/dockerfile:1

FROM node:24.15.0-bookworm-slim AS base

RUN apt-get update \
  && apt-get install --yes --no-install-recommends ca-certificates git openssh-client openssl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /usr/src/app
RUN npm install --global pnpm@10.33.2

FROM base AS external-clients

RUN git clone --depth 1 https://github.com/topcoder-platform/challenge-api-v6.git /clients/challenge-api-v6 \
  && git clone --depth 1 https://github.com/topcoder-platform/identity-api-v6.git /clients/identity-api-v6 \
  && git clone --depth 1 https://github.com/topcoder-platform/member-api-v6.git /clients/member-api-v6 \
  && git clone --depth 1 https://github.com/topcoder-platform/resource-api-v6.git /clients/resource-api-v6

FROM base AS build

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
COPY --from=external-clients /clients/challenge-api-v6/packages/challenge-prisma-client /usr/src/challenge-api-v6/packages/challenge-prisma-client
COPY --from=external-clients /clients/identity-api-v6/packages/identity-prisma-client /usr/src/identity-api-v6/packages/identity-prisma-client
COPY --from=external-clients /clients/member-api-v6/packages/member-prisma-client /usr/src/member-api-v6/packages/member-prisma-client
COPY --from=external-clients /clients/resource-api-v6/packages/resources-prisma-client /usr/src/resource-api-v6/packages/resources-prisma-client
RUN DATABASE_URL="postgresql://user:password@localhost:5432/forums" pnpm prisma:generate \
  && pnpm build \
  && pnpm prune --prod

FROM node:24.15.0-bookworm-slim AS production

ENV NODE_ENV=production
WORKDIR /usr/src/app

COPY --from=build --chown=node:node /usr/src/app/dist ./dist
COPY --from=build --chown=node:node /usr/src/app/node_modules ./node_modules
COPY --from=build --chown=node:node /usr/src/app/prisma/generated ./prisma/generated
COPY --from=build --chown=node:node /usr/src/app/package.json ./package.json
COPY --from=external-clients --chown=node:node /clients/challenge-api-v6/packages/challenge-prisma-client /usr/src/challenge-api-v6/packages/challenge-prisma-client
COPY --from=external-clients --chown=node:node /clients/identity-api-v6/packages/identity-prisma-client /usr/src/identity-api-v6/packages/identity-prisma-client
COPY --from=external-clients --chown=node:node /clients/member-api-v6/packages/member-prisma-client /usr/src/member-api-v6/packages/member-prisma-client
COPY --from=external-clients --chown=node:node /clients/resource-api-v6/packages/resources-prisma-client /usr/src/resource-api-v6/packages/resources-prisma-client

USER node
EXPOSE 3000

CMD ["node", "dist/main.js"]
