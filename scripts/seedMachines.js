import 'dotenv/config';
import crypto from 'crypto';
import { connectDB } from '../config/db.js';
import { Machine } from '../models/machine.model.js';
import mongoose from 'mongoose';

// The 16 types from Phase 1 — [type, friendly name, quantity]
const TYPES = [
  ['SING', 'singeing',    'Singeing Machine',        3],
  ['CBR',  'cbr',         'CBR Machine',             2],
  ['WASH', 'washer',      'Washer',                  2],
  ['MERC', 'mercerizer',  'Mercerizer',              1],
  ['SOFT', 'soft_flow',   'Soft Flow Machine',       7],
  ['COLD', 'cold_dyeing', 'Cold Dyeing Machine',     5],
  ['JET',  'jet',         'Jet Production Machine',  2],
  ['MAXI', 'maxi',        'Maxi Dyeing Machine',     9],
  ['ROT',  'rotary',      'Rotary Machine',          2],
  ['LOOP', 'loopager',    'Loopager',                2],
  ['PRWA', 'print_washer','Print Washer',            1],
  ['STEN', 'stenter',     'Stenter (Print)',         7],
  ['SANF', 'sanforizing', 'Sanforizing Machine',     4],
  ['PEACH','peach',       'Peach Machine',           1],
  ['ASRS', 'asrs',        'ASRS System',             1],
  ['VDR',  'vdr_finish',  'VDR Finishing',           1],
];

function makeKey() {
  return 'mk_live_' + crypto.randomBytes(16).toString('hex');
}

async function seed() {
  await connectDB();

  const docs = [];
  for (const [prefix, type, name, qty] of TYPES) {
    for (let i = 1; i <= qty; i++) {
      const machineId = `${prefix}-${String(i).padStart(2, '0')}`;
      docs.push({ machineId, name, type, phase: 1, apiKey: makeKey() });
    }
  }

  // upsert so re-running keeps existing keys, adds any missing machines
  let created = 0;
  for (const d of docs) {
    const r = await Machine.updateOne(
      { machineId: d.machineId },
      { $setOnInsert: d },
      { upsert: true }
    );
    if (r.upsertedCount) created++;
  }

  // print the handoff sheet for the PLC team
  const all = await Machine.find().select('machineId name type apiKey').sort({ machineId: 1 }).lean();
  console.log(`\nTotal machines: ${all.length}  (newly created: ${created})\n`);
  console.log('=== HANDOFF SHEET (give machineId + apiKey to the PLC team) ===');
  for (const m of all) {
    console.log(`${m.machineId.padEnd(9)} ${m.type.padEnd(13)} ${m.apiKey}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

seed();
