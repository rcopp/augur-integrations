const { getEDL, getMetadata } = require("..//src/services/firewall/firewallController");
const edlService = require("../src/services/firewall/edlService");

describe("Firewall Controller", () => {
    let res;

    beforeEach(() => {
        edlService.indicators.clear();
        edlService.lastUpdated = null;

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn(),
            setHeader: jest.fn(),
        };
    });

    test("getEDL devuelve texto plano con headers", async () => {
        edlService.updateEDL([
            { id: "1", type: "ip", value: "1.1.1.1", confidence: 90, threat_level: "high", last_seen: new Date().toISOString() },
        ]);

        await getEDL({}, res);

        expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/plain");
        expect(res.setHeader).toHaveBeenCalledWith("Cache-Control", "public, max-age=300");
        expect(res.send).toHaveBeenCalledWith(expect.stringContaining("1.1.1.1"));
    });

    test("getMetadata devuelve JSON con metadata correcta", async () => {
        edlService.updateEDL([
            { id: "1", type: "ip", value: "1.1.1.1", confidence: 90, threat_level: "critical", last_seen: new Date().toISOString() },
        ]);

        await getMetadata({}, res);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            total_ips: 1,
            threat_levels: { critical: 1, high: 0 },
        }));
    });

    test("maneja errores en getEDL", async () => {
        jest.spyOn(edlService, "getEDL").mockImplementation(() => { throw new Error("boom"); });

        await getEDL({}, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "failed_to_generate_edl" });

        edlService.getEDL.mockRestore();
    });

    test("maneja errores en getMetadata", async () => {
        jest.spyOn(edlService, "getMetadata").mockImplementation(() => { throw new Error("boom"); });

        await getMetadata({}, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: "failed_to_generate_metadata" });

        edlService.getMetadata.mockRestore();
    });
});
