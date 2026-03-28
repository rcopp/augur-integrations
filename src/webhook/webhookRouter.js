const express = require("express");
const { handleWebhook } = require("./webhookController");

const router = express.Router();

router.post("/threat-intel", handleWebhook);

module.exports = router;
