const express = require("express");
const config = require("./src/config");
const logger = require("./src/utils/logger");
const AugurQRadarConnector = require("./src/services/qradar-connector/connector");
const webhookRouter = require("./src/webhook/webhookRouter");
const firewallRouter = require("./src/services/firewall/firewallRouter");

const app = express();
// const connector = new AugurQRadarConnector();

// Express
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));

// Firewall basepath
app.use("/api/firewall", firewallRouter);

// Webhook basepath
app.use("/api/webhooks", webhookRouter);

// Health check
app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});

// Server start
app.listen(config.port, () => {
    logger.info(`Augur Security - Threat Intelligence listening on port ${config.port}`);
});
