const express = require('express');
const router = express.Router();
const { users, tracerStudies } = require('../config/dataStore');
const { requireAuth } = require('../middleware/auth');

// @route   GET /api/alumni
// @desc    Pencarian dan direktori alumni dengan filter angkatan, jurusan, status (Khusus Anggota Terverifikasi / Wajib Login)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { search, angkatan, jurusan, status } = req.query;

    const filter = {
      role: 'alumni',
      status_verifikasi: 'approved',
    };

    if (angkatan) {
      filter.tahun_lulus = parseInt(angkatan, 10);
    }

    if (jurusan) {
      filter.jurusan = jurusan;
    }

    if (status) {
      filter.status_saat_ini = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      const regex = new RegExp(q, 'i');
      filter.$or = [
        { nama_lengkap: regex },
        { nisn: regex },
        { nama_instansi_terkini: regex },
        { jabatan_atau_prodi: regex },
      ];
    }

    const alumniList = await users.find(filter, { createdAt: -1 });

    const safeList = alumniList.map(item => {
      const copy = { ...item };
      delete copy.password;
      return copy;
    });

    res.json({
      success: true,
      total: safeList.length,
      data: safeList,
    });
  } catch (err) {
    console.error('Error saat mengambil direktori alumni:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal memuat direktori alumni.',
    });
  }
});

// @route   GET /api/alumni/stats/summary
// @desc    Statistik ringkas alumni untuk visualisasi counter di beranda
router.get('/stats/summary', async (req, res) => {
  try {
    const allAlumni = await users.find({ role: 'alumni', status_verifikasi: 'approved' });
    const totalAlumni = allAlumni.length;

    let kuliahCount = 0;
    let kerjaCount = 0;
    let wirausahaCount = 0;
    let cariKerjaCount = 0;
    let lainnyaCount = 0;

    const angkatanMap = {};

    allAlumni.forEach(alumni => {
      const st = alumni.status_saat_ini || '';
      if (st.includes('Studi') || st.includes('Kuliah')) kuliahCount++;
      else if (st.includes('Bekerja')) kerjaCount++;
      else if (st.includes('Wirausaha')) wirausahaCount++;
      else if (st.includes('Mencari')) cariKerjaCount++;
      else lainnyaCount++;

      const thn = alumni.tahun_lulus || 'Lainnya';
      angkatanMap[thn] = (angkatanMap[thn] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        total_alumni: totalAlumni,
        kuliah: kuliahCount,
        bekerja: kerjaCount,
        wirausaha: wirausahaCount,
        mencari_kerja: cariKerjaCount,
        lainnya: lainnyaCount,
        per_angkatan: angkatanMap,
      },
    });
  } catch (err) {
    console.error('Error statistik alumni:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal memuat data statistik alumni.',
    });
  }
});

// @route   GET /api/alumni/tracer/me
// @desc    Ambil kuesioner tracer study milik user yang sedang login
router.get('/tracer/me', requireAuth, async (req, res) => {
  try {
    const tracer = await tracerStudies.findOne({ user_id: req.user._id.toString() });
    res.json({
      success: true,
      data: tracer || null,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data kuesioner.',
    });
  }
});

// @route   POST /api/alumni/tracer
// @desc    Pengisian atau pembaruan kuesioner tracer study oleh alumni
router.post('/tracer', requireAuth, async (req, res) => {
  try {
    const {
      status_saat_ini,
      data_kuliah,
      data_kerja,
      data_wirausaha,
      umpan_balik,
    } = req.body;

    if (!status_saat_ini) {
      return res.status(400).json({
        success: false,
        message: 'Status aktivitas saat ini wajib dipilih.',
      });
    }

    // Perbarui status terkini di model User
    let instansi = '';
    let jabatan = '';

    if (status_saat_ini === 'Melanjutkan Studi' && data_kuliah) {
      instansi = data_kuliah.perguruan_tinggi || '';
      jabatan = `${data_kuliah.jenjang || ''} ${data_kuliah.program_studi || ''}`.trim();
    } else if (status_saat_ini === 'Bekerja' && data_kerja) {
      instansi = data_kerja.nama_perusahaan || '';
      jabatan = data_kerja.jabatan || '';
    } else if (status_saat_ini === 'Wirausaha' && data_wirausaha) {
      instansi = data_wirausaha.nama_usaha || '';
      jabatan = 'Owner / Pengusaha';
    }

    await users.findByIdAndUpdate(req.user._id, {
      status_saat_ini,
      nama_instansi_terkini: instansi,
      jabatan_atau_prodi: jabatan,
    });

    // Cek apakah sudah pernah isi tracer
    const existing = await tracerStudies.findOne({ user_id: req.user._id.toString() });

    const payload = {
      user_id: req.user._id,
      nisn: req.user.nisn,
      nama_lengkap: req.user.nama_lengkap,
      tahun_lulus: req.user.tahun_lulus,
      jurusan: req.user.jurusan,
      status_saat_ini,
      data_kuliah: data_kuliah || {},
      data_kerja: data_kerja || {},
      data_wirausaha: data_wirausaha || {},
      umpan_balik: umpan_balik || {},
    };

    let result;
    if (existing) {
      result = await tracerStudies.findByIdAndUpdate(existing._id, payload);
    } else {
      result = await tracerStudies.create(payload);
    }

    res.json({
      success: true,
      message: 'Kuesioner Tracer Study berhasil disimpan! Terima kasih atas kontribusi Anda dalam pelacakan jejak alumni SMA PGRI 2 Jombang.',
      data: result,
    });
  } catch (err) {
    console.error('Error simpan tracer study:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal menyimpan data kuesioner Tracer Study.',
    });
  }
});

// @route   GET /api/alumni/:id
// @desc    Detail profil alumni (Khusus Pengguna Terdaftar / Wajib Login)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const user = await users.findById(req.params.id);
    if (!user || user.role !== 'alumni') {
      return res.status(404).json({
        success: false,
        message: 'Data alumni tidak ditemukan.',
      });
    }

    const safeUser = { ...user };
    delete safeUser.password;

    res.json({
      success: true,
      data: safeUser,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Gagal memuat detail profil alumni.',
    });
  }
});

module.exports = router;
