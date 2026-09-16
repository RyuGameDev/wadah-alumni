const express = require('express');
const router = express.Router();
const { gallery } = require('../config/dataStore');
const { requireAdmin } = require('../middleware/auth');

// @route   GET /api/gallery
// @desc    Daftar foto dokumentasi galeri alumni
router.get('/', async (req, res) => {
  try {
    const { kategori } = req.query;
    const filter = {};
    if (kategori && kategori !== 'Semua') {
      filter.kategori = kategori;
    }

    const items = await gallery.find(filter, { createdAt: -1 });
    res.json({
      success: true,
      total: items.length,
      data: items,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Gagal memuat galeri foto.',
    });
  }
});

// @route   POST /api/gallery
// @desc    Tambah foto galeri baru (Admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { judul, kategori, deskripsi, gambar_url, telegram_file_id, tanggal_kegiatan } = req.body;
    if (!judul || !gambar_url) {
      return res.status(400).json({
        success: false,
        message: 'Judul dan URL Foto Dokumentasi wajib diisi.',
      });
    }

    const created = await gallery.create({
      judul: judul.trim(),
      kategori: kategori || 'Umum',
      deskripsi: deskripsi ? deskripsi.trim() : '',
      gambar_url,
      telegram_file_id: telegram_file_id || '',
      tanggal_kegiatan: tanggal_kegiatan || '2024',
    });

    res.status(201).json({
      success: true,
      message: 'Foto berhasil ditambahkan ke galeri.',
      data: created,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan galeri foto.',
    });
  }
});

// @route   DELETE /api/gallery/:id
// @desc    Hapus foto galeri (Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const deleted = await gallery.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Foto tidak ditemukan.' });
    }
    res.json({ success: true, message: 'Foto galeri berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal menghapus foto.' });
  }
});

module.exports = router;
