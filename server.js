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

// Inisialisasi Database & Store otomatis (serverless compatible)
let isInit = false;
let initPromise = null;

async function ensureStoreReady() {
  if (!isInit) {
    if (!initPromise) {
      initPromise = (async () => {
        try {
          await connectDB();
          await initStore();
        } catch (e) {
          console.error('Inisialisasi store gagal:', e.message);
        } finally {
          isInit = true;
        }
      })();
    }
    await initPromise;
  }
}

app.use(async (req, res, next) => {
  try {
    await ensureStoreReady();
    next();
  } catch (err) {
    console.error('Inisialisasi store middleware error:', err);
    next();
  }
});

// Healthcheck Endpoint API
const healthHandler = (req, res) => {
  res.json({
    success: true,
    message: 'Portal Tracer Study & Alumni SMA PGRI 2 Jombang API is active and ready.',
    timestamp: new Date().toISOString(),
  });
};
app.get('/api', healthHandler);
app.get('/api/health', healthHandler);

// Endpoint Informasi Sekolah Resmi SMA PGRI 2 Jombang
const schoolInfoHandler = (req, res) => {
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
};
app.get('/api/school-info', schoolInfoHandler);
app.get('/school-info', schoolInfoHandler);

// Mounting Rute API (dengan dan tanpa prefix /api untuk fleksibilitas serverless)
const authRoutes = require('./routes/auth');
const alumniRoutes = require('./routes/alumni');
const newsRoutes = require('./routes/news');
const donationRoutes = require('./routes/donation');
const careerRoutes = require('./routes/career');
const forumRoutes = require('./routes/forum');
const galleryRoutes = require('./routes/gallery');
const uploadRoutes = require('./routes/upload');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/alumni', alumniRoutes);
app.use('/alumni', alumniRoutes);

app.use('/api/news', newsRoutes);
app.use('/news', newsRoutes);

app.use('/api/donations', donationRoutes);
app.use('/donations', donationRoutes);

app.use('/api/careers', careerRoutes);
app.use('/careers', careerRoutes);

app.use('/api/forum', forumRoutes);
app.use('/forum', forumRoutes);

app.use('/api/gallery', galleryRoutes);
app.use('/gallery', galleryRoutes);

app.use('/api/upload', uploadRoutes);
app.use('/upload', uploadRoutes);

app.use('/api/media', uploadRoutes);
app.use('/media', uploadRoutes);

app.use('/api/admin', adminRoutes);
app.use('/admin', adminRoutes);

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

// Start Server jika dijalankan langsung (bukan serverless)
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

if (require.main === module && !process.env.VERCEL) {
  startServer();
}

module.exports = app;
