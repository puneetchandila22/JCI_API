import mongoose from 'mongoose';

// One document per physical machine. machineId + apiKey are fixed (you assign them).
// Nothing about the readings is fixed here — metricsSeen auto-fills as data arrives.
const machineSchema = new mongoose.Schema(
  {
    machineId: { type: String, required: true, unique: true, index: true }, // e.g. "MAXI-01"
    name: { type: String, required: true },        // "Maxi Dyeing Machine"
    type: { type: String, required: true },        // one of the 16 types: "maxi", "cbr", ...
    phase: { type: Number, default: 1 },
    apiKey: { type: String, required: true },       // unique secret given to the PLC team
    status: { type: String, default: 'awaiting_data' }, // awaiting_data | active
    metricsSeen: { type: [String], default: [] },   // auto-discovered field keys
    lastSeen: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Machine = mongoose.model('Machine', machineSchema);
