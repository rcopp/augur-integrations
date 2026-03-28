const logger = require("../../utils/logger");

const EDL_TTL = 24 * 60 * 60 * 1000;
const EXP_DAYS = 30;

class EDLService {
    constructor() {
        // Map key=id o IP, value={ indicator, timestamp }
        this.indicators = new Map();
        this.lastUpdated = null;
    }

    // Updates list with new indicators
    updateEDL(newIndicators) {
        const now = Date.now();

        for (const ind of newIndicators) {
            if (!ind?.type || ind.type !== "ip") continue;
            if (ind.confidence < 70) continue;
            if (!["high", "critical"].includes(ind.threat_level)) continue;

            this.indicators.set(ind.value, { ...ind, addedAt: now });
        }

        // Expiration
        for (const [ip, ind] of this.indicators.entries()) {
            const lastSeen = new Date(ind.last_seen).getTime();
            if (now - lastSeen > EXP_DAYS * EDL_TTL) {
                this.indicators.delete(ip);
            }
        }

        this.lastUpdated = new Date().toISOString();
        logger.info(`EDL updated: ${this.indicators.size} IPs`);
    }

    // Raw string EDL
    getEDL() {
        const lines = [
            `# Augur Security - Malicious IP Block List`,
            `# Last Updated: ${this.lastUpdated || new Date().toISOString()}`,
            `# Total IPs: ${this.indicators.size}`
        ];

        for (const ind of this.indicators.values()) {
            lines.push(`# IOC: ${ind.id} | Threat: ${ind.threat_level} | Campaign: ${ind.campaign?.name || "N/A"} | Last Seen: ${ind.last_seen}`);
            lines.push(ind.value);
        }

        return lines.join("\n");
    }

    // JSON metadata
    getMetadata() {
        const counts = { high: 0, critical: 0 };

        for (const ind of this.indicators.values()) {
            if (ind.threat_level === "high") counts.high++;
            if (ind.threat_level === "critical") counts.critical++;
        }

        const sorted = Array.from(this.indicators.values()).sort((a, b) => new Date(a.last_seen) - new Date(b.last_seen));

        return {
            last_updated: this.lastUpdated,
            total_ips: this.indicators.size,
            threat_levels: counts,
            oldest_indicator: sorted.length ? sorted[0].last_seen : null,
            newest_indicator: sorted.length ? sorted[sorted.length - 1].last_seen : null,
        };
    }
}

module.exports = new EDLService();
