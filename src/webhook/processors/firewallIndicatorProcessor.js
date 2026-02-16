const edlService = require("../../services/firewall/edlService");

const cache = new Map();
const TTL = 5 * 60 * 1000; // 5 min

function hashIndicator(ind) {
    return `${ind.id}:${ind.last_seen}`;
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
    return fresh;
}

async function processFirewallIndicators(indicators) {
    if (!Array.isArray(indicators) || indicators.length === 0) return;

    const fresh = dedupe(indicators);

    if (!fresh.length) return;

    const ipIndicators = fresh.filter(ind => ind.type === "ip");

    edlService.updateEDL(ipIndicators);
}

module.exports = {
    processFirewallIndicators
};
