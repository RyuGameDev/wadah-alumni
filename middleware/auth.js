const jwt = require('jsonwebtoken');
const { users } = require('../config/dataStore');

const JWT_SECRET = process.env.JWT_SECRET || 'grida_joe_super_secret_jwt_key_2026_smapgri2jombang';

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Token otentikasi tidak ditemukan.',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await users.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Pengguna tidak ditemukan atau sesi telah berakhir.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token otentikasi tidak valid atau telah kedaluwarsa.',
    });
  }
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Fitur ini hanya untuk Administrator sekolah.',
      });
    }
    next();
  });
}

module.exports = {
  requireAuth,
  requireAdmin,
};
