// Vercel serverless entry: every /api/* request is rewritten here and handled by the Express app.
const { app, ready } = require('../server');

module.exports = async (req, res) => {
  try {
    await ready();
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    return res.status(500).json({ message: 'Database unavailable. Please try again later.' });
  }
  return app(req, res);
};
