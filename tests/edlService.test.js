const edlService = require("../src/services/firewall/edlService");

describe("EDL Service", () => {
    beforeEach(() => {

        edlService.indicators.clear();
        edlService.lastUpdated = null;
    });

    test("agrega solo IPs válidas y high/critical", () => {
        const indicators = [
            { id: "1", type: "ip", value: "1.1.1.1", confidence: 80, threat_level: "high", last_seen: "2026-02-01T00:00:00Z" },
            { id: "2", type: "ip", value: "2.2.2.2", confidence: 50, threat_level: "high", last_seen: "2026-02-01T00:00:00Z" },
            { id: "3", type: "domain", value: "malware.com", confidence: 90, threat_level: "critical", last_seen: "2026-02-01T00:00:00Z" },
            { id: "4", type: "ip", value: "3.3.3.3", confidence: 90, threat_level: "low", last_seen: "2026-02-01T00:00:00Z" }
        ];

        edlService.updateEDL(indicators);

        const ips = Array.from(edlService.indicators.keys());
        expect(ips).toEqual(["1.1.1.1"]);
    });

    test("expira indicadores > 30 días", () => {
        const oldDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
        const newDate = new Date().toISOString();

        edlService.updateEDL([{ id: "1", type: "ip", value: "1.1.1.1", confidence: 90, threat_level: "high", last_seen: oldDate }]);
        edlService.updateEDL([{ id: "2", type: "ip", value: "2.2.2.2", confidence: 90, threat_level: "high", last_seen: newDate }]);

        const ips = Array.from(edlService.indicators.keys());
        expect(ips).toEqual(["2.2.2.2"]);
    });

    test("genera EDL plano y metadata", () => {
        const now = new Date().toISOString();
        edlService.updateEDL([{ id: "1", type: "ip", value: "1.1.1.1", confidence: 90, threat_level: "critical", last_seen: now, campaign: { name: "OpTest" } }]);

        const edlText = edlService.getEDL();
        expect(edlText).toContain("1.1.1.1");
        expect(edlText).toContain("OpTest");

        const metadata = edlService.getMetadata();
        expect(metadata.total_ips).toBe(1);
        expect(metadata.threat_levels.critical).toBe(1);
    });
});
