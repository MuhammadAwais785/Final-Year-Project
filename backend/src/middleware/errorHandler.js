function errorHandler(err, req, res, next) {
  const status = err.type === 'entity.parse.failed' ? 400 : (err.status || 500);

  if (status >= 500 || process.env.NODE_ENV !== 'test') {
    console.error(err);
  }

  const message = status === 500
    ? 'Internal server error'
    : (err.type === 'entity.parse.failed' ? 'Invalid JSON request body' : err.message);

  res.status(status).json({ message });
}

module.exports = errorHandler;
