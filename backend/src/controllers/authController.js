const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Guardian = require('../models/Guardian');

function tokenFor(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

async function register(req, res) {
  const { name, email, password, language } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
  const exists = await Guardian.findOne({ email });
  if (exists) return res.status(409).json({ message: 'Email is already registered' });
  const guardian = await Guardian.create({ name, email, language, passwordHash: await bcrypt.hash(password, 12) });
  res.status(201).json({ token: tokenFor(guardian.id), guardian: { id: guardian.id, name, email, language } });
}

async function login(req, res) {
  const guardian = await Guardian.findOne({ email: req.body.email });
  if (!guardian || !(await bcrypt.compare(req.body.password || '', guardian.passwordHash))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  res.json({ token: tokenFor(guardian.id), guardian: { id: guardian.id, name: guardian.name, email: guardian.email, language: guardian.language } });
}

module.exports = { register, login };
