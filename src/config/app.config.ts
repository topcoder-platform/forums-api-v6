/**
 * Parses an optional boolean environment setting.
 *
 * @param value Raw environment value.
 * @returns True only for an explicit `true` value.
 * @throws Does not throw.
 */
function parseBoolean(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === 'true';
}

/**
 * Loads application-level configuration values from the environment.
 *
 * @returns Port, runtime environment, and request-bound trust settings used by the Nest bootstrap.
 * @throws Does not throw; defaults are applied when optional values are absent.
 */
export default () => ({
  app: {
    env: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 3000),
    trustForwardedClientIp: parseBoolean(process.env.TRUST_FORWARDED_CLIENT_IP),
  },
});
