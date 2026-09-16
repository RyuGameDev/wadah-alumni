const express = require('express');
const router = express.Router();
const { news } = require('../config/dataStore');
const { requireAdmin } = require('../middleware/auth');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-');
}

// @route   GET /api/news
// @desc    Daftar berita alumni
router.get('/', async (req, res) => {
  try {
    const { kategori, search, limit } = req.query;
    const filter = {};

    if (kategori && kategori !== 'Semua') {
      filter.kategori = kategori;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { judul: regex },
        { ringkasan: regex },
      ];
    }

    let items = await news.find(filter, { createdAt: -1 });
    if (limit) {
      items = items.slice(0, parseInt(limit, 10));
    }

    res.json({
      success: true,
      total: items.length,
      data: items,
    });
  } catch (err) {
    console.error('Error saat mengambil berita:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal memuat berita alumni.',
    });
  }
});

// @route   GET /api/news/:idOrSlug
// @desc    Detail berita
router.get('/:idOrSlug', async (req, res) => {
  try {
    const param = req.params.idOrSlug;
    let article = await news.findById(param);
    if (!article) {
      article = await news.findOne({ slug: param });
    }

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Artikel berita tidak ditemukan.',
      });
    }

    // Tambahkan jumlah pembaca
    await news.findByIdAndUpdate(article._id, { $inc: { views: 1 } });
    article.views = (article.views || 0) + 1;

    res.json({
      success: true,
      data: article,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Gagal memuat artikel berita.',
    });
  }
});

// @route   POST /api/news
// @desc    Tambah berita baru (Admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { judul, kategori, ringkasan, konten, cover_image, telegram_file_id } = req.body;

    if (!judul || !ringkasan || !konten) {
      return res.status(400).json({
        success: false,
        message: 'Mohon lengkapi Judul, Ringkasan, dan Konten berita.',
      });
    }

    let baseSlug = slugify(judul);
    let finalSlug = baseSlug;
    let count = 1;
    while (await news.findOne({ slug: finalSlug })) {
      finalSlug = `${baseSlug}-${count++}`;
    }

    const created = await news.create({
      judul: judul.trim(),
      slug: finalSlug,
      kategori: kategori || 'Umum',
      ringkasan: ringkasan.trim(),
      konten: konten.trim(),
      cover_image: cover_image || 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop&q=80',
      telegram_file_id: telegram_file_id || '',
      author: req.user.nama_lengkap || 'Humas SMA PGRI 2 Jombang',
      views: 0,
    });

    res.status(201).json({
      success: true,
      message: 'Berita berhasil dipublikasikan!',
      data: created,
    });
  } catch (err) {
    console.error('Error buat berita:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal mempublikasikan berita.',
    });
  }
});

// @route   PUT /api/news/:id
// @desc    Edit berita (Admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { judul, kategori, ringkasan, konten, cover_image, telegram_file_id } = req.body;
    const updated = await news.findByIdAndUpdate(req.params.id, {
      ...(judul && { judul: judul.trim() }),
      ...(kategori && { kategori }),
      ...(ringkasan && { ringkasan: ringkasan.trim() }),
      ...(konten && { konten: konten.trim() }),
      ...(cover_image && { cover_image }),
      ...(telegram_file_id !== undefined && { telegram_file_id }),
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Berita tidak ditemukan.' });
    }

    res.json({
      success: true,
      message: 'Berita berhasil diperbarui.',
      data: updated,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui berita.',
    });
  }
});

// @route   DELETE /api/news/:id
// @desc    Hapus berita (Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const deleted = await news.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Berita tidak ditemukan.' });
    }
    res.json({
      success: true,
      message: 'Berita berhasil dihapus.',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus berita.',
    });
  }
});

module.exports = router;
