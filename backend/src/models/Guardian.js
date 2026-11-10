const mongoose = require('mongoose');

const guardianSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    pinHash: { type: String },
    language: { type: String, enum: ['en', 'ur'], default: 'en' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Guardian', guardianSchema);
