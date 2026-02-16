const logger = require("../../utils/logger");
const edlService = require("./edlService");

async function getEDL(req, res) {
    try {
        const edlText = edlService.getEDL();

        res.setHeader("Content-Type", "text/plain");
        res.setHeader("Cache-Control", "public, max-age=300"); // 5 minutos
        res.send(edlText);
    } catch (err) {
        logger.error("Error generating EDL", err);
        res.status(500).json({ error: "failed_to_generate_edl" });
    }
}

async function getMetadata(req, res) {
    try {
        const metadata = edlService.getMetadata();
        res.json(metadata);
    } catch (err) {
        logger.error("Error generating EDL metadata", err);
        res.status(500).json({ error: "failed_to_generate_metadata" });
    }
}

module.exports = {
    getEDL,
    getMetadata
};
