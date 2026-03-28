const axios = require("axios");
const retry = require("../../utils/retry");
const RateLimiter = require("../../utils/rateLimiter");
const config = require("../../config");
const logger = require('../../utils/logger');

class QRadarClient {
    constructor() {
        if (!config.qradar.secToken) {
            throw new Error("QRadar SEC token missing");
        }

        this.http = axios.create({
            baseURL: `${config.qradar.baseUrl}/api`,
            timeout: config.qradar.timeoutMs,
            headers: {
                "SEC": config.qradar.secToken,
                "Version": config.qradar.apiVersion,
                "Content-Type": "application/json"
            }
        });

        this.limiter = new RateLimiter(config.qradar.rateLimitPerMin);
    }

    async bulkLoadSet(name, payload) {
        return this._post(`/reference_data/sets/bulk_load/${name}`, payload);
    }

    async bulkLoadMap(name, payload) {
        return this._post(`/reference_data/maps/bulk_load/${name}`, payload);
    }

    async _post(path, payload) {
        await this.limiter.acquire();

        return retry(async () => {
            try {
                return await this.http.post(path, payload);
            } catch (err) {
                if (err.response) {
                    const status = err.response.status;

                    if (status === 409) {
                        logger.warn("QRadar conflict:", err.response.data);
                        return;
                    }

                    if (status === 422) {
                        logger.error("QRadar validation error:", err.response.data);
                        return;
                    }
                }
                throw err;
            }
        }, config.qradar.maxRetries);
    }
}

module.exports = QRadarClient;
