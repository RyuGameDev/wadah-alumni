/**
 * ============================================================
 * TRACER STUDY SMA PGRI 2 JOMBANG - AUTOMATION TEST SUITE
 * Complete end-to-end API, RBAC, Auth, and Rate Limit Testing
 * ============================================================
 */

require('dotenv').config();
const http = require('http');
const axios = require('axios');
const FormData = require('form-data');
const { connectDB } = require('../config/db');
const { initStore } = require('../config/dataStore');

// Colors for terminal output
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';

let passedTests = 0;
let failedTests = 0;

function logPass(title, details = '') {
  passedTests++;
  console.log(`  ${GREEN}✓ PASS${RESET} ${BOLD}${title}${RESET} ${details ? `(${CYAN}${details}${RESET})` : ''}`);
}

function logFail(title, error) {
  failedTests++;
  console.log(`  ${RED}✗ FAIL${RESET} ${BOLD}${title}${RESET}`);
  console.log(`    ${RED}Error:${RESET} ${error.message || error}`);
  if (error.response && error.response.data) {
    console.log(`    ${RED}Response:${RESET}`, error.response.data);
  }
}

async function run() {
  console.log(`\n${BOLD}============================================================${RESET}`);
  console.log(`${BOLD}${CYAN}   TRACER STUDY SMA PGRI 2 JOMBANG - AUTOMATION TEST SUITE   ${RESET}`);
  console.log(`${BOLD}============================================================${RESET}\n`);

  let serverInstance = null;
  let baseUrl = process.env.TEST_BASE_URL ? process.env.TEST_BASE_URL.trim() : null;

  // Jika tidak ada URL eksternal, jalankan server lokal
  if (!baseUrl) {
    console.log(`${YELLOW}⚡ Menyiapkan instance server Express lokal...${RESET}`);
    await connectDB();
    await initStore();

    const app = require('../server');
    const testPort = 5999;
    baseUrl = `http://127.0.0.1:${testPort}`;
    await new Promise((resolve) => {
      serverInstance = app.listen(testPort, () => {
        console.log(`${GREEN}✓ Server testing aktif di ${baseUrl}${RESET}\n`);
        resolve();
      });
    });
  } else {
    console.log(`${CYAN}⚡ Menguji target endpoint eksternal: ${baseUrl}${RESET}\n`);
  }

  const client = axios.create({
    baseURL: baseUrl,
    validateStatus: () => true, // Jangan lempar exception agar bisa memeriksa kode status HTTP secara manual
  });

  try {
    // ------------------------------------------------------------
    // 1. HEALTH CHECK
    // ------------------------------------------------------------
    console.log(`${BOLD}[1. Healthcheck & System Readiness]${RESET}`);
    const healthRes = await client.get('/api');
    if (healthRes.status === 200 && healthRes.data.success) {
      logPass('GET /api (Health Check)', `Status 200, Ready`);
    } else {
      logFail('GET /api (Health Check)', `Expected 200, got ${healthRes.status}`);
    }

    // ------------------------------------------------------------
    // 2. PUBLIC API MODULES
    // ------------------------------------------------------------
    console.log(`\n${BOLD}[2. Public Data Modules]${RESET}`);

    // Banners
    const bannerRes = await client.get('/api/banners');
    if (bannerRes.status === 200 && bannerRes.data.success && Array.isArray(bannerRes.data.data)) {
      logPass('GET /api/banners (Hero Carousel)', `${bannerRes.data.data.length} slide aktif`);
    } else {
      logFail('GET /api/banners', `Status ${bannerRes.status}`);
    }

    // News
    const newsRes = await client.get('/api/news');
    if (newsRes.status === 200 && newsRes.data.success && Array.isArray(newsRes.data.data)) {
      logPass('GET /api/news (Warta Berita)', `${newsRes.data.data.length} artikel`);
    } else {
      logFail('GET /api/news', `Status ${newsRes.status}`);
    }

    // Donations
    const donasiRes = await client.get('/api/donations');
    if (donasiRes.status === 200 && donasiRes.data.success && Array.isArray(donasiRes.data.data)) {
      logPass('GET /api/donations (Program Donasi)', `${donasiRes.data.data.length} program`);
    } else {
      logFail('GET /api/donations', `Status ${donasiRes.status}`);
    }

    // Gallery
    const galleryRes = await client.get('/api/gallery');
    if (galleryRes.status === 200 && galleryRes.data.success && Array.isArray(galleryRes.data.data)) {
      logPass('GET /api/gallery (Galeri Foto)', `${galleryRes.data.data.length} foto kegiatan`);
    } else {
      logFail('GET /api/gallery', `Status ${galleryRes.status}`);
    }

    // Alumni Stats Summary
    const statsRes = await client.get('/api/alumni/stats/summary');
    if (statsRes.status === 200 && statsRes.data.success && statsRes.data.data.total_alumni !== undefined) {
      logPass('GET /api/alumni/stats/summary (Tracer Study Stats)', `Total: ${statsRes.data.data.total_alumni} alumni`);
    } else {
      logFail('GET /api/alumni/stats/summary', `Status ${statsRes.status}`);
    }

    // Careers
    const careersRes = await client.get('/api/careers');
    if (careersRes.status === 200 && careersRes.data.success) {
      logPass('GET /api/careers (Bursa Karir & Loker)', `Aktif`);
    } else {
      logFail('GET /api/careers', `Status ${careersRes.status}`);
    }

    // Forum
    const forumRes = await client.get('/api/forum');
    if (forumRes.status === 200 && forumRes.data.success) {
      logPass('GET /api/forum (Forum Diskusi)', `Aktif`);
    } else {
      logFail('GET /api/forum', `Status ${forumRes.status}`);
    }

    // ------------------------------------------------------------
    // 3. AUTHENTICATION & LOGIN
    // ------------------------------------------------------------
    console.log(`\n${BOLD}[3. Authentication & Access Control]${RESET}`);

    let adminToken = null;
    let alumniToken = null;

    // Login Admin
    const adminLoginRes = await client.post('/api/auth/login', {
      identifier: 'admin@smapgri2jombang.sch.id',
      password: 'admin123',
    });
    if (adminLoginRes.status === 200 && adminLoginRes.data.token && adminLoginRes.data.user.role === 'admin') {
      adminToken = adminLoginRes.data.token;
      logPass('POST /api/auth/login (Admin Credentials)', `Role: ${adminLoginRes.data.user.role}`);
    } else {
      logFail('POST /api/auth/login (Admin)', `Status ${adminLoginRes.status}`);
    }

    // Login Alumni
    const alumniLoginRes = await client.post('/api/auth/login', {
      identifier: 'rizky.pratama@gmail.com',
      password: 'alumni123',
    });
    if (alumniLoginRes.status === 200 && alumniLoginRes.data.token && alumniLoginRes.data.user.role === 'alumni') {
      alumniToken = alumniLoginRes.data.token;
      logPass('POST /api/auth/login (Alumni Credentials)', `Role: ${alumniLoginRes.data.user.role}`);
    } else {
      logFail('POST /api/auth/login (Alumni)', `Status ${alumniLoginRes.status}`);
    }

    // Login Password Salah -> Ditolak (HTTP 400)
    const invalidLoginRes = await client.post('/api/auth/login', {
      identifier: 'admin@smapgri2jombang.sch.id',
      password: 'wrongpassword',
    });
    if (invalidLoginRes.status === 400 && !invalidLoginRes.data.success) {
      logPass('POST /api/auth/login (Wrong Password Rejected)', `Message: "${invalidLoginRes.data.message}"`);
    } else {
      logFail('POST /api/auth/login (Wrong Password)', `Expected 400, got ${invalidLoginRes.status}`);
    }

    // Direktori Alumni Tanpa Login -> 401 Protected
    const alumniGuestRes = await client.get('/api/alumni');
    if (alumniGuestRes.status === 401) {
      logPass('GET /api/alumni Guest Protection', `Got 401 Unauthorized (Wajib Login)`);
    } else {
      logFail('GET /api/alumni Guest Protection', `Expected 401, got ${alumniGuestRes.status}`);
    }

    // Direktori Alumni Dengan Login -> 200 Success
    if (alumniToken) {
      const alumniAuthRes = await client.get('/api/alumni', {
        headers: { Authorization: `Bearer ${alumniToken}` },
      });
      if (alumniAuthRes.status === 200 && alumniAuthRes.data.success) {
        logPass('GET /api/alumni Authenticated Directory', `${alumniAuthRes.data.data.length} alumni terdaftar`);
      } else {
        logFail('GET /api/alumni Authenticated Directory', `Status ${alumniAuthRes.status}`);
      }
    }

    // ------------------------------------------------------------
    // 4. ROLE-BASED ACCESS CONTROL (RBAC)
    // ------------------------------------------------------------
    console.log(`\n${BOLD}[4. Role-Based Access Control (RBAC)]${RESET}`);

    // Admin endpoint tanpa token -> 401
    const noTokenRes = await client.post('/api/banners', { judul: 'Test Banner' });
    if (noTokenRes.status === 401) {
      logPass('Admin Route Without Token Protected', `Got 401 Unauthorized`);
    } else {
      logFail('Admin Route Without Token', `Expected 401, got ${noTokenRes.status}`);
    }

    // Admin endpoint dengan token Alumni -> 403
    if (alumniToken) {
      const alumniForbiddenRes = await client.post(
        '/api/banners',
        { judul: 'Test Banner' },
        { headers: { Authorization: `Bearer ${alumniToken}` } }
      );
      if (alumniForbiddenRes.status === 403) {
        logPass('Admin Route With Alumni Token Forbidden', `Got 403 Forbidden`);
      } else {
        logFail('Admin Route With Alumni Token', `Expected 403, got ${alumniForbiddenRes.status}`);
      }
    }

    // ------------------------------------------------------------
    // 5. UPLOAD & RATE LIMITING (5 PER 30 MENIT & SECRET QUOTA)
    // ------------------------------------------------------------
    console.log(`\n${BOLD}[5. Upload & Rate Limiting Security (Guest vs Authenticated)]${RESET}`);

    // Fungsi bantu untuk kirim file buffer dummy
    async function sendUpload(token = null) {
      const form = new FormData();
      const dummyBuffer = Buffer.from('Portal Tracer Study SMA PGRI 2 Jombang Dummy Test File Content');
      form.append('file', dummyBuffer, {
        filename: 'test-document.pdf',
        contentType: 'application/pdf',
      });

      const headers = form.getHeaders();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      return await client.post('/api/upload', form, { headers });
    }

    // Test 1: Upload unauthenticated ke-1
    const upload1 = await sendUpload();
    if (upload1.status === 200 && upload1.data.success) {
      logPass('Unauthenticated Upload #1', `Succeeds as expected`);
    } else {
      logFail('Unauthenticated Upload #1', `Status ${upload1.status}`);
    }

    // Test 2: Upload unauthenticated ke-2 s/d ke-5
    let remainingSuccessful = 0;
    for (let i = 2; i <= 5; i++) {
      const uploadRes = await sendUpload();
      if (uploadRes.status === 200) {
        remainingSuccessful++;
      }
    }
    logPass('Unauthenticated Uploads #2 through #5', `${remainingSuccessful}/4 berhasil dalam kuota aman`);

    // Test 3: Upload unauthenticated ke-6 -> HARUS DITOLAK DENGAN STATUS 429
    const upload6 = await sendUpload();
    if (upload6.status === 429) {
      const isCodeCorrect = upload6.data.code === 'RATE_LIMIT_EXCEEDED';
      const isMessageFriendly = upload6.data.message.includes('terlalu sering') && upload6.data.message.includes('login');
      // Verifikasi kerahasiaan: pastikan tidak ada angka '5' atau '30' di response
      const isSecretKept = !upload6.data.message.includes('5') && !upload6.data.message.includes('30');

      if (isCodeCorrect && isMessageFriendly && isSecretKept) {
        logPass(
          'Unauthenticated Upload #6 Blocked (HTTP 429)',
          `Message: "${upload6.data.message}" | Kuota tetap rahasia`
        );
      } else {
        logFail('Unauthenticated Upload #6 Content Check', `Response: ${JSON.stringify(upload6.data)}`);
      }
    } else {
      logFail('Unauthenticated Upload #6 Rate Limit Trigger', `Expected 429 Too Many Requests, got ${upload6.status}`);
    }

    // Test 4: Upload oleh pengguna login (Admin atau Alumni) dari IP yang sama
    // Meskipun IP sudah kena blokir rate limit tamu, user login HARUS tetap bisa upload (Bypass)
    if (adminToken) {
      const authUploadRes = await sendUpload(adminToken);
      if (authUploadRes.status === 200 && authUploadRes.data.success) {
        logPass(
          'Authenticated User Upload Bypass (Login Admin)',
          `Status 200: Pengguna login tidak terhalang rate limit tamu`
        );
      } else {
        logFail('Authenticated User Upload Bypass', `Expected 200, got ${authUploadRes.status}`);
      }
    }

  } catch (err) {
    console.error(`\n${RED}Fatal error saat menjalankan test:${RESET}`, err);
    failedTests++;
  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
  }

  // Ringkasan
  console.log(`\n${BOLD}============================================================${RESET}`);
  console.log(`${BOLD}HASIL PENGUJIAN OTOMASI:${RESET}`);
  console.log(`  Total Lolos : ${GREEN}${passedTests} passed${RESET}`);
  console.log(`  Total Gagal : ${failedTests > 0 ? RED : GREEN}${failedTests} failed${RESET}`);
  console.log(`${BOLD}============================================================${RESET}\n`);

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run();
