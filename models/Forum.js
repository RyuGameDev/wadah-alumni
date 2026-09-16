const mongoose = require('mongoose');

const forumCommentSchema = new mongoose.Schema({
  author_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  author_nama: {
    type: String,
    required: true,
  },
  author_angkatan: {
    type: String,
    default: 'Alumni',
  },
  author_foto: {
    type: String,
    default: '',
  },
  konten: {
    type: String,
    required: true,
  },
  tanggal: {
    type: Date,
    default: Date.now,
  },
});

const forumSchema = new mongoose.Schema({
  judul: {
    type: String,
    required: [true, 'Judul topik forum wajib diisi'],
    trim: true,
  },
  kategori: {
    type: String,
    enum: [
      'Diskusi Umum',
      'Sharing Karir & Dunia Kerja',
      'Info Kampus & Perkuliahan',
      'Peluang Bisnis & Wirausaha',
      'Nostalgia & Info Reuni',
    ],
    default: 'Diskusi Umum',
  },
  konten: {
    type: String,
    required: [true, 'Isi topik diskusi wajib diisi'],
  },
  author_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  author_nama: {
    type: String,
    required: true,
  },
  author_angkatan: {
    type: String,
    default: 'Alumni',
  },
  author_foto: {
    type: String,
    default: '',
  },
  lampiran_gambar: {
    type: String,
    default: '',
  },
  telegram_file_id: {
    type: String,
    default: '',
  },
  upvotes_count: {
    type: Number,
    default: 0,
  },
  komentar: [forumCommentSchema],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Forum', forumSchema);
