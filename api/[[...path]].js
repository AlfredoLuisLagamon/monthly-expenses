/**
 * Vercel serverless catch-all: forwards all /api/* requests to the Express app.
 * Set GOOGLE_SERVICE_ACCOUNT_JSON in Vercel Environment Variables.
 */
let handler;

module.exports = async function (req, res) {
  if (!handler) {
    const serverless = require('serverless-http');
    const { app } = await import('../server/index.js');
    handler = serverless(app);
  }
  return handler(req, res);
};
