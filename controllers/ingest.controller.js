import { Machine } from '../models/machine.model.js';
import { Telemetry } from '../models/telemetry.model.js';

// POST /api/v1/ingest
// The COMPANY sends machineId, machineName, machineType themselves.
// We auto-create the machine the first time we see it (no pre-seeding needed).
//
// Header: x-api-key: <shared project key from .env>
// Body:   { machineId, machineName?, machineType?, timestamp?, data: {...} }
export async function ingest(req, res) {
  try {
    // 1. One shared key for the whole project (simple for the PLC team).
    //    If INGEST_KEY is not set in .env, key check is skipped (dev mode).
    const expected = process.env.INGEST_KEY;
    if (expected && req.headers['x-api-key'] !== expected) {
      return res.status(401).json({ success: false, error: 'Invalid x-api-key' });
    }

    const { machineId, machineName, machineType, timestamp, data } = req.body;

    // 2. machineId + data are the only required things
    if (!machineId) {
      return res.status(400).json({ success: false, error: 'machineId is required' });
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return res.status(400).json({ success: false, error: '`data` must be a JSON object of readings' });
    }

    // 3. Store the reading verbatim — any shape
    await Telemetry.create({
      machineId,
      deviceTs: timestamp ? new Date(timestamp) : null,
      serverTs: new Date(),
      data,
    });

    // 4. Auto-create the machine on first sight; update info + discovered keys.
    //    upsert:true means "create if it doesn't exist, otherwise update".
    await Machine.updateOne(
      { machineId },
      {
        $setOnInsert: { machineId },                     // set only when first created
        $set: {
          ...(machineName ? { name: machineName } : {}),
          ...(machineType ? { type: machineType } : {}),
          status: 'active',
          lastSeen: new Date(),
        },
        $addToSet: { metricsSeen: { $each: Object.keys(data) } },
      },
      { upsert: true }
    );

    return res.status(202).json({ success: true, message: 'reading stored' });
  } catch (err) {
    console.error('ingest error:', err);
    return res.status(500).json({ success: false, error: 'server error' });
  }
}

// GET /api/v1/machines/:machineId/latest
export async function latest(req, res) {
  const doc = await Telemetry.findOne({ machineId: req.params.machineId })
    .sort({ serverTs: -1 })
    .lean();
  if (!doc) return res.status(404).json({ success: false, error: 'no data yet' });
  return res.json({ success: true, data: doc });
}

// GET /api/v1/machines/:machineId/history?limit=50
export async function history(req, res) {
  const limit = Math.min(parseInt(req.query.limit) || 50, 500);
  const docs = await Telemetry.find({ machineId: req.params.machineId })
    .sort({ serverTs: -1 })
    .limit(limit)
    .lean();
  return res.json({ success: true, count: docs.length, data: docs });
}

// GET /api/v1/machines/:machineId/schema  — what fields has this machine actually sent?
export async function discoveredSchema(req, res) {
  const rows = await Telemetry.aggregate([
    { $match: { machineId: req.params.machineId } },
    { $sort: { serverTs: -1 } },
    { $limit: 200 },
    { $project: { fields: { $objectToArray: '$data' } } },
    { $unwind: '$fields' },
    {
      $group: {
        _id: '$fields.k',
        sampleValue: { $first: '$fields.v' },
        type: { $first: { $type: '$fields.v' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  return res.json({ success: true, machineId: req.params.machineId, fields: rows });
}
