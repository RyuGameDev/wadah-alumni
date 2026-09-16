const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nama_lengkap: {
    type: String,
    required: [true, 'Nama lengkap wajib diisi'],
    trim: true,
  },
  nisn: {
    type: String,
    required: [true, 'NISN wajib diisi'],
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email wajib diisi'],
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, 'Password wajib diisi'],
  },
  no_telepon: {
    type: String,
    trim: true,
    default: '',
  },
  tahun_lulus: {
    type: Number,
    required: [true, 'Tahun kelulusan wajib diisi'],
  },
  jurusan: {
    type: String,
    enum: ['MIPA / IPA', 'IPS', 'Bahasa & Budaya', 'Umum'],
    default: 'MIPA / IPA',
  },
  role: {
    type: String,
    enum: ['alumni', 'admin'],
    default: 'alumni',
  },
  status_verifikasi: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved', // default approved agar registrasi langsung bisa dicoba atau pending jika diverifikasi admin
  },
  catatan_verifikasi: {
    type: String,
    default: '',
  },
  foto_profil: {
    type: String,
    default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  },
  alamat: {
    type: String,
    default: '',
  },
  bio: {
    type: String,
    default: '',
  },
  linkedin: {
    type: String,
    default: '',
  },
  instagram: {
    type: String,
    default: '',
  },
  status_saat_ini: {
    type: String,
    enum: ['Melanjutkan Studi', 'Bekerja', 'Wirausaha', 'Mencari Kerja', 'Lainnya'],
    default: 'Melanjutkan Studi',
  },
  nama_instansi_terkini: {
    type: String,
    default: '',
  },
  jabatan_atau_prodi: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);
