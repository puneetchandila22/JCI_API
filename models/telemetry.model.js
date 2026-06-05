import mongoose from 'mongoose';

// Raw readings. The `data` field is Mixed = accepts ANY shape the PLC sends.
// Stored as a MongoDB time-series collection for compression + fast time queries.
const telemetrySchema = new mongoose.Schema(
  {
    machineId: { type: String, required: true }, // metaField
    deviceTs: { type: Date },                     // PLC's own clock (their timestamp)
    serverTs: { type: Date, default: Date.now },  // our clock — trust this for ordering
    data: { type: mongoose.Schema.Types.Mixed, required: true }, // free-form readings
  },
  {
    // Native time-series collection. Mongoose creates it on first write.
    timeseries: {
      timeField: 'serverTs',
      metaField: 'machineId',
      granularity: 'seconds',
    },
    // time-series collections do not get _id-based versioning
    versionKey: false,
  }
);

export const Telemetry = mongoose.model('Telemetry', telemetrySchema);
