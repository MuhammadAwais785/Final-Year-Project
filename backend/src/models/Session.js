const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    guardian: { type: mongoose.Schema.Types.ObjectId, ref: 'Guardian', required: true },
    child: { type: mongoose.Schema.Types.ObjectId, ref: 'ChildProfile', required: true },
    module: { type: String, required: true },
    score: { type: Number, min: 0 },
    mood: { type: String },
    durationSeconds: { type: Number, min: 0 },
    clientId: { type: String, required: true }
  },
  { timestamps: true }
);

sessionSchema.index({ guardian: 1, clientId: 1 }, { unique: true });

module.exports = mongoose.model('Session', sessionSchema);
