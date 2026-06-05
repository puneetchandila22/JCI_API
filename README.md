# JCI SmartFactory — Dynamic Ingestion API

Fixed envelope, free-form `data`. PLC engineers send any readings; you discover
the schema from real data.

## Setup
1. `npm install`
2. Copy `.env.example` to `.env`, paste your Mongo Atlas connection string.
3. `npm run seed`    # registers all 50 machines, prints machineId + apiKey sheet
4. `npm start`       # starts server on :3000
5. `npm run simulate` # (optional) fakes one PLC push per machine to test

## The contract you give the PLC team
POST /api/v1/ingest/:machineId
Header: x-api-key: <the machine's apiKey>
Body:   { "machineId": "MAXI-01", "timestamp": "...ISO...", "data": { ...readings... } }

`data` can be ANY flat object of readings. Numbers as numbers.

## Reading data back
GET /api/v1/machines                      list machines
GET /api/v1/machines/:id/latest           newest reading
GET /api/v1/machines/:id/history?limit=50 recent readings
GET /api/v1/machines/:id/schema           fields this machine has actually sent
