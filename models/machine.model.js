import mongoose from 'mongoose';

// One document per physical machine. The COMPANY sends machineId/name/type.
// Only machineId is required; name/type fill in from the first payload that has them.
const machineSchema = new mongoose.Schema(
  {
    machineId: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: '' },
    type: { type: String, default: 'unknown' },
    phase: { type: Number, default: 1 },
    status: { type: String, default: 'active' },
    metricsSeen: { type: [String], default: [] },
    lastSeen: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Machine = mongoose.model('Machine', machineSchema);
