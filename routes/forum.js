const express = require('express');
const router = express.Router();
const { forums } = require('../config/dataStore');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// @route   GET /api/forum
// @desc    Daftar topik diskusi forum alumni
router.get('/', async (req, res) => {
  try {
    const { kategori, search } = req.query;
    const filter = {};

    if (kategori && kategori !== 'Semua') {
      filter.kategori = kategori;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { judul: regex },
        { konten: regex },
      ];
    }

    const list = await forums.find(filter, { createdAt: -1 });

    res.json({
      success: true,
      total: list.length,
      data: list,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Gagal memuat topik forum diskusi.',
    });
  }
});

// @route   GET /api/forum/:id
// @desc    Detail topik diskusi dan balasan komentar
router.get('/:id', async (req, res) => {
  try {
    const item = await forums.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Topik forum tidak ditemukan.',
      });
    }

    res.json({
      success: true,
      data: item,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Gagal memuat detail topik forum.',
    });
  }
});

// @route   POST /api/forum
// @desc    Buat topik diskusi baru (Alumni / Admin)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { judul, kategori, konten, lampiran_gambar, telegram_file_id } = req.body;

    if (!judul || !konten) {
      return res.status(400).json({
        success: false,
        message: 'Judul dan Isi topik diskusi wajib diisi.',
      });
    }

    const created = await forums.create({
      judul: judul.trim(),
      kategori: kategori || 'Diskusi Umum',
      konten: konten.trim(),
      author_id: req.user._id,
      author_nama: req.user.nama_lengkap,
      author_angkatan: req.user.role === 'admin' ? 'Admin Sekolah' : `Alumni ${req.user.tahun_lulus}`,
      author_foto: req.user.foto_profil || '',
      lampiran_gambar: lampiran_gambar || '',
      telegram_file_id: telegram_file_id || '',
      upvotes_count: 0,
      komentar: [],
    });

    res.status(201).json({
      success: true,
      message: 'Topik diskusi berhasil dibuat!',
      data: created,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Gagal membuat topik diskusi.',
    });
  }
});

// @route   POST /api/forum/:id/comment
// @desc    Kirim komentar balasan pada topik
router.post('/:id/comment', requireAuth, async (req, res) => {
  try {
    const { konten } = req.body;
    if (!konten || !konten.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Isi balasan komentar tidak boleh kosong.',
      });
    }

    const item = await forums.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Topik diskusi tidak ditemukan.',
      });
    }

    const newComment = {
      author_id: req.user._id,
      author_nama: req.user.nama_lengkap,
      author_angkatan: req.user.role === 'admin' ? 'Admin Sekolah' : `Alumni ${req.user.tahun_lulus}`,
      author_foto: req.user.foto_profil || '',
      konten: konten.trim(),
      tanggal: new Date(),
    };

    const updated = await forums.findByIdAndUpdate(item._id, {
      $push: { komentar: newComment },
    });

    res.json({
      success: true,
      message: 'Balasan komentar berhasil dikirim.',
      data: updated,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengirim komentar.',
    });
  }
});

// @route   POST /api/forum/:id/upvote
// @desc    Beri apresiasi (upvote) pada topik diskusi
router.post('/:id/upvote', requireAuth, async (req, res) => {
  try {
    const updated = await forums.findByIdAndUpdate(req.params.id, {
      $inc: { upvotes_count: 1 },
    });
    res.json({
      success: true,
      message: 'Berhasil memberikan apresiasi.',
      data: updated,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal upvote topik.' });
  }
});

// @route   DELETE /api/forum/:id
// @desc    Hapus topik forum (Admin only atau pembuat topik)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const item = await forums.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Topik tidak ditemukan.' });
    }

    if (req.user.role !== 'admin' && item.author_id?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses untuk menghapus topik ini.' });
    }

    await forums.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Topik diskusi berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal menghapus topik.' });
  }
});

module.exports = router;
