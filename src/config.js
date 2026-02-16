require("dotenv").config();

module.exports = {
    port: process.env.PORT || 3000,
    edlAuth: {
        username: process.env.EDL_USER || "admin",
        password: process.env.EDL_PASS || "secret"
    },
    webhook: {
        webhookSecret: process.env.WEBHOOK_SECRET,
    },
    qradar: {
        baseUrl: process.env.QRADAR_URL,
        secToken: process.env.QRADAR_SEC_TOKEN,
        apiVersion: process.env.QRADAR_API_VERSION || "12.0",
        timeoutMs: parseInt(process.env.QRADAR_TIMEOUT_MS || "10000"),
        maxRetries: parseInt(process.env.QRADAR_MAX_RETRIES || "3"),
        batchSize: parseInt(process.env.QRADAR_BATCH_SIZE || "100"),
        rateLimitPerMin: parseInt(process.env.QRADAR_RATE_LIMIT || "50")
    },
    referenceSets: {
        ip: "AugurThreatIntel_IPs",
        domain: "AugurThreatIntel_Domains",
        url: "AugurThreatIntel_URLs",
        hash: "AugurThreatIntel_Hashes"
    },
    metadataMap: "AugurThreatIntel_Metadata"
};
