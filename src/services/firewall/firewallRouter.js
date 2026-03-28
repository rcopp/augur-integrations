const express = require("express");
const { getEDL, getMetadata } = require("./firewallController");
const config = require("../../config");

const router = express.Router();

// Basic auth
function basicAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Basic ")) {
        res.setHeader("WWW-Authenticate", 'Basic realm="EDL"');
        return res.status(401).send("Authentication required");
    }

    const base64Credentials = authHeader.split(" ")[1];
    const credentials = Buffer.from(base64Credentials, "base64").toString("ascii");
    const [username, password] = credentials.split(":");

    if (
        username === config.edlAuth.username &&
        password === config.edlAuth.password
    ) {
        return next();
    }

    res.setHeader("WWW-Authenticate", 'Basic realm="EDL"');
    return res.status(401).send("Invalid credentials");
}

// Base endpoint EDL
router.get("/edl/malicious-ips", basicAuth, getEDL);

// Metadata endpoint EDL
router.get("/edl/malicious-ips/metadata", basicAuth, getMetadata);

module.exports = router;
