const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { users } = require('../config/dataStore');
const { requireAuth } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'grida_joe_super_secret_jwt_key_2026_smapgri2jombang';

// @route   POST /api/auth/register
// @desc    Pendaftaran akun alumni baru
router.post('/register', async (req, res) => {
  try {
    const {
      nama_lengkap,
      nisn,
      email,
      password,
      no_telepon,
      tahun_lulus,
      jurusan,
      status_saat_ini,
      nama_instansi_terkini,
      foto_profil,
    } = req.body;

    if (!nama_lengkap || !nisn || !email || !password || !tahun_lulus) {
      return res.status(400).json({
        success: false,
        message: 'Mohon lengkapi seluruh kolom wajib (Nama, NISN, Email, Password, Tahun Lulus).',
      });
    }

    // Cek duplikasi email
    const existingEmail = await users.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Alamat email sudah terdaftar. Silakan gunakan email lain atau login.',
      });
    }

    // Cek duplikasi NISN
    const existingNisn = await users.findOne({ nisn: nisn.trim() });
    if (existingNisn) {
      return res.status(400).json({
        success: false,
        message: 'NISN tersebut sudah terdaftar dalam sistem.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await users.create({
      nama_lengkap: nama_lengkap.trim(),
      nisn: nisn.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      no_telepon: no_telepon ? no_telepon.trim() : '',
      tahun_lulus: parseInt(tahun_lulus, 10),
      jurusan: jurusan || 'MIPA / IPA',
      role: 'alumni',
      status_verifikasi: 'approved', // Auto approved agar alumni langsung bisa login dan isi tracer
      foto_profil: foto_profil || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      status_saat_ini: status_saat_ini || 'Melanjutkan Studi',
      nama_instansi_terkini: nama_instansi_terkini || '',
    });

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const safeUser = { ...newUser };
    delete safeUser.password;

    res.status(201).json({
      success: true,
      message: 'Pendaftaran alumni berhasil! Selamat bergabung di jejaring alumni SMA PGRI 2 Jombang.',
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error('Error saat register alumni:', err);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat memproses pendaftaran.',
    });
  }
});

// @route   POST /api/auth/login
// @desc    Masuk ke sistem (Alumni / Admin)
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Mohon masukkan Email/NISN dan Password.',
      });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    // Cari berdasarkan email atau NISN
    const user = await users.findOne({
      $or: [
        { email: cleanIdentifier },
        { nisn: identifier.trim() },
      ],
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Akun dengan Email atau NISN tersebut tidak ditemukan.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Password yang Anda masukkan salah.',
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const safeUser = { ...user };
    delete safeUser.password;

    res.json({
      success: true,
      message: `Selamat datang kembali, ${safeUser.nama_lengkap}!`,
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error('Error saat login:', err);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server saat memproses login.',
    });
  }
});

// @route   GET /api/auth/me
// @desc    Ambil profil user yang sedang login
router.get('/me', requireAuth, async (req, res) => {
  const safeUser = { ...req.user };
  delete safeUser.password;
  res.json({
    success: true,
    user: safeUser,
  });
});

// @route   PUT /api/auth/profile
// @desc    Pembaruan profil alumni
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const {
      nama_lengkap,
      no_telepon,
      alamat,
      bio,
      linkedin,
      instagram,
      status_saat_ini,
      nama_instansi_terkini,
      jabatan_atau_prodi,
      foto_profil,
    } = req.body;

    const updateFields = {};
    if (nama_lengkap) updateFields.nama_lengkap = nama_lengkap.trim();
    if (no_telepon !== undefined) updateFields.no_telepon = no_telepon.trim();
    if (alamat !== undefined) updateFields.alamat = alamat.trim();
    if (bio !== undefined) updateFields.bio = bio.trim();
    if (linkedin !== undefined) updateFields.linkedin = linkedin.trim();
    if (instagram !== undefined) updateFields.instagram = instagram.trim();
    if (status_saat_ini) updateFields.status_saat_ini = status_saat_ini;
    if (nama_instansi_terkini !== undefined) updateFields.nama_instansi_terkini = nama_instansi_terkini.trim();
    if (jabatan_atau_prodi !== undefined) updateFields.jabatan_atau_prodi = jabatan_atau_prodi.trim();
    if (foto_profil) updateFields.foto_profil = foto_profil;

    const updated = await users.findByIdAndUpdate(req.user._id, updateFields);
    delete updated.password;

    res.json({
      success: true,
      message: 'Profil berhasil diperbarui.',
      user: updated,
    });
  } catch (err) {
    console.error('Error update profil:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui profil pengguna.',
    });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Ubah password akun
router.put('/change-password', requireAuth, async (req, res) => {
  try {
    const { old_password, new_password } = req.body;
    if (!old_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Mohon lengkapi password lama dan password baru.',
      });
    }

    const isMatch = await bcrypt.compare(old_password, req.user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Password lama Anda tidak sesuai.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    await users.findByIdAndUpdate(req.user._id, { password: hashedPassword });

    res.json({
      success: true,
      message: 'Password berhasil diubah. Silakan gunakan password baru pada sesi berikutnya.',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengubah password.',
    });
  }
});

module.exports = router;
