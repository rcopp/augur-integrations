const QRadarClient = require("./qradarClient");
const config = require("../../config");
const logger = require('../../utils/logger');
const {
    groupByType,
    buildSetPayload,
    buildMetadataPayload
} = require("./transformer");

class AugurQRadarConnector {
    constructor() {
        this.client = new QRadarClient();
    }

    async sendIndicators(indicators) {
        if (!Array.isArray(indicators) || indicators.length === 0) return;

        const batches = this._chunk(indicators, config.qradar.batchSize);

        for (const batch of batches) {
            await this._processBatch(batch);
        }
    }

    async _processBatch(indicators) {
        const grouped = groupByType(indicators);

        // Send reference sets per type
        for (const [type, inds] of Object.entries(grouped)) {
            const payload = buildSetPayload(type, inds);

            // Logs payload transformation
            logger.debug('QRadar payload transformation', { payload });

            await this.client.bulkLoadSet(payload.name, payload);
        }

        // Send metadata map
        const metadataPayload = buildMetadataPayload(indicators);

        //Logs metadata transformation
        logger.debug('QRadar metadata transformation', { indicators });

        await this.client.bulkLoadMap(metadataPayload.name, metadataPayload);
    }

    _chunk(arr, size) {
        const chunks = [];
        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size));
        }
        return chunks;
    }
}

module.exports = AugurQRadarConnector;
