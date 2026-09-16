const express = require('express');
const router = express.Router();
const { donations } = require('../config/dataStore');
const { requireAdmin } = require('../middleware/auth');

// @route   GET /api/donations
// @desc    Daftar program donasi alumni
router.get('/', async (req, res) => {
  try {
    const list = await donations.find({}, { createdAt: -1 });
    res.json({
      success: true,
      total: list.length,
      data: list,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Gagal memuat program donasi.',
    });
  }
});

// @route   GET /api/donations/:id
// @desc    Detail program donasi beserta daftar donatur
router.get('/:id', async (req, res) => {
  try {
    const item = await donations.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Program donasi tidak ditemukan.',
      });
    }

    res.json({
      success: true,
      data: item,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Gagal memuat detail donasi.',
    });
  }
});

// @route   POST /api/donations/:id/donate
// @desc    Kirim konfirmasi donasi dari alumni / simpatisan
router.post('/:id/donate', async (req, res) => {
  try {
    const { nama, email, angkatan, nominal, pesan_doa, bukti_transfer, telegram_file_id } = req.body;

    if (!nominal || parseInt(nominal, 10) < 10000) {
      return res.status(400).json({
        success: false,
        message: 'Nominal donasi minimal adalah Rp 10.000.',
      });
    }

    const item = await donations.findById(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Program donasi tidak ditemukan.',
      });
    }

    const cleanNominal = parseInt(nominal, 10);
    const newDonatur = {
      nama: nama && nama.trim() ? nama.trim() : 'Hamba Allah',
      email: email ? email.trim() : '',
      angkatan: angkatan ? angkatan.trim() : 'Alumni / Simpatisan',
      nominal: cleanNominal,
      pesan_doa: pesan_doa ? pesan_doa.trim() : 'Semoga berkah bagi almamater.',
      bukti_transfer: bukti_transfer || '',
      telegram_file_id: telegram_file_id || '',
      status: 'verified',
      tanggal: new Date(),
    };

    const updated = await donations.findByIdAndUpdate(item._id, {
      $inc: { terkumpul: cleanNominal },
      $push: { donatur: newDonatur },
    });

    res.json({
      success: true,
      message: 'Alhamdulillah! Konfirmasi donasi Anda berhasil dicatat. Terima kasih banyak atas kepedulian bagi almamater SMA PGRI 2 Jombang.',
      data: updated,
    });
  } catch (err) {
    console.error('Error proses donasi:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal memproses konfirmasi donasi.',
    });
  }
});

// @route   POST /api/donations
// @desc    Buat program donasi baru (Admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { judul, deskripsi, target_nominal, cover_image, batas_waktu, rekening_tujuan, telegram_file_id } = req.body;

    if (!judul || !deskripsi || !target_nominal) {
      return res.status(400).json({
        success: false,
        message: 'Mohon lengkapi Judul, Deskripsi, dan Target Nominal donasi.',
      });
    }

    const created = await donations.create({
      judul: judul.trim(),
      deskripsi: deskripsi.trim(),
      target_nominal: parseInt(target_nominal, 10),
      terkumpul: 0,
      cover_image: cover_image || 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&auto=format&fit=crop&q=80',
      telegram_file_id: telegram_file_id || '',
      batas_waktu: batas_waktu ? new Date(batas_waktu) : new Date(Date.now() + 180 * 86400000),
      status: 'aktif',
      rekening_tujuan: rekening_tujuan || {
        bank: 'Bank Jatim / BSI',
        nomor_rekening: '011-2053-9726',
        atas_nama: 'Ikatan Alumni SMA PGRI 2 Jombang',
      },
      donatur: [],
    });

    res.status(201).json({
      success: true,
      message: 'Program donasi berhasil dibuat.',
      data: created,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Gagal membuat program donasi.',
    });
  }
});

// @route   PUT /api/donations/:id
// @desc    Update program donasi (Admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const updated = await donations.findByIdAndUpdate(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Program donasi tidak ditemukan.' });
    }
    res.json({
      success: true,
      message: 'Program donasi berhasil diperbarui.',
      data: updated,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal memperbarui donasi.' });
  }
});

// @route   DELETE /api/donations/:id
// @desc    Hapus program donasi (Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const deleted = await donations.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Program donasi tidak ditemukan.' });
    }
    res.json({
      success: true,
      message: 'Program donasi berhasil dihapus.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal menghapus donasi.' });
  }
});

module.exports = router;
