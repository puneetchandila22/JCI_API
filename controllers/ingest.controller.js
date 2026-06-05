import { Machine } from '../models/machine.model.js';
import { Telemetry } from '../models/telemetry.model.js';

// POST /api/v1/ingest/:machineId   (PLC engineers call this)
// Header: x-api-key: <machine apiKey>
// Body:   { machineId, timestamp, data: { ...any readings... } }
export async function ingest(req, res) {
  try {
    const { machineId } = req.params;
    const apiKey = req.headers['x-api-key'];

    // 1. Authenticate the machine by id + key (the only thing that's fixed)
    const machine = await Machine.findOne({ machineId });
    if (!machine) {
      return res.status(404).json({ success: false, error: 'Unknown machineId' });
    }
    if (!apiKey || apiKey !== machine.apiKey) {
      return res.status(401).json({ success: false, error: 'Invalid or missing x-api-key' });
    }

    // 2. Validate ONLY the envelope — never the shape of `data`
    const { timestamp, data } = req.body;
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return res
        .status(400)
        .json({ success: false, error: '`data` must be a JSON object of readings' });
    }

    // 3. Store the reading verbatim — no schema, no migration ever needed
    await Telemetry.create({
      machineId,
      deviceTs: timestamp ? new Date(timestamp) : null,
      serverTs: new Date(),
      data,
    });

    // 4. Schema discovery: remember which keys this machine sends
    await Machine.updateOne(
      { machineId },
      {
        $addToSet: { metricsSeen: { $each: Object.keys(data) } },
        $set: { status: 'active', lastSeen: new Date() },
      }
    );

    // 202 Accepted — return fast so the PLC isn't blocked
    return res.status(202).json({ success: true, message: 'reading stored' });
  } catch (err) {
    console.error('ingest error:', err);
    return res.status(500).json({ success: false, error: 'server error' });
  }
}

// GET /api/v1/machines/:machineId/latest  — newest reading (for cards/testing)
export async function latest(req, res) {
  const { machineId } = req.params;
  const doc = await Telemetry.findOne({ machineId }).sort({ serverTs: -1 }).lean();
  if (!doc) return res.status(404).json({ success: false, error: 'no data yet' });
  return res.json({ success: true, data: doc });
}

// GET /api/v1/machines/:machineId/history?limit=50  — recent readings
export async function history(req, res) {
  const { machineId } = req.params;
  const limit = Math.min(parseInt(req.query.limit) || 50, 500);
  const docs = await Telemetry.find({ machineId })
    .sort({ serverTs: -1 })
    .limit(limit)
    .lean();
  return res.json({ success: true, count: docs.length, data: docs });
}

// GET /api/v1/machines/:machineId/schema  — what fields has this machine actually sent?
export async function discoveredSchema(req, res) {
  const { machineId } = req.params;
  const rows = await Telemetry.aggregate([
    { $match: { machineId } },
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
  return res.json({ success: true, machineId, fields: rows });
}
