/**
 * Loads authentication configuration used by the token validation pipeline.
 *
 * @returns JWT secret and valid issuer values compatible with tc-core-library-js.
 * @throws Does not throw; missing required values are validated by consumers.
 */
export default () => ({
  auth: {
    authSecret: process.env.AUTH_SECRET,
    validIssuers: process.env.VALID_ISSUERS ?? '[]',
  },
});
