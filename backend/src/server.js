require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const connectDatabase = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json({ limit: '1mb' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/profiles', require('./routes/profileRoutes'));
app.use('/api/sync', require('./routes/syncRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use(errorHandler);

const port = process.env.PORT || 5000;
if (require.main === module) {
  connectDatabase().then(() => app.listen(port, () => console.log(`API running on port ${port}`))).catch((error) => {
    console.error('Unable to start API:', error.message);
    process.exit(1);
  });
}

module.exports = app;
