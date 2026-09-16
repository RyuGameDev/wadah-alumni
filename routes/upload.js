const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  MAX_PHOTO_BYTES,
  MAX_DOCUMENT_BYTES,
  uploadToStorage,
  getTelegramFileStream,
} = require('../config/telegram');
const { unauthenticatedUploadLimiter } = require('../middleware/rateLimiter');

// Konfigurasi Multer dengan MemoryStorage dan batas maksimal Telegram Bot
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_DOCUMENT_BYTES, // Limit absolut Multer 20MB
  },
  fileFilter: (req, file, cb) => {
    // Izinkan gambar dan dokumen standar
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipe berkas ${file.mimetype} tidak didukung. Harap unggah foto (JPG/PNG/WEBP) atau dokumen PDF.`));
    }
  },
});

// Middleware penanganan batas ukuran spesifik Telegram (10MB foto vs 20MB dokumen)
const handleUpload = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: `Ukuran berkas melebihi batas kemampuan bot Telegram (maksimal 20 MB). Silakan perkecil ukuran berkas Anda.`,
        });
      }
      return res.status(400).json({ success: false, message: `Kesalahan unggah: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Tidak ada berkas yang diunggah.' });
    }

    // Validasi khusus foto: Telegram sendPhoto maksimal 10MB
    const isImage = req.file.mimetype.startsWith('image/');
    if (isImage && req.file.size > MAX_PHOTO_BYTES) {
      return res.status(400).json({
        success: false,
        message: `Ukuran foto (${(req.file.size / 1024 / 1024).toFixed(2)} MB) melebihi batas kemampuan Telegram Bot untuk foto (maksimal 10 MB). Silakan kompres foto Anda terlebih dahulu.`,
      });
    }

    next();
  });
};

// @route   POST /api/upload
// @desc    Unggah berkas ke Telegram Bot Storage (dilengkapi proteksi rate limit untuk tamu)
router.post('/', unauthenticatedUploadLimiter, handleUpload, async (req, res) => {
  try {
    const result = await uploadToStorage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    res.json({
      success: true,
      message: 'Berkas berhasil disimpan ke sistem penyimpanan.',
      data: result,
    });
  } catch (err) {
    console.error('Error proses penyimpanan berkas:', err);
    res.status(500).json({
      success: false,
      message: `Gagal menyimpan berkas: ${err.message}`,
    });
  }
});

// @route   GET /api/media/:fileId
// @desc    Proxy streaming media dari Telegram Bot API ke klien
router.get('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const { stream, contentType, contentLength } = await getTelegramFileStream(fileId);

    res.setHeader('Content-Type', contentType);
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache 1 hari

    stream.pipe(res);
  } catch (err) {
    console.error(`Gagal streaming berkas media ${req.params.fileId}:`, err.message);
    res.status(404).send('Berkas tidak ditemukan atau bot token Telegram belum dikonfigurasi.');
  }
});

module.exports = router;
