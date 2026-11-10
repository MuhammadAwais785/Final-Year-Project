const mongoose = require('mongoose');

const childProfileSchema = new mongoose.Schema(
  {
    guardian: { type: mongoose.Schema.Types.ObjectId, ref: 'Guardian', required: true },
    name: { type: String, required: true, trim: true },
    age: { type: Number, min: 1, max: 18 },
    language: { type: String, enum: ['en', 'ur'], default: 'en' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChildProfile', childProfileSchema);
