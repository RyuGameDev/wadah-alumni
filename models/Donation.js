const mongoose = require('mongoose');

const donaturSubSchema = new mongoose.Schema({
  nama: {
    type: String,
    required: true,
    default: 'Hamba Allah',
  },
  email: {
    type: String,
    default: '',
  },
  angkatan: {
    type: String,
    default: 'Alumni / Simpatisan',
  },
  nominal: {
    type: Number,
    required: true,
  },
  pesan_doa: {
    type: String,
    default: 'Semoga berkah dan bermanfaat bagi almamater.',
  },
  bukti_transfer: {
    type: String,
    default: '',
  },
  telegram_file_id: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'verified',
  },
  tanggal: {
    type: Date,
    default: Date.now,
  },
});

const donationSchema = new mongoose.Schema({
  judul: {
    type: String,
    required: [true, 'Judul program donasi wajib diisi'],
    trim: true,
  },
  deskripsi: {
    type: String,
    required: [true, 'Deskripsi program donasi wajib diisi'],
  },
  target_nominal: {
    type: Number,
    required: [true, 'Target nominal wajib diisi'],
  },
  terkumpul: {
    type: Number,
    default: 0,
  },
  cover_image: {
    type: String,
    default: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&auto=format&fit=crop&q=80',
  },
  telegram_file_id: {
    type: String,
    default: '',
  },
  batas_waktu: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['aktif', 'selesai'],
    default: 'aktif',
  },
  rekening_tujuan: {
    bank: { type: String, default: 'Bank Jatim / BSI' },
    nomor_rekening: { type: String, default: '0112345678' },
    atas_nama: { type: String, default: 'Ikatan Alumni SMA PGRI 2 Jombang' },
    qris_image: { type: String, default: '' },
  },
  donatur: [donaturSubSchema],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Donation', donationSchema);
