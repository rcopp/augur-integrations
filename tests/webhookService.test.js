const crypto = require("crypto");
const { verifySignature } = require("../src/webhook/webhookService");

describe("webhookService", () => {
    const secret = "test_secret";

    test("valid signature", () => {
        const body = Buffer.from('{"a":1}');
        const sig = crypto
            .createHmac("sha256", secret)
            .update(body)
            .digest("hex");

        process.env.WEBHOOK_SECRET = secret;

        expect(verifySignature(body, sig)).toBe(true);
    });

    test("invalid signature", () => {
        const body = Buffer.from('{"a":1}');
        expect(verifySignature(body, "bad")).toBe(false);
    });
});
