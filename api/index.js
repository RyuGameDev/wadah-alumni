const app = require('../server');

module.exports = (req, res) => {
  // Pastikan req.url selalu diawali dengan /api agar sesuai dengan rute Express
  if (!req.url.startsWith('/api')) {
    req.url = '/api' + req.url;
  }
  return app(req, res);
};
