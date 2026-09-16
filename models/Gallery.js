const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  judul: {
    type: String,
    required: [true, 'Judul dokumentasi wajib diisi'],
    trim: true,
  },
  kategori: {
    type: String,
    enum: [
      'Reuni Akbar',
      'Kegiatan Sosial',
      'Sekolah & Almamater',
      'Temu Angkatan',
      'Dokumentasi Jadul',
      'Umum',
    ],
    default: 'Umum',
  },
  deskripsi: {
    type: String,
    default: '',
  },
  gambar_url: {
    type: String,
    required: [true, 'URL gambar dokumentasi wajib diisi'],
  },
  telegram_file_id: {
    type: String,
    default: '',
  },
  tanggal_kegiatan: {
    type: String,
    default: '2024',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Gallery', gallerySchema);
