/**
 * Loads application-level configuration values from the environment.
 *
 * @returns Port and runtime environment values used by the Nest bootstrap.
 * @throws Does not throw; defaults are applied when optional values are absent.
 */
export default () => ({
  app: {
    env: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 3000),
  },
});
