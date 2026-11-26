# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=26.13.1
ARG PNPM_VERSION=11.15.1

FROM node:${NODE_VERSION}-alpine3.24@sha256:6bd9ab43c0ec0190ca7b2d193906cb8b7edf6e7f4afa43ddeccd6452710bffb5 AS external-clients

RUN apk upgrade --no-cache \
  && apk add --no-cache ca-certificates git openssh-client

# Freeze each external generated client at the default-branch revision reviewed
# with this dependency refresh; builds must not silently follow moving HEADs.
RUN for client_spec in \
    challenge-api-v6:8c2bc0d9e1e879bd750d160bd57a041496e075fb \
    identity-api-v6:7576802a1bb1d156f42d9e77362a0ef8d2bc218a \
    member-api-v6:c356006aab49b5cc71cbdaf0133f102661772c54 \
    resource-api-v6:839e585494df48834c02516038e9a7ef79226a47; do \
      client_repo="${client_spec%:*}"; client_revision="${client_spec#*:}"; \
      git init -q "/clients/${client_repo}" \
      && git -C "/clients/${client_repo}" remote add origin "https://github.com/topcoder-platform/${client_repo}.git" \
      && git -C "/clients/${client_repo}" fetch --depth 1 origin "${client_revision}" \
      && git -C "/clients/${client_repo}" checkout --detach FETCH_HEAD || exit 1; \
    done

FROM node:${NODE_VERSION}-alpine3.24@sha256:6bd9ab43c0ec0190ca7b2d193906cb8b7edf6e7f4afa43ddeccd6452710bffb5 AS build
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
RUN apk upgrade --no-cache \
  && apk add --no-cache 'libcrypto3>=3.5.9-r1' 'libssl3>=3.5.9-r1' 'nodejs-current~26.13.1' \
  && test "$(node -p 'process.versions.node')" = "${NODE_VERSION}" \
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
