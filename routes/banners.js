const express = require('express');
const router = express.Router();
const { banners } = require('../config/dataStore');
const { requireAdmin } = require('../middleware/auth');

// @route   GET /api/banners
// @desc    Daftar slide banner hero aktif untuk landing page
router.get('/', async (req, res) => {
  try {
    let list = await banners.find({ is_active: true }, { urutan: 1, createdAt: 1 });
    
    // Sortir berdasarkan urutan jika di lokal store
    list.sort((a, b) => (a.urutan || 1) - (b.urutan || 1));

    res.json({
      success: true,
      total: list.length,
      data: list,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Gagal memuat banner hero.',
    });
  }
});

// @route   POST /api/banners
// @desc    Tambah slide banner baru (Admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { judul, subjudul, gambar_url, urutan, telegram_file_id } = req.body;

    if (!judul || !gambar_url) {
      return res.status(400).json({
        success: false,
        message: 'Judul dan Foto Slide Banner wajib diisi.',
      });
    }

    const count = await banners.countDocuments();
    const created = await banners.create({
      judul: judul.trim(),
      subjudul: subjudul ? subjudul.trim() : '',
      gambar_url,
      telegram_file_id: telegram_file_id || '',
      urutan: urutan ? parseInt(urutan, 10) : count + 1,
      is_active: true,
    });

    res.status(201).json({
      success: true,
      message: 'Slide banner hero berhasil ditambahkan!',
      data: created,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan slide banner.',
    });
  }
});

// @route   PUT /api/banners/:id
// @desc    Perbarui slide banner (Admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { judul, subjudul, gambar_url, urutan, is_active } = req.body;
    const updated = await banners.findByIdAndUpdate(req.params.id, {
      ...(judul && { judul: judul.trim() }),
      ...(subjudul !== undefined && { subjudul: subjudul.trim() }),
      ...(gambar_url && { gambar_url }),
      ...(urutan !== undefined && { urutan: parseInt(urutan, 10) }),
      ...(is_active !== undefined && { is_active: Boolean(is_active) }),
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Slide banner tidak ditemukan.' });
    }

    res.json({
      success: true,
      message: 'Slide banner berhasil diperbarui.',
      data: updated,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui banner.' });
  }
});

// @route   DELETE /api/banners/:id
// @desc    Hapus slide banner (Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const deleted = await banners.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Slide banner tidak ditemukan.' });
    }

    res.json({
      success: true,
      message: 'Slide banner berhasil dihapus.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal menghapus banner.' });
  }
});

module.exports = router;
