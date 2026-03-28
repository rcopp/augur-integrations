const crypto = require("crypto");
const config = require("../config");

function verifySignature(rawBody, signature) {
    if (!signature || !rawBody) return false;

    const expected = crypto
        .createHmac("sha256", config.webhook.webhookSecret)
        .update(rawBody)
        .digest("hex");

    try {
        return crypto.timingSafeEqual(
            Buffer.from(expected, "hex"),
            Buffer.from(signature, "hex")
        );
    } catch {
        return false;
    }
}

module.exports = { verifySignature };
