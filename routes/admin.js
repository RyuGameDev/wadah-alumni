const express = require('express');
const router = express.Router();
const { users, tracerStudies, news, donations, careers, forums } = require('../config/dataStore');
const { requireAdmin } = require('../middleware/auth');

// Seluruh rute admin wajib berstatus Admin
router.use(requireAdmin);

// @route   GET /api/admin/dashboard
// @desc    Statistik lengkap untuk dashboard admin
router.get('/dashboard', async (req, res) => {
  try {
    const allUsers = await users.find({});
    const alumniList = allUsers.filter(u => u.role === 'alumni');
    const pendingAlumni = alumniList.filter(u => u.status_verifikasi === 'pending');
    const approvedAlumni = alumniList.filter(u => u.status_verifikasi === 'approved');

    const allTracers = await tracerStudies.find({});
    const allNews = await news.find({});
    const allDonations = await donations.find({});
    const allCareers = await careers.find({});
    const allForums = await forums.find({});

    let totalDonasiTerkumpul = 0;
    allDonations.forEach(d => {
      totalDonasiTerkumpul += (d.terkumpul || 0);
    });

    // Hitung persentase status
    let kuliah = 0, kerja = 0, wirausaha = 0, cariKerja = 0, lainnya = 0;
    allTracers.forEach(t => {
      const s = t.status_saat_ini || '';
      if (s.includes('Studi') || s.includes('Kuliah')) kuliah++;
      else if (s.includes('Bekerja')) kerja++;
      else if (s.includes('Wirausaha')) wirausaha++;
      else if (s.includes('Mencari')) cariKerja++;
      else lainnya++;
    });

    res.json({
      success: true,
      data: {
        total_alumni: alumniList.length,
        approved_alumni: approvedAlumni.length,
        pending_alumni: pendingAlumni.length,
        total_tracer_terisi: allTracers.length,
        total_donasi_terkumpul: totalDonasiTerkumpul,
        total_berita: allNews.length,
        total_loker: allCareers.length,
        total_topik_forum: allForums.length,
        distribusi_status: {
          kuliah,
          kerja,
          wirausaha,
          cari_kerja: cariKerja,
          lainnya,
        },
        recent_pending: pendingAlumni.slice(0, 5),
      },
    });
  } catch (err) {
    console.error('Error saat memuat dashboard admin:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal memuat ringkasan analitik admin.',
    });
  }
});

// @route   GET /api/admin/alumni
// @desc    Daftar seluruh alumni untuk dikelola admin (termasuk status pending)
router.get('/alumni', async (req, res) => {
  try {
    const { status_verifikasi, angkatan, search } = req.query;
    const filter = { role: 'alumni' };

    if (status_verifikasi && status_verifikasi !== 'Semua') {
      filter.status_verifikasi = status_verifikasi;
    }

    if (angkatan) {
      filter.tahun_lulus = parseInt(angkatan, 10);
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { nama_lengkap: regex },
        { nisn: regex },
        { email: regex },
      ];
    }

    const items = await users.find(filter, { createdAt: -1 });
    const safeItems = items.map(u => {
      const copy = { ...u };
      delete copy.password;
      return copy;
    });

    res.json({
      success: true,
      total: safeItems.length,
      data: safeItems,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Gagal memuat daftar alumni untuk admin.',
    });
  }
});

// @route   PUT /api/admin/alumni/:id/verify
// @desc    Verifikasi status alumni (Setujui / Tolak)
router.put('/alumni/:id/verify', async (req, res) => {
  try {
    const { status_verifikasi, catatan_verifikasi } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status_verifikasi)) {
      return res.status(400).json({
        success: false,
        message: 'Status verifikasi tidak valid (approved/rejected/pending).',
      });
    }

    const updated = await users.findByIdAndUpdate(req.params.id, {
      status_verifikasi,
      catatan_verifikasi: catatan_verifikasi || '',
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Alumni tidak ditemukan.' });
    }

    res.json({
      success: true,
      message: `Status alumni berhasil diperbarui menjadi ${status_verifikasi.toUpperCase()}.`,
      data: updated,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui status verifikasi alumni.',
    });
  }
});

// @route   DELETE /api/admin/alumni/:id
// @desc    Hapus data akun alumni dan tracer studynya
router.delete('/alumni/:id', async (req, res) => {
  try {
    await users.findByIdAndDelete(req.params.id);
    const userTracers = await tracerStudies.find({ user_id: req.params.id });
    for (const t of userTracers) {
      await tracerStudies.findByIdAndDelete(t._id);
    }

    res.json({
      success: true,
      message: 'Akun alumni dan riwayat tracer studynya berhasil dihapus.',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus alumni.',
    });
  }
});

// @route   GET /api/admin/export/tracer
// @desc    Export data Tracer Study ke format CSV (Excel Ready)
router.get('/export/tracer', async (req, res) => {
  try {
    const records = await tracerStudies.find({}, { createdAt: -1 });

    const headers = [
      'No',
      'NISN',
      'Nama Lengkap',
      'Tahun Lulus',
      'Jurusan',
      'Status Saat Ini',
      'Kampus / Perguruan Tinggi',
      'Program Studi',
      'Jenjang',
      'Perusahaan / Instansi Kerja',
      'Jabatan',
      'Rentang Gaji',
      'Nama Wirausaha / Bisnis',
      'Kepuasan Pembelajaran (1-5)',
      'Saran untuk Sekolah',
      'Tanggal Pengisian',
    ];

    const escapeCsv = (val) => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = records.map((item, idx) => {
      return [
        idx + 1,
        escapeCsv(item.nisn),
        escapeCsv(item.nama_lengkap),
        escapeCsv(item.tahun_lulus),
        escapeCsv(item.jurusan),
        escapeCsv(item.status_saat_ini),
        escapeCsv(item.data_kuliah?.perguruan_tinggi || '-'),
        escapeCsv(item.data_kuliah?.program_studi || '-'),
        escapeCsv(item.data_kuliah?.jenjang || '-'),
        escapeCsv(item.data_kerja?.nama_perusahaan || '-'),
        escapeCsv(item.data_kerja?.jabatan || '-'),
        escapeCsv(item.data_kerja?.rentang_gaji || '-'),
        escapeCsv(item.data_wirausaha?.nama_usaha || '-'),
        escapeCsv(item.umpan_balik?.kepuasan_pembelajaran || '-'),
        escapeCsv(item.umpan_balik?.saran_untuk_sekolah || '-'),
        escapeCsv(item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : '-'),
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');

    const filename = `TracerStudy_SMAPGRI2Jombang_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (err) {
    console.error('Error saat export data tracer study:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal mengekspor data tracer study.',
    });
  }
});

module.exports = router;
