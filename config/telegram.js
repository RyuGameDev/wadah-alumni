const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Limit sesuai kemampuan resmi Telegram Bot API
const MAX_PHOTO_BYTES = (parseInt(process.env.MAX_PHOTO_SIZE_MB, 10) || 10) * 1024 * 1024; // 10 MB
const MAX_DOCUMENT_BYTES = (parseInt(process.env.MAX_DOCUMENT_SIZE_MB, 10) || 20) * 1024 * 1024; // 20 MB

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
const TELEGRAM_API_BASE = 'https://api.telegram.org';

// Pastikan direktori uploads lokal ada untuk fallback (serverless compatible)
const UPLOAD_DIR = process.env.VERCEL ? path.join('/tmp', 'uploads') : path.join(__dirname, '..', 'uploads');
try {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
} catch (e) {}

/**
 * Upload berkas ke Telegram Bot atau fallback ke lokal jika token belum diisi.
 * @param {Buffer} fileBuffer - Buffer berkas
 * @param {string} originalname - Nama asli berkas
 * @param {string} mimetype - Tipe mime berkas
 * @returns {Promise<{ storage: string, fileId?: string, url: string, originalName: string, mimeType: string, size: number }>}
 */
async function uploadToStorage(fileBuffer, originalname, mimetype) {
  const size = fileBuffer.length;

  // Cek apakah konfigurasi Telegram Bot aktif
  const isTelegramConfigured = Boolean(BOT_TOKEN && CHAT_ID);

  if (isTelegramConfigured) {
    try {
      const isPhoto = mimetype.startsWith('image/') && !mimetype.includes('gif') && size <= MAX_PHOTO_BYTES;
      const endpoint = isPhoto ? 'sendPhoto' : 'sendDocument';
      const formField = isPhoto ? 'photo' : 'document';

      const formData = new FormData();
      formData.append('chat_id', CHAT_ID);
      formData.append(
        formField,
        fileBuffer,
        {
          filename: originalname,
          contentType: mimetype,
        }
      );
      formData.append('caption', `📁 Tracer Study SMA PGRI 2 Jombang: ${originalname} (${(size / 1024).toFixed(1)} KB)`);

      const response = await axios.post(
        `${TELEGRAM_API_BASE}/bot${BOT_TOKEN}/${endpoint}`,
        formData,
        {
          headers: formData.getHeaders(),
          maxContentLength: MAX_DOCUMENT_BYTES + 1024 * 1024,
          maxBodyLength: MAX_DOCUMENT_BYTES + 1024 * 1024,
          timeout: 30000,
        }
      );

      const result = response.data.result;
      let fileId = '';

      if (isPhoto && result.photo && result.photo.length > 0) {
        // Ambil foto dengan resolusi terbaik (elemen terakhir)
        fileId = result.photo[result.photo.length - 1].file_id;
      } else if (result.document) {
        fileId = result.document.file_id;
      }

      if (!fileId) {
        throw new Error('Gagal mengekstrak file_id dari respon Telegram Bot');
      }

      return {
        storage: 'telegram',
        fileId,
        url: `/api/media/${fileId}`,
        originalName: originalname,
        mimeType: mimetype,
        size,
      };
    } catch (telegramErr) {
      console.error('⚠️ Gagal upload ke Telegram Bot API, menggunakan fallback lokal:', telegramErr.message);
      // Fallback ke penyimpanan lokal jika bot error atau token salah
    }
  }

  // Fallback Penyimpanan Lokal
  const ext = path.extname(originalname);
  const safeFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  const localFilePath = path.join(UPLOAD_DIR, safeFilename);

  await fs.promises.writeFile(localFilePath, fileBuffer);

  return {
    storage: 'local',
    url: `/uploads/${safeFilename}`,
    originalName: originalname,
    mimeType: mimetype,
    size,
  };
}

/**
 * Mendapatkan stream berkas dari Telegram Bot untuk disajikan ke browser klien
 * @param {string} fileId 
 * @returns {Promise<{ stream: any, contentType: string, contentLength: number }>}
 */
async function getTelegramFileStream(fileId) {
  if (!BOT_TOKEN) {
    throw new Error('Telegram bot token belum dikonfigurasi');
  }

  // 1. Dapatkan file_path dari getFile
  const getFileRes = await axios.get(`${TELEGRAM_API_BASE}/bot${BOT_TOKEN}/getFile?file_id=${fileId}`);
  if (!getFileRes.data || !getFileRes.data.ok || !getFileRes.data.result.file_path) {
    throw new Error('Berkas tidak ditemukan di server Telegram');
  }

  const filePath = getFileRes.data.result.file_path;
  const fileUrl = `${TELEGRAM_API_BASE}/file/bot${BOT_TOKEN}/${filePath}`;

  // 2. Stream berkas dari Telegram
  const streamRes = await axios.get(fileUrl, {
    responseType: 'stream',
    timeout: 30000,
  });

  return {
    stream: streamRes.data,
    contentType: streamRes.headers['content-type'] || 'application/octet-stream',
    contentLength: streamRes.headers['content-length'],
  };
}

module.exports = {
  MAX_PHOTO_BYTES,
  MAX_DOCUMENT_BYTES,
  uploadToStorage,
  getTelegramFileStream,
};
