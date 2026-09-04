/**
 * Loads outbound notification configuration for forum watch emails.
 *
 * The returned values are consumed by the forums event-bus adapter and
 * notification publisher. Missing template configuration disables notification
 * publishing without affecting forum writes.
 *
 * @returns SendGrid template, Bus API aliases/base, Kafka error topic, and Auth0 M2M values.
 * @throws Does not throw; consumers decide whether optional values are required.
 */
export default () => ({
  notifications: {
    sendgridNotificationTemplate: process.env.SENDGRID_NOTIFICATION_TEMPLATE,
    busApiUrl: process.env.BUSAPI_URL,
    busApiUrlAlias: process.env.BUS_API_URL,
    topcoderApiUrlBase: process.env.TOPCODER_API_URL_BASE,
    kafkaErrorTopic: process.env.KAFKA_ERROR_TOPIC,
    auth0Url: process.env.AUTH0_URL,
    auth0Audience: process.env.AUTH0_AUDIENCE,
    tokenCacheTime: process.env.TOKEN_CACHE_TIME,
    m2mClientId: process.env.M2M_CLIENT_ID,
    m2mClientSecret: process.env.M2M_CLIENT_SECRET,
    auth0ProxyServerUrl: process.env.AUTH0_PROXY_SERVER_URL,
  },
});
