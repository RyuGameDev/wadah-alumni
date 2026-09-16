const mongoose = require('mongoose');

const tracerStudySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  nisn: {
    type: String,
    required: true,
  },
  nama_lengkap: {
    type: String,
    required: true,
  },
  tahun_lulus: {
    type: Number,
    required: true,
  },
  jurusan: {
    type: String,
    default: 'MIPA / IPA',
  },
  status_saat_ini: {
    type: String,
    enum: ['Melanjutkan Studi', 'Bekerja', 'Wirausaha', 'Mencari Kerja', 'Lainnya'],
    required: true,
  },

  // Rincian jika Kuliah
  data_kuliah: {
    perguruan_tinggi: { type: String, default: '' },
    fakultas: { type: String, default: '' },
    program_studi: { type: String, default: '' },
    jenjang: { type: String, enum: ['D3', 'D4', 'S1', 'S2', 'Kedinasan', 'Lainnya', ''], default: '' },
    tahun_masuk: { type: Number, default: null },
    jalur_masuk: { type: String, enum: ['SNBP / Prestasi', 'SNBT / UTBK', 'Mandiri', 'Beasiswa', 'Lainnya', ''], default: '' },
  },

  // Rincian jika Bekerja
  data_kerja: {
    nama_perusahaan: { type: String, default: '' },
    bidang_usaha: { type: String, default: '' },
    jabatan: { type: String, default: '' },
    waktu_tunggu_bulan: { type: Number, default: 0 },
    rentang_gaji: {
      type: String,
      enum: ['< Rp 2.000.000', 'Rp 2.000.000 - Rp 4.000.000', 'Rp 4.000.000 - Rp 7.000.000', 'Rp 7.000.000 - Rp 12.000.000', '> Rp 12.000.000', ''],
      default: '',
    },
    lokasi_kerja: { type: String, default: '' },
    keselarasan_bidang: {
      type: String,
      enum: ['Sangat Selaras', 'Cukup Selaras', 'Kurang Selaras', 'Tidak Selaras', ''],
      default: '',
    },
  },

  // Rincian jika Wirausaha
  data_wirausaha: {
    nama_usaha: { type: String, default: '' },
    bidang_usaha: { type: String, default: '' },
    jumlah_karyawan: { type: Number, default: 0 },
    omzet_bulanan: {
      type: String,
      enum: ['< Rp 5.000.000', 'Rp 5.000.000 - Rp 15.000.000', 'Rp 15.000.000 - Rp 50.000.000', '> Rp 50.000.000', ''],
      default: '',
    },
  },

  // Umpan balik & evaluasi almamater
  umpan_balik: {
    kepuasan_pembelajaran: {
      type: Number, // Skala 1 - 5
      default: 5,
    },
    aspek_paling_bermanfaat: {
      type: String,
      default: '',
    },
    saran_untuk_sekolah: {
      type: String,
      default: '',
    },
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('TracerStudy', tracerStudySchema);
