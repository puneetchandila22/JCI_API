import { Machine } from '../models/machine.model.js';

// GET /api/v1/machines  — list all machines (no secrets exposed)
export async function listMachines(req, res) {
  const machines = await Machine.find()
    .select('-apiKey -__v')
    .sort({ machineId: 1 })
    .lean();
  return res.json({ success: true, count: machines.length, data: machines });
}

// GET /api/v1/machines/:machineId
export async function getMachine(req, res) {
  const machine = await Machine.findOne({ machineId: req.params.machineId })
    .select('-apiKey -__v')
    .lean();
  if (!machine) return res.status(404).json({ success: false, error: 'not found' });
  return res.json({ success: true, data: machine });
}
