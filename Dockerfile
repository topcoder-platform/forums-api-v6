# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=26.12.1
ARG PNPM_VERSION=11.15.1

FROM node:${NODE_VERSION}-alpine3.24@sha256:40cd011b55415bc894e45b02fdd5a5dfde056921b7d23a64c74f80497af48797 AS external-clients

RUN apk upgrade --no-cache \
  && apk add --no-cache ca-certificates git openssh-client

# Freeze each external generated client at the default-branch revision reviewed
# with this dependency refresh; builds must not silently follow moving HEADs.
RUN for client_spec in \
    challenge-api-v6:61636c78e0703c36386838dc7b86876849fe79cf \
    identity-api-v6:c7abbb671adbecbc13a969780364e9516e320faf \
    member-api-v6:a8014c191e5bd2b7ce1d81620d63436628817ade \
    resource-api-v6:f61b88f0f2dc90a9664136b740d8635faa0387fd; do \
      client_repo="${client_spec%:*}"; client_revision="${client_spec#*:}"; \
      git init -q "/clients/${client_repo}" \
      && git -C "/clients/${client_repo}" remote add origin "https://github.com/topcoder-platform/${client_repo}.git" \
      && git -C "/clients/${client_repo}" fetch --depth 1 origin "${client_revision}" \
      && git -C "/clients/${client_repo}" checkout --detach FETCH_HEAD || exit 1; \
    done \
  && identity_client_version="$(node -p "require('/clients/identity-api-v6/packages/identity-prisma-client/package.json').version")" \
  && npm install --prefix /tmp/identity-engines --no-save "@prisma/engines@${identity_client_version}" \
  && cp /tmp/identity-engines/node_modules/@prisma/engines/libquery_engine-linux-musl-openssl-3.0.x.so.node \
    /clients/identity-api-v6/packages/identity-prisma-client/

FROM node:${NODE_VERSION}-alpine3.24@sha256:40cd011b55415bc894e45b02fdd5a5dfde056921b7d23a64c74f80497af48797 AS build
ARG PNPM_VERSION

RUN apk upgrade --no-cache
WORKDIR /usr/src/app
ENV NODE_PATH=/usr/src/app/node_modules
RUN npm install --global pnpm@${PNPM_VERSION}

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tools ./tools
RUN pnpm install --frozen-lockfile

COPY . .
COPY --from=external-clients /clients/challenge-api-v6/packages/challenge-prisma-client /usr/src/challenge-api-v6/packages/challenge-prisma-client
COPY --from=external-clients /clients/identity-api-v6/packages/identity-prisma-client /usr/src/identity-api-v6/packages/identity-prisma-client
COPY --from=external-clients /clients/member-api-v6/packages/member-prisma-client /usr/src/member-api-v6/packages/member-prisma-client
COPY --from=external-clients /clients/resource-api-v6/packages/resources-prisma-client /usr/src/resource-api-v6/packages/resources-prisma-client
RUN DATABASE_URL="postgresql://user:password@localhost:5432/forums" pnpm prisma:generate \
  && pnpm lint \
  && pnpm test --runInBand \
  && pnpm test:dependency-compat \
  && pnpm build \
  && rm -rf node_modules \
  && pnpm install --prod --frozen-lockfile --ignore-scripts \
  && pnpm rebuild @prisma/engines

FROM alpine:3.24@sha256:be2656061b536c1883c4034790e21d0a09c5aaaf51968b89368a3c0371ea2c9a AS production

ARG NODE_VERSION
# Alpine replaces old APK patch versions. Keep the configured Node major while
# accepting maintained patch releases and verify the selected runtime below.
RUN apk upgrade --no-cache \
  && apk add --no-cache "nodejs-current~${NODE_VERSION%%.*}" \
  && test "$(node -p 'process.versions.node.split(".")[0]')" = "${NODE_VERSION%%.*}" \
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
COPY --from=build --chown=app:app /usr/src/app/prisma/migrations ./prisma/migrations
COPY --from=build --chown=app:app /usr/src/app/prisma/schema.prisma ./prisma/schema.prisma
COPY --from=build --chown=app:app /usr/src/app/prisma.config.ts ./prisma.config.ts
COPY --from=build --chown=app:app /usr/src/app/package.json ./package.json
COPY --from=build --chown=app:app --chmod=0555 /usr/src/app/appStartUp.sh ./appStartUp.sh
COPY --from=external-clients --chown=app:app /clients/challenge-api-v6/packages/challenge-prisma-client /usr/src/challenge-api-v6/packages/challenge-prisma-client
COPY --from=external-clients --chown=app:app /clients/identity-api-v6/packages/identity-prisma-client /usr/src/identity-api-v6/packages/identity-prisma-client
COPY --from=external-clients --chown=app:app /clients/member-api-v6/packages/member-prisma-client /usr/src/member-api-v6/packages/member-prisma-client
COPY --from=external-clients --chown=app:app /clients/resource-api-v6/packages/resources-prisma-client /usr/src/resource-api-v6/packages/resources-prisma-client

USER app
EXPOSE 3000

CMD ["./appStartUp.sh"]
