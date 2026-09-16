const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  judul: {
    type: String,
    required: [true, 'Judul slide banner wajib diisi'],
    trim: true,
  },
  subjudul: {
    type: String,
    default: '',
    trim: true,
  },
  gambar_url: {
    type: String,
    required: [true, 'URL gambar slide banner wajib diisi'],
  },
  telegram_file_id: {
    type: String,
    default: '',
  },
  urutan: {
    type: Number,
    default: 1,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Banner', bannerSchema);
