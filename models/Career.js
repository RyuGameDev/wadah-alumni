const mongoose = require('mongoose');

const careerSchema = new mongoose.Schema({
  posisi: {
    type: String,
    required: [true, 'Posisi / jabatan wajib diisi'],
    trim: true,
  },
  perusahaan: {
    type: String,
    required: [true, 'Nama perusahaan / instansi wajib diisi'],
    trim: true,
  },
  lokasi: {
    type: String,
    required: [true, 'Lokasi penempatan kerja wajib diisi'],
    trim: true,
  },
  tipe_pekerjaan: {
    type: String,
    enum: [
      'Penuh Waktu (Full Time)',
      'Paruh Waktu (Part Time)',
      'Magang (Internship)',
      'Pekerja Lepas (Freelance)',
      'BUMN / Instansi Pemerintah',
      'Wirausaha Mitra',
    ],
    default: 'Penuh Waktu (Full Time)',
  },
  rentang_gaji: {
    type: String,
    default: 'Kompetitif / Sesuai UMK',
  },
  deskripsi: {
    type: String,
    required: [true, 'Deskripsi pekerjaan wajib diisi'],
  },
  kualifikasi: {
    type: String,
    required: [true, 'Kualifikasi pekerjaan wajib diisi'],
  },
  kontak_lamaran: {
    type: String,
    required: [true, 'Kontak pendaftaran / link apply wajib diisi'],
  },
  logo_perusahaan: {
    type: String,
    default: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&auto=format&fit=crop&q=80',
  },
  status: {
    type: String,
    enum: ['buka', 'tutup'],
    default: 'buka',
  },
  diposting_oleh: {
    type: String,
    default: 'Alumni Network SMA PGRI 2 Jombang',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Career', careerSchema);
