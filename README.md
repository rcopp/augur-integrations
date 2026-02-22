# Augur → IBM QRadar Threat Intelligence Connector

Integration service that ingests threat intelligence indicators from Augur Security and delivers them to IBM QRadar SIEM Reference Data Sets and Maps.
Supports both batch ingestion and real-time webhook updates with HMAC signature validation.

---

## Architecture Overview

The connector acts as an integration bridge between Augur threat intelligence and QRadar correlation infrastructure.

```
Augur Threat Intel
        │
        │  (REST / Webhook)
        ▼
Augur QRadar Connector
        │
        ├── Transform Indicators → QRadar Reference Sets
        ├── Transform Metadata → QRadar Reference Maps
        └── Rate-limited API delivery
                │
                ▼
IBM QRadar SIEM
```

### Data Flow

1. Indicators received from Augur API or webhook
2. Deduplication window applied (5 minutes)
3. Indicators grouped by type (IP, Domain, URL, Hash)
4. QRadar payloads generated:

    * Reference Sets (indicator values)
    * Reference Maps (metadata)
5. Batched delivery to QRadar REST API
6. Retry + rate limiting + error handling

---

## Features

* QRadar Reference Set & Map integration
* Batch processing with configurable size
* Rate limiting (50 req/min default)
* Retry with exponential backoff
* Webhook ingestion with HMAC-SHA256 validation
* Indicator deduplication cache
* Structured JSON logging
* Configurable via environment variables
* Modular integration architecture

---

## Project Structure

```
src/
  config.js
  services/
    qradar-connector/
      connector.js
      qradarClient.js
      transformer.js
  utils/
    logger.js
    rateLimiter.js
    retry.js
  webhook/
    processors/
      qradarIndicatorProcessor.js
    webhookController.js
    webhookService.js
    webhookRouter.js
logs/
tests/
  transformer.test.js
index.js
```

---

## Setup

### Prerequisites

* Node.js 24+
* npm 11+
* IBM QRadar API access (SEC token)

### Install

```bash
npm install
```

### Environment Configuration

Create `.env`:

```
PORT=3000

QRADAR_BASE_URL=https://qradar_url
QRADAR_SEC_TOKEN=your_token_here
QRADAR_API_VERSION=12.0
QRADAR_BATCH_SIZE=100
QRADAR_RATE_LIMIT_PER_MIN=50
QRADAR_TIMEOUT_MS=10000
QRADAR_MAX_RETRIES=3

WEBHOOK_SECRET=webhook_secret

LOG_LEVEL=info
```

---

## Running the Service

```bash
npm start
```

Expected log:

```
Augur QRadar Connector listening on port 3000
```

---

## QRadar Integration

### Reference Sets

Indicators are grouped by type:

| Indicator Type | QRadar Set               |
| -------------- | ------------------------ |
| IP             | AugurThreatIntel_IPs     |
| Domain         | AugurThreatIntel_Domains |
| URL            | AugurThreatIntel_URLs    |
| Hash           | AugurThreatIntel_Hashes  |

Example payload:

```json
{
  "name": "AugurThreatIntel_IPs",
  "element_type": "IP",
  "timeout_type": "LAST_SEEN",
  "data": [
    {
      "value": "192.168.1.100",
      "source": "Augur Security Platform",
      "first_seen": 1733049000000,
      "last_seen": 1734704520000
    }
  ]
}
```

---

### Reference Map (Metadata)

Metadata stored per indicator value:

```json
{
  "name": "AugurThreatIntel_Metadata",
  "data": [
    {
      "outer_key": "192.168.1.100",
      "inner_key": "threat_level",
      "value": "high"
    }
  ]
}
```

Metadata fields:

* indicator_id
* threat_level
* confidence
* threat_actor
* campaign
* tags

---

## Webhook Integration

Health check endpoint:

```
GET /api/health
```

Brings information regarding the current status of the service.

---

Real-time ingestion endpoint:

```
POST /api/webhook/threat-intel
```

Accepts Augur indicators and forwards to QRadar.

### Security

Webhook requests must include HMAC-SHA256 signature:

```
x-augur-signature: <hex>
```

Signature is computed over the raw JSON body:

