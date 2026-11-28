require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const { connectDatabase } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { securityHeaders } = require('./middleware/security');

const app = express();
app.disable('x-powered-by');
app.use(securityHeaders);
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/profiles', require('./routes/profileRoutes'));
app.use('/api/games', require('./routes/gameRoutes'));
app.use('/api/sync', require('./routes/syncRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

app.use((req, res) => res.status(404).json({ message: 'Not found' }));
app.use(errorHandler);

const port = process.env.PORT || 5000;
if (require.main === module) {
  connectDatabase()
    .then(() => {
      const server = app.listen(port, () => console.log(`API running on port ${port}`));
      const shutdown = (signal) => {
        console.log(`${signal} received, shutting down gracefully`);
        server.close(() => process.exit(0));
      };
      process.on('SIGINT', () => shutdown('SIGINT'));
      process.on('SIGTERM', () => shutdown('SIGTERM'));
    })
    .catch((error) => {
      console.error('Unable to start API:', error.message);
      process.exit(1);
    });
}

module.exports = app;
