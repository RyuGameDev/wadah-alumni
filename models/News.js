const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  judul: {
    type: String,
    required: [true, 'Judul berita wajib diisi'],
    trim: true,
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
  },
  kategori: {
    type: String,
    enum: [
      'Prestasi Alumni',
      'Reuni & Temu Kangen',
      'Kegiatan Sekolah',
      'Info Akademik & Kampus',
      'Kabar Sosial & Komunitas',
      'Umum',
    ],
    default: 'Umum',
  },
  ringkasan: {
    type: String,
    required: [true, 'Ringkasan berita wajib diisi'],
  },
  konten: {
    type: String,
    required: [true, 'Isi berita wajib diisi'],
  },
  cover_image: {
    type: String,
    default: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop&q=80',
  },
  telegram_file_id: {
    type: String,
    default: '',
  },
  author: {
    type: String,
    default: 'Humas SMA PGRI 2 Jombang',
  },
  views: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('News', newsSchema);
