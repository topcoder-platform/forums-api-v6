/**
 * Loads outbound notification configuration for forum watch emails.
 *
 * The returned values are consumed by the forums event-bus adapter and
 * notification publisher. Missing template configuration disables notification
 * publishing without affecting forum writes.
 *
 * @returns SendGrid template, Bus, Challenge API, and public web bases, Kafka error topic, and Keycloak M2M values.
 * @throws Does not throw; consumers decide whether optional values are required.
 */
export default () => ({
  notifications: {
    sendgridNotificationTemplate: process.env.SENDGRID_NOTIFICATION_TEMPLATE,
    busApiUrl: process.env.BUSAPI_URL,
    busApiUrlAlias: process.env.BUS_API_URL,
    topcoderApiUrlBase: process.env.TOPCODER_API_URL_BASE,
    topcoderUrl: process.env.TOPCODER_URL,
    challengeApiUrl: process.env.CHALLENGE_API_URL,
    kafkaErrorTopic: process.env.KAFKA_ERROR_TOPIC,
    keycloakTokenUrl: process.env.KEYCLOAK_TOKEN_URL,
    keycloakAudience: process.env.KEYCLOAK_AUDIENCE,
    tokenCacheTime: process.env.TOKEN_CACHE_TIME,
    m2mClientId: process.env.KEYCLOAK_CLIENT_ID,
    m2mClientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
  },
});
