/**
 * Loads database connection configuration for the forums service.
 *
 * @returns Forums database URL plus cross-service URLs from `CHALLENGE_DB_URL`
 * (`CHALLENGES_DB_URL` alias), `RESOURCE_DB_URL` (`RESOURCES_DB_URL` alias),
 * `IDENTITY_DB_URL`, `MEMBER_DB_URL`, and importer-only `VANILLA_DB_URL`.
 * @throws Does not throw; missing URLs are reported by `DbService` at runtime.
 */
export default () => ({
  database: {
    url: process.env.FORUMS_DATABASE_URL ?? process.env.DATABASE_URL,
    challengeUrl: process.env.CHALLENGE_DB_URL ?? process.env.CHALLENGES_DB_URL,
    resourceUrl: process.env.RESOURCE_DB_URL ?? process.env.RESOURCES_DB_URL,
    identityUrl: process.env.IDENTITY_DB_URL,
    memberUrl: process.env.MEMBER_DB_URL,
    vanillaUrl: process.env.VANILLA_DB_URL,
  },
});
