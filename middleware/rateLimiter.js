const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'grida_joe_super_secret_jwt_key_2026_smapgri2jombang';

/**
 * Rate Limiter Khusus Unggah Berkas Tamu (Unauthenticated)
 * - Batas: 5 upload per 30 menit per alamat IP
 * - Kerahasiaan: standardHeaders & legacyHeaders dimatikan agar batas waktu & kuota tidak bocor
 * - Skip: Pengguna yang login (valid JWT Bearer token) dilewati dari batas ini
 */
const unauthenticatedUploadLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 menit
  max: 5, // Maksimal 5 upload per IP dalam window 30 menit
  standardHeaders: false, // Sembunyikan header RateLimit-*
  legacyHeaders: false, // Sembunyikan header X-RateLimit-*
  skip: (req) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded && decoded.id) {
          req.authenticatedUser = decoded;
          return true; // Lewati pembatasan untuk pengguna login
        }
      }
    } catch (e) {
      // Token tidak sah / kadaluarsa -> tetap kenai rate limit tamu
    }
    return false;
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Anda terlalu sering mengunggah berkas. Harap login untuk melanjutkan.',
    });
  },
});

module.exports = {
  unauthenticatedUploadLimiter,
};
