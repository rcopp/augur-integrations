const config = require("../../config");

function toEpochMs(ts) {
    return ts ? new Date(ts).getTime() : undefined;
}

function groupByType(indicators) {
    const map = {};
    for (const i of indicators) {
        if (!map[i.type]) map[i.type] = [];
        map[i.type].push(i);
    }
    return map;
}

function buildSetPayload(type, indicators) {
    return {
        name: config.referenceSets[type],
        element_type: type.toUpperCase(),
        timeout_type: "LAST_SEEN",
        data: indicators.map(i => ({
            value: i.value,
            source: "Augur Security Platform",
            first_seen: toEpochMs(i.first_seen),
            last_seen: toEpochMs(i.last_seen)
        }))
    };
}

function buildMetadataPayload(indicators) {
    const data = [];

    for (const i of indicators) {
        const key = i.value;

        data.push({ outer_key: key, inner_key: "indicator_id", value: i.id });
        data.push({ outer_key: key, inner_key: "threat_level", value: i.threat_level });
        data.push({ outer_key: key, inner_key: "confidence", value: i.confidence });

        if (i.threat_actor?.name)
            data.push({ outer_key: key, inner_key: "threat_actor", value: i.threat_actor.name });

        if (i.campaign?.name)
            data.push({ outer_key: key, inner_key: "campaign", value: i.campaign.name });

        if (i.tags?.length)
            data.push({ outer_key: key, inner_key: "tags", value: i.tags.join(",") });
    }

    return {
        name: config.metadataMap,
        element_type: "ALN",
        data
    };
}

module.exports = {
    groupByType,
    buildSetPayload,
    buildMetadataPayload
};