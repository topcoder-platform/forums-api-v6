const DEFAULT_VALID_ISSUERS =
  '["https://api.topcoder.com","https://api.topcoder-dev.com","https://topcoder-dev.auth0.com/","https://auth.topcoder-dev.com/","https://topcoder.auth0.com/","https://auth.topcoder.com/"]';

/**
 * Loads authentication configuration used by the token validation pipeline.
 *
 * @returns JWT secret and valid issuer values compatible with tc-core-library-js.
 * @throws Does not throw; missing required values are validated by consumers.
 */
export default () => ({
  auth: {
    authSecret: process.env.AUTH_SECRET,
    validIssuers: process.env.VALID_ISSUERS ?? DEFAULT_VALID_ISSUERS,
  },
});