```
HMAC_SHA256(body, WEBHOOK_SECRET)
```

---

## Testing the Webhook

### Postman Setup
Healthcheck

Send:

```
GET http://localhost:3000/api/health
```

Expected response:

```json
{
  "status": "ok"
}
```

---

Threat Indicators

Body:

```json
{
  "indicators": [
    {
      "id": "ioc-001",
      "type": "ip",
      "value": "45.142.212.61",
      "confidence": 95,
      "threat_level": "critical",
      "first_seen": "2024-12-15T08:30:00Z",
      "last_seen": "2024-12-20T14:22:00Z",
      "tags": ["malware", "c2", "ransomware"],
      "threat_actor": {
        "name": "APT28",
        "confidence": 90
      },
      "campaign": {
        "name": "Operation CloudHopper",
        "status": "active"
      }
    }
  ]
}
```

Pre-request script:

```javascript
const secret = "webhook_secret";
const body = pm.request.body.raw;

const signature = CryptoJS.HmacSHA256(body, secret)
  .toString(CryptoJS.enc.Hex);

pm.request.headers.upsert({
  key: "x-augur-signature",
  value: signature
});
```

Send:

```
POST http://localhost:3000/api/webhook/threat-intel
```

Expected response:

```json
{
  "status": "processed",
  "count": 1
}
```

---

## Deduplication Logic

To prevent rapid duplicate ingestion:

* Indicators hashed by `id + last_seen`
* 5-minute TTL cache
* Only new indicators forwarded to QRadar

Log example:

```
Webhook processed 1 indicators
```

---

## Error Handling

QRadar responses handled:

| Status        | Behavior                 |
| ------------- | ------------------------ |
| 409           | Conflict logged, skipped |
| 422           | Validation error logged  |
| Timeout       | Retry                    |
| Network error | Retry                    |
| Rate limit    | Queued                   |

Retries use exponential backoff.

---

## Configuration Options

| Variable                  | Description          | Default |
|---------------------------|----------------------|---------|
| PORT                      | HTTP server port     | 3000    |
| QRADAR_BASE_URL           | QRadar base URL      | —       |
| QRADAR_SEC_TOKEN          | API SEC token        | —       |
| QRADAR_API_VERSION        | API version          | 12.0    |
| QRADAR_BATCH_SIZE         | Indicators per batch | 100     |
| QRADAR_RATE_LIMIT_PER_MIN | API rate limit       | 50      |
| QRADAR_TIMEOUT_MS         | Request timeout      | 10000   |
| QRADAR_MAX_RETRIES        | Retry attempts       | 3       |
| WEBHOOK_SECRET            | Webhook HMAC secret  | —       |
| LOG_LEVEL                 | Logging level        | info    |
---

## Logging

Structured JSON logging via Winston:

Example:

```json
{
  "level": "debug",
  "message": "QRadar payload transformation",
  "payload": { ... }
}
```

---

## Local Testing Without QRadar

Service runs without QRadar if SEC token absent, but QRadar delivery disabled.

To test transformations only:

**`QRADAR_SEC_TOKEN=dummy`** (in .env file)

```bash
npm start
```

---

## Tests

---

### **`tests/connector.test.js`**

* **Purpose:** Tests the `AugurQRadarConnector` class.
* **Focus:**

   * Batching of indicators for QRadar
   * Sending Reference Sets and Metadata Maps
   * Handling empty arrays or no new indicators
   * Ensures `sendIndicators()` properly delegates to `QRadarClient`

---

### **`tests/indicatorProcess.test.js`**

* **Purpose:** Tests the `indicatorProcessor` logic for the webhook.
* **Focus:**

   * Deduplication of indicators based on TTL (5 min)
   * Hashing function to uniquely identify indicators
   * Correctly sending only "fresh" indicators to the connector
   * Logging behavior when indicators are skipped or processed

---

### **`tests/qradarClient.test.js`**

* **Purpose:** Tests the low-level `QRadarClient` that talks to the QRadar REST API.
* **Focus:**

   * Correct HTTP requests for bulk loading Reference Sets and Maps
   * Handling API errors: 409 Conflict, 422 Validation, connection errors
   * Rate limiting behavior
   * Retry logic with exponential backoff

---

### **`tests/transformer.test.js`**

