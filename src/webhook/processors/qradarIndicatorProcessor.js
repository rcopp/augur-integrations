const crypto = require("crypto");
const logger = require("../../utils/logger");
const AugurQRadarConnector = require("../../services/qradar-connector/connector");

const cache = new Map();
const TTL = 5 * 60 * 1000; // 5 min

// Dependency injection
const connectorInstance = (passedConnector) => passedConnector || new AugurQRadarConnector();

function hashIndicator(ind) {
    return crypto
        .createHash("sha1")
        .update(`${ind.id}:${ind.last_seen}`)
        .digest("hex");
}

function dedupe(indicators) {
    const now = Date.now();
    const fresh = [];

    for (const ind of indicators) {
        if (!ind?.id || !ind?.last_seen) continue;

        const key = hashIndicator(ind);

        if (!cache.has(key) || now - cache.get(key) > TTL) {
            cache.set(key, now);
            fresh.push(ind);
        }
    }

    // Cleanup
    for (const [k, ts] of cache.entries()) {
        if (now - ts > TTL) cache.delete(k);
    }

    return fresh;
}
function createProcessor(connector) {
    async function processIndicators(indicators, connector = null) {
        if (!Array.isArray(indicators) || indicators.length === 0) {
            logger.warn("Webhook received empty indicators");
            return;
        }

        const fresh = dedupe(indicators);

        if (!fresh.length) {
            logger.info("Webhook deduplicated indicators");
            return;
        }

        await connectorInstance(connector).sendIndicators(fresh);

        logger.info(`Webhook processed ${fresh.length} indicators`);
    }

    return { processIndicators };
}


module.exports = {
    createProcessor
};
