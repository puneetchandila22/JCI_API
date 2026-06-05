# JCI SmartFactory — Dynamic Ingestion API (company-driven)

The company sends machineId, machineName, machineType + readings.
We auto-create the machine on first sight. No pre-seeding required.

## Setup
1. npm install
2. Copy .env.example to .env, set MONGO_URI (Atlas) and INGEST_KEY.
3. npm start

## The contract you give the PLC company
POST https://jci-api.onrender.com/api/v1/ingest
Header: x-api-key: <the shared INGEST_KEY>
Body:
{
  "machineId":   "MAXI-01",
  "machineName": "Maxi Dyeing Machine",
  "machineType": "maxi",
  "timestamp":   "2026-06-05T10:30:00Z",
  "data": { ...any readings, flat, numbers as numbers... }
}

Only machineId and data are required. machineName/machineType are stored on first sight.

## Read data back
GET /api/v1/machines                       list all (auto-created) machines
GET /api/v1/machines/:id/latest            newest reading
GET /api/v1/machines/:id/history?limit=50  recent readings
GET /api/v1/machines/:id/schema            fields a machine has actually sent
