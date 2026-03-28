const request = require("supertest");
const express = require("express");
const firewallRouter = require("../src/services/firewall/firewallRouter");
const edlService = require("../src/services/firewall/edlService");

const app = express();
app.use("/api", firewallRouter);

const user = "admin";
const pass = "secret";

beforeEach(() => {
    edlService.indicators.clear();
    edlService.lastUpdated = null;
});

describe("Firewall EDL Router", () => {
    test("requiere autenticación básica", async () => {
        const res = await request(app).get("/api/edl/malicious-ips");
        expect(res.status).toBe(401);
    });

    test("devuelve EDL con credenciales correctas", async () => {
        edlService.updateEDL([{ id: "1", type: "ip", value: "1.1.1.1", confidence: 90, threat_level: "high", last_seen: new Date().toISOString() }]);

        const res = await request(app)
            .get("/api/edl/malicious-ips")
            .auth(user, pass);

        expect(res.status).toBe(200);
        expect(res.text).toContain("1.1.1.1");
    });

    test("devuelve metadata con credenciales correctas", async () => {
        edlService.updateEDL([{ id: "1", type: "ip", value: "1.1.1.1", confidence: 90, threat_level: "critical", last_seen: new Date().toISOString() }]);

        const res = await request(app)
            .get("/api/edl/malicious-ips/metadata")
            .auth(user, pass);

        expect(res.status).toBe(200);
        expect(res.body.total_ips).toBe(1);
    });
});
