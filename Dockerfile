# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=26.5.1
ARG PNPM_VERSION=11.15.1

FROM node:${NODE_VERSION}-alpine AS external-clients

RUN apk upgrade --no-cache \
  && apk add --no-cache ca-certificates git openssh-client

RUN git clone --depth 1 https://github.com/topcoder-platform/challenge-api-v6.git /clients/challenge-api-v6 \
  && git clone --depth 1 https://github.com/topcoder-platform/identity-api-v6.git /clients/identity-api-v6 \
  && git clone --depth 1 https://github.com/topcoder-platform/member-api-v6.git /clients/member-api-v6 \
  && git clone --depth 1 https://github.com/topcoder-platform/resource-api-v6.git /clients/resource-api-v6 \
  && identity_client_version="$(node -p "require('/clients/identity-api-v6/packages/identity-prisma-client/package.json').version")" \
  && npm install --prefix /tmp/identity-engines --no-save "@prisma/engines@${identity_client_version}" \
  && cp /tmp/identity-engines/node_modules/@prisma/engines/libquery_engine-linux-musl-openssl-3.0.x.so.node \
    /clients/identity-api-v6/packages/identity-prisma-client/

FROM node:${NODE_VERSION}-alpine AS build

RUN apk upgrade --no-cache
WORKDIR /usr/src/app
RUN npm install --global pnpm@${PNPM_VERSION}

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
COPY --from=external-clients /clients/challenge-api-v6/packages/challenge-prisma-client /usr/src/challenge-api-v6/packages/challenge-prisma-client
COPY --from=external-clients /clients/identity-api-v6/packages/identity-prisma-client /usr/src/identity-api-v6/packages/identity-prisma-client
COPY --from=external-clients /clients/member-api-v6/packages/member-prisma-client /usr/src/member-api-v6/packages/member-prisma-client
COPY --from=external-clients /clients/resource-api-v6/packages/resources-prisma-client /usr/src/resource-api-v6/packages/resources-prisma-client
RUN DATABASE_URL="postgresql://user:password@localhost:5432/forums" pnpm prisma:generate \
  && pnpm lint \
  && pnpm build \
  && rm -rf node_modules \
  && pnpm install --prod --frozen-lockfile --ignore-scripts

FROM alpine:3.24 AS production

ARG NODE_VERSION
RUN apk upgrade --no-cache \
  && apk add --no-cache nodejs-current=${NODE_VERSION}-r0 \
  && addgroup -S app \
  && adduser -S -D -H -u 10001 -G app app

# External Prisma clients are copied beside the application under /usr/src.
# Expose the application's production dependencies to their CommonJS imports.
ENV NODE_ENV=production \
  NODE_PATH=/usr/src/app/node_modules
WORKDIR /usr/src/app

COPY --from=build --chown=app:app /usr/src/app/dist ./dist
COPY --from=build --chown=app:app /usr/src/app/node_modules ./node_modules
COPY --from=build --chown=app:app /usr/src/app/prisma/generated ./prisma/generated
COPY --from=build --chown=app:app /usr/src/app/package.json ./package.json
COPY --from=external-clients --chown=app:app /clients/challenge-api-v6/packages/challenge-prisma-client /usr/src/challenge-api-v6/packages/challenge-prisma-client
COPY --from=external-clients --chown=app:app /clients/identity-api-v6/packages/identity-prisma-client /usr/src/identity-api-v6/packages/identity-prisma-client
COPY --from=external-clients --chown=app:app /clients/member-api-v6/packages/member-prisma-client /usr/src/member-api-v6/packages/member-prisma-client
COPY --from=external-clients --chown=app:app /clients/resource-api-v6/packages/resources-prisma-client /usr/src/resource-api-v6/packages/resources-prisma-client

USER app
EXPOSE 3000

CMD ["node", "dist/main.js"]
