const express = require('express');
const router = express.Router();
const { careers } = require('../config/dataStore');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// @route   GET /api/careers
// @desc    Daftar lowongan kerja & magang alumni
router.get('/', async (req, res) => {
  try {
    const { tipe, search, status } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    } else {
      filter.status = 'buka';
    }

    if (tipe && tipe !== 'Semua') {
      filter.tipe_pekerjaan = tipe;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { posisi: regex },
        { perusahaan: regex },
        { lokasi: regex },
        { deskripsi: regex },
      ];
    }

    const list = await careers.find(filter, { createdAt: -1 });

    res.json({
      success: true,
      total: list.length,
      data: list,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Gagal memuat info lowongan kerja.',
    });
  }
});

// @route   GET /api/careers/:id
// @desc    Detail lowongan kerja
router.get('/:id', async (req, res) => {
  try {
    const item = await careers.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Lowongan kerja tidak ditemukan.',
      });
    }

    res.json({
      success: true,
      data: item,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Gagal memuat detail karir.',
    });
  }
});

// @route   POST /api/careers
// @desc    Posting info loker baru (Bisa oleh alumni terdaftar atau admin)
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      posisi,
      perusahaan,
      lokasi,
      tipe_pekerjaan,
      rentang_gaji,
      deskripsi,
      kualifikasi,
      kontak_lamaran,
      logo_perusahaan,
    } = req.body;

    if (!posisi || !perusahaan || !lokasi || !deskripsi || !kualifikasi || !kontak_lamaran) {
      return res.status(400).json({
        success: false,
        message: 'Mohon lengkapi seluruh kolom informasi lowongan kerja yang wajib diisi.',
      });
    }

    const created = await careers.create({
      posisi: posisi.trim(),
      perusahaan: perusahaan.trim(),
      lokasi: lokasi.trim(),
      tipe_pekerjaan: tipe_pekerjaan || 'Penuh Waktu (Full Time)',
      rentang_gaji: rentang_gaji ? rentang_gaji.trim() : 'Kompetitif / Sesuai UMK',
      deskripsi: deskripsi.trim(),
      kualifikasi: kualifikasi.trim(),
      kontak_lamaran: kontak_lamaran.trim(),
      logo_perusahaan: logo_perusahaan || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&auto=format&fit=crop&q=80',
      status: 'buka',
      diposting_oleh: `${req.user.nama_lengkap} (${req.user.role === 'admin' ? 'Admin Sekolah' : `Alumni ${req.user.tahun_lulus}`})`,
    });

    res.status(201).json({
      success: true,
      message: 'Lowongan kerja berhasil dipublikasikan!',
      data: created,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Gagal memposting lowongan kerja.',
    });
  }
});

// @route   DELETE /api/careers/:id
// @desc    Hapus lowongan kerja (Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const deleted = await careers.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Lowongan tidak ditemukan.' });
    }
    res.json({
      success: true,
      message: 'Lowongan kerja berhasil dihapus.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal menghapus lowongan.' });
  }
});

module.exports = router;
