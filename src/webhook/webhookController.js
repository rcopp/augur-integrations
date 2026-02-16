const { processIndicators } = require("./processors/qradarIndicatorProcessor");
const { processFirewallIndicators } = require("./processors/firewallIndicatorProcessor");
const { verifySignature } = require("./webhookService");
const logger = require("../utils/logger");

async function handleWebhook(req, res) {
    try {
        const signature = req.headers["x-augur-signature"];

        if (!verifySignature(req.rawBody, signature)) {
            return res.status(401).json({ error: "invalid_signature" });
        }

        const indicators = req.body.indicators || [];

        // QRadar
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