* **Purpose:** Tests the data transformation logic in `transformer.js`.
* **Focus:**

   * Mapping Augur indicators to QRadar Reference Set format
   * Building Metadata Reference Map payloads
   * Validating timestamp conversions (ISO → epoch ms)
   * Edge cases like missing fields or empty arrays

---

### **`tests/webhookService.test.js`**

* **Purpose:** Tests the webhook signature validation logic.
* **Focus:**

   * Correct HMAC-SHA256 verification of payloads using `WEBHOOK_SECRET`
   * Rejecting invalid or missing signatures
   * Timing-safe comparisons to prevent side-channel attacks

---

### Run all tests with:

```bash
npm test
```

---

## Assumptions

* QRadar Reference Sets already exist
* Indicator types follow Augur schema
* QRadar API v12 compatible
* Webhook source trusted via shared secret

---

## Integration Flow Summary

```
Augur → Webhook → Dedup Cache → Transformer → QRadar Sets
                                     └→ QRadar Maps
```

---

---

# Augur → Firewall EDL

Connector that maintains an **External Dynamic List (EDL)** of malicious IPs and exposes HTTP endpoints for firewall consumption. Additionally, the **Webhook** receives Augur indicators and automatically updates the list.

---

## Features

1. **Webhook**

   * `POST /api/webhook/threat-intel`
   * Deduplication with a 5-minute TTL
   * Only `ip` type indicators, `confidence >= 70`, `high/critical`
   * Updates internal EDL and removes expired indicators (>30 days)

2. **EDL HTTP**

   * `GET /api/edl/malicious-ips` → plaintext list
   * `GET /api/edl/malicious-ips/metadata` → JSON with:

      * `total_ips`
      * `threat_levels`
      * `oldest_indicator` / `newest_indicator`
      * `expired_count`
   * Basic Authentication required
   * Cache-Control 5 minutes

3. **EDL Service**

   * Maintains the list of IPs in memory
   * Generates plaintext EDL and metadata dynamically
   * Expires IPs >30 days
   * Filters out invalid or non-relevant indicators

## Setup

```bash
# Environment variables
EDL_USER=admin
EDL_PASSWORD=secret
PORT=3000
WEBHOOK_SECRET=<wh_secret>
```

## Run

```bash
npm start
```

* Webhook listens on: `/api/webhook/threat-intel`
* EDL endpoints available at:

   * `/api/edl/malicious-ips`
   * `/api/edl/malicious-ips/metadata`

## Tests

* `tests/edlService.test.js` → EDL logic: filters, expiration, metadata
* `tests/firewallRouter.test.js` → HTTP endpoints and Basic Auth
* `tests/firewallController.test.js` → unit tests for `getEDL` and `getMetadata`
* Run all tests with:

```bash
npm test
```

## Usage Example

**Webhook POST with cURL:**

```bash
curl -X POST http://localhost:3000/api/webhook/threat-intel \
  -H "Content-Type: application/json" \
  -H "x-augur-signature: <hmac_sha256_signature>" \
  -d '{
    "indicators": [
      {
        "id": "ioc-1",
        "type": "ip",
        "value": "1.2.3.4",
        "last_seen": "2026-02-15T00:00:00Z",
        "confidence": 90,
        "threat_level": "high"
      }
    ]
  }'
```

## EDL Consumption

```

curl -u admin:secret http://localhost:3000/api/edl/malicious-ips
curl -u admin:secret http://localhost:3000/api/edl/malicious-ips/metadata

```

## Integration Flow Summary

```

Augur Security → Webhook → edlService → (EDL HTTP)
↓
Palo Alto Firewall (fetch)

```

## Docker setup

This project can be run using Docker for easier local testing and deployment.

### Build image

```bash
docker build -t augur-integration
```

### Run container

```bash
docker run -p 3000:3000 \
-e QRADAR_BASE_URL=https://qradar_url \
-e QRADAR_SEC_TOKEN=token \
-e WEBHOOK_SECRET=secret \
augur-integration
```

#### The service will be available at:

* Webhook: POST /webhook/threat-intel

* Firewall EDL: GET /edl/malicious-ips

* Firewall Metadata: GET /edl/metadata-ips/metadata