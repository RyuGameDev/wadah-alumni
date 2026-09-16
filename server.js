require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/db');
const { initStore } = require('./config/dataStore');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Endpoint Informasi Sekolah Resmi SMA PGRI 2 Jombang
app.get('/api/school-info', (req, res) => {
  res.json({
    success: true,
    data: {
      nama_sekolah: 'SMA PGRI 2 Jombang',
      singkatan: 'Grida Joe',
      slogan: 'Sekolahnya Para Juara',
      npsn: '20539726',
      status: 'Swasta Terakreditasi A',
      tahun_berdiri: '1 Juli 1982',
      visi: 'IMPRESSIA - Mewujudkan Siswa yang Beriman, Berprestasi, Berkreasi, dan Berakhlak Mulia',
      alamat: 'Jl. KH. Ahmad Dahlan No. 23, Kel. Jombatan, Kec. Jombang, Kab. Jombang, Jawa Timur 61419',
      telepon: '(0321) 861234 / 0812-3456-7890',
      email: 'info@smapgri2jombang.sch.id',
      website: 'www.smapgri2jombang.sch.id',
      instagram: '@smapgri2jombang_official',
      youtube: 'SMA Grida Joe',
      logo_url: 'https://p.taplink.st/a/5/7/c/3/c54b26.jpg?1',
      storage_type: process.env.TELEGRAM_BOT_TOKEN ? 'Telegram Bot API Storage' : 'Local Fallback Storage (Ready for Telegram)',
    },
  });
});

// Mounting Rute API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/alumni', require('./routes/alumni'));
app.use('/api/news', require('./routes/news'));
app.use('/api/donations', require('./routes/donation'));
app.use('/api/careers', require('./routes/career'));
app.use('/api/forum', require('./routes/forum'));
app.use('/api/gallery', require('./routes/gallery'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/media', require('./routes/upload'));
app.use('/api/admin', require('./routes/admin'));

// SPA Catch-all: seluruh rute non-API diarahkan ke index.html
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'Endpoint API tidak ditemukan' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling global
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan internal pada server.',
  });
});

// Start Server
async function startServer() {
  try {
    await connectDB();
    await initStore();

    app.listen(PORT, () => {
      console.log('================================================================');
      console.log(`🚀 Portal Tracer Study SMA PGRI 2 Jombang berjalan di port ${PORT}`);
      console.log(`🌐 Akses web: http://localhost:${PORT}`);
      console.log(`🔐 Akun Admin Default: admin@smapgri2jombang.sch.id | Password: admin123`);
      console.log('================================================================');
    });
  } catch (err) {
    console.error('Gagal menjalankan server:', err);
  }
}

startServer();
