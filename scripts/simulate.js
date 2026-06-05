import 'dotenv/config';
import { connectDB } from '../config/db.js';
import { Machine } from '../models/machine.model.js';
import mongoose from 'mongoose';

// Pretends to be PLCs pushing different data shapes per machine type.
// Run AFTER `npm run seed` and while the server is running.
const BASE = process.env.SIM_BASE || 'http://localhost:3000';

// each type sends a DIFFERENT shape — this is the whole point
function payloadFor(type) {
  const r = (a, b) => +(a + Math.random() * (b - a)).toFixed(1);
  const i = (a, b) => Math.floor(a + Math.random() * (b - a));
  switch (type) {
    case 'maxi':        return { bathTemp: r(40, 130), speed: i(20, 60), turns: i(1, 20), program: i(1, 12), counter: i(0, 5000), status: 'running' };
    case 'cbr':         return { temperature: r(30, 95), waterFlow: i(2000, 4000), production: i(0, 80000), status: 'running' };
    case 'stenter':     return { zone1Temp: r(120, 200), zone2Temp: r(120, 200), fabricSpeed: i(10, 50), status: 'running' };
    case 'soft_flow':   return { liquorRatio: r(1, 10), temp: r(30, 110), pressure: r(1, 4), status: 'idle' };
    case 'cold_dyeing': return { dwellTime: i(10, 120), padPressure: r(1, 5), status: 'running' };
    default:            return { temperature: r(20, 100), speed: i(0, 60), status: 'running' };
  }
}

async function run() {
  await connectDB();
  const machines = await Machine.find().lean();
  await mongoose.disconnect();

  console.log(`Simulating one push for each of ${machines.length} machines...\n`);
  let ok = 0, fail = 0;
  for (const m of machines) {
    const body = {
      machineId: m.machineId,
      timestamp: new Date().toISOString(),
      data: payloadFor(m.type),
    };
    try {
      const res = await fetch(`${BASE}/api/v1/ingest/${m.machineId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': m.apiKey },
        body: JSON.stringify(body),
      });
      if (res.ok) { ok++; } else { fail++; console.log(`  ${m.machineId} -> ${res.status}`); }
    } catch (e) {
      fail++; console.log(`  ${m.machineId} -> ${e.message}`);
    }
  }
  console.log(`\nDone. success: ${ok}, failed: ${fail}`);
  process.exit(0);
}

run();
