const { processFirewallIndicators } = require("./processors/firewallIndicatorProcessor");
const { verifySignature } = require("./webhookService");
const logger = require("../utils/logger");
const AugurQRadarConnector = require("../services/qradar-connector/connector");
const {createProcessor} = require("./processors/qradarIndicatorProcessor");

async function handleWebhook(req, res) {
    try {
        const signature = req.headers["x-augur-signature"];

        if (!verifySignature(req.rawBody, signature)) {
            return res.status(401).json({ error: "invalid_signature" });
        }

        const indicators = req.body.indicators || [];

        // QRadar
        const connector = new AugurQRadarConnector();
        const { processIndicators } = createProcessor(connector);
        await processIndicators(indicators);

        // Firewall EDL
        await processFirewallIndicators(indicators)

        res.json({
            status: "processed",
            count: indicators.length
        });
    } catch (err) {
        logger.error("Webhook processing failed", err);
        res.status(500).json({ error: "processing_failed" });
    }
}

module.exports = { handleWebhook };
