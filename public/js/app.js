/**
 * ============================================================
 * TRACER STUDY SMA PGRI 2 JOMBANG - CLIENT CORE (app.js)
 * State Management, API Communication, Storage & Upload Handler
 * ============================================================
 */

const App = {
  state: {
    user: null,
    token: null,
    schoolInfo: null,
    stats: null,
    activeView: 'home',
  },

  // Inisialisasi Aplikasi
  async init() {
    this.loadAuthFromStorage();
    await this.fetchSchoolInfo();
    this.setupEventListeners();
    Router.init();
    this.renderHeaderUserStatus();
  },

  // Memuat sesi autentikasi dari localStorage
  loadAuthFromStorage() {
    const savedToken = localStorage.getItem('grida_token');
    const savedUser = localStorage.getItem('grida_user');
    if (savedToken && savedUser) {
      try {
        this.state.token = savedToken;
        this.state.user = JSON.parse(savedUser);
      } catch (e) {
        this.logout();
      }
    }
  },

  // Simpan sesi autentikasi
  saveAuth(token, user) {
    this.state.token = token;
    this.state.user = user;
    localStorage.setItem('grida_token', token);
    localStorage.setItem('grida_user', JSON.stringify(user));
    this.renderHeaderUserStatus();
  },

  // Keluar sesi
  logout() {
    this.state.token = null;
    this.state.user = null;
    localStorage.removeItem('grida_token');
    localStorage.removeItem('grida_user');
    this.renderHeaderUserStatus();
    this.showToast('Anda telah berhasil keluar.', 'info');
    Router.navigate('home');
  },

  // Ambil informasi resmi sekolah
  async fetchSchoolInfo() {
    try {
      const res = await fetch('/api/school-info');
      const data = await res.json();
      if (data.success) {
        this.state.schoolInfo = data.data;
      }
    } catch (err) {
      console.error('Gagal mengambil data sekolah:', err);
    }
  },

  // In-Memory API Cache untuk Navigasi Instan (0 detik)
  apiCache: new Map(),

  clearCache(pattern = null) {
    if (!pattern) {
      this.apiCache.clear();
      return;
    }
    for (const key of this.apiCache.keys()) {
      if (key.includes(pattern)) {
        this.apiCache.delete(key);
      }
    }
  },

  // Top Progress Bar ala YouTube / GitHub (Halus & Modern)
  startProgressBar() {
    let bar = document.getElementById('top-progress-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'top-progress-bar';
      document.body.prepend(bar);
    }
    bar.style.opacity = '1';
    bar.style.width = '30%';

    clearTimeout(this._progTimer1);
    clearTimeout(this._progTimer2);
    this._progTimer1 = setTimeout(() => {
      if (bar) bar.style.width = '70%';
    }, 120);
    this._progTimer2 = setTimeout(() => {
      if (bar) bar.style.width = '88%';
    }, 300);
  },

  finishProgressBar() {
    clearTimeout(this._progTimer1);
    clearTimeout(this._progTimer2);
    const bar = document.getElementById('top-progress-bar');
    if (bar) {
      bar.style.width = '100%';
      setTimeout(() => {
        bar.style.opacity = '0';
        setTimeout(() => {
          bar.style.width = '0%';
        }, 280);
      }, 180);
    }
  },

  // Helper request API dengan token otomatis, error handling aman, dan in-memory cache
  async apiRequest(url, options = {}, bypassCache = false) {
    const method = (options.method || 'GET').toUpperCase();

    // Jika mutasi data (POST, PUT, DELETE), reset cache agar data selalu terbarukan
    if (method !== 'GET') {
      this.clearCache();
    } else if (!bypassCache && !options.headers) {
      // Periksa cache memori (valid 90 detik)
      const cached = this.apiCache.get(url);
      const now = Date.now();
      if (cached && (now - cached.timestamp < 90000)) {
        return JSON.parse(JSON.stringify(cached.data));
      }
    }

    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (this.state.token) {
      headers['Authorization'] = `Bearer ${this.state.token}`;
    }

    try {
      const response = await fetch(url, { ...options, headers });
      
      let data = {};
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (parseErr) {
          data = { message: 'Format respons tidak valid.' };
        }
      } else {
        const textResp = await response.text();
        data = { message: textResp || 'Terjadi kesalahan pada server.' };
      }

      if (response.status === 401) {
        this.state.token = null;
        this.state.user = null;
        localStorage.removeItem('grida_token');
        localStorage.removeItem('grida_user');
        this.renderHeaderUserStatus();
        throw new Error(data.message || 'Sesi telah berakhir atau Anda belum login.');
      }

      if (!response.ok) {
        throw new Error(data.message || 'Terjadi kesalahan saat memproses permintaan.');
      }

      // Simpan respons GET publik ke memori
      if (method === 'GET' && !this.state.token) {
        this.apiCache.set(url, { data, timestamp: Date.now() });
      }

      return data;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Upload berkas ke sistem penyimpanan cloud
   * Dilengkapi validasi berkas:
   * - Maksimal Foto: 10 MB
   * - Maksimal Dokumen: 20 MB
   */
  async uploadFile(fileInputOrFile) {
    const file = fileInputOrFile instanceof File ? fileInputOrFile : fileInputOrFile.files[0];
    if (!file) {
      throw new Error('Tidak ada berkas yang dipilih.');
    }

    const isImage = file.type.startsWith('image/');
    const MAX_PHOTO_MB = 10;
    const MAX_DOC_MB = 20;

    // Validasi ukuran berkas di sisi klien
    if (isImage && file.size > MAX_PHOTO_MB * 1024 * 1024) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      throw new Error(`Ukuran foto (${sizeMB} MB) melebihi batas maksimal yang diizinkan (${MAX_PHOTO_MB} MB). Harap kompres foto terlebih dahulu.`);
    }

    if (!isImage && file.size > MAX_DOC_MB * 1024 * 1024) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      throw new Error(`Ukuran dokumen (${sizeMB} MB) melebihi batas maksimal yang diizinkan (${MAX_DOC_MB} MB).`);
    }

    const formData = new FormData();
    formData.append('file', file);

    const headers = {};
    if (this.state.token) {
      headers['Authorization'] = `Bearer ${this.state.token}`;
    }

    this.showToast('Mengunggah berkas ke penyimpanan...', 'info');

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 429 || data.code === 'RATE_LIMIT_EXCEEDED') {
        const errorMsg = data.message || 'Anda terlalu sering mengunggah berkas. Harap login untuk melanjutkan.';
        if (typeof Swal !== 'undefined') {
          Swal.fire({
            icon: 'warning',
            title: 'Perhatian!',
            text: errorMsg,
            showCancelButton: true,
            confirmButtonText: '<i class="fas fa-sign-in-alt"></i> Masuk Akun Sekarang',
            cancelButtonText: 'Tutup',
            confirmButtonColor: '#072242',
            cancelButtonColor: '#64748b',
          }).then((result) => {
            if (result.isConfirmed) {
              App.openLoginModal();
            }
          });
        } else {
          alert(errorMsg);
          App.openLoginModal();
        }
        throw new Error(errorMsg);
      }
      throw new Error(data.message || 'Gagal mengunggah berkas.');
    }

    this.showToast('Berkas berhasil disimpan!', 'success');
    return data.data; // { url, fileId, originalName, mimeType, size, storage }
  },

  // Menampilkan toast notifikasi modern
  showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '⚠️';
    if (type === 'warning') icon = '🔔';

    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  // Render status tombol akun di Header Navbar & Mobile Drawer & Bottom Tab
  renderHeaderUserStatus() {
    const container = document.getElementById('header-auth-actions');
    const mobileAuth = document.getElementById('mobile-drawer-auth');
    const mobileTabAuthLabel = document.getElementById('mobile-tab-auth-label');

    if (this.state.user) {
      const u = this.state.user;
      const roleLabel = u.role === 'admin' ? 'Administrator' : `Alumni '${u.tahun_lulus}`;
      
      if (container) {
        container.innerHTML = `
          <div class="user-pill" id="user-profile-menu-toggle">
            <img class="user-avatar" src="${u.foto_profil || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'}" alt="${u.nama_lengkap}">
            <div class="user-name-role">
              <span class="user-display-name">${u.nama_lengkap.split(' ')[0]}</span>
              <span class="user-display-badge">${roleLabel}</span>
            </div>
            <span class="user-caret" style="font-size: 0.7rem; color: var(--navy-medium);">▼</span>
          </div>
          <div id="user-dropdown-popover" class="dropdown-menu" style="right: 0; left: auto; top: 70px;">
            ${u.role === 'admin' ? `<a href="#admin" class="dropdown-item">🛠️ Panel Admin Sekolah</a>` : ''}
            <a href="#dashboard" class="dropdown-item">👤 Dashboard Profil Saya</a>
            <a href="#tracer" class="dropdown-item">📝 Kuesioner Tracer Study</a>
            <div style="border-top: 1px solid var(--border-color); margin: 4px 0;"></div>
            <button type="button" class="dropdown-item" style="color: var(--danger-primary); width: 100%; border: none; background: transparent; cursor: pointer;" onclick="App.logout()">🚪 Keluar Akun</button>
          </div>
        `;

        const toggle = document.getElementById('user-profile-menu-toggle');
        const popover = document.getElementById('user-dropdown-popover');
        if (toggle && popover) {
          toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isShown = popover.style.display === 'flex';
            popover.style.display = isShown ? 'none' : 'flex';
          });
          document.addEventListener('click', () => {
            popover.style.display = 'none';
          });
        }
      }

      if (mobileAuth) {
        mobileAuth.innerHTML = `
          <div style="display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: var(--navy-soft); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
            <img src="${u.foto_profil || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'}" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover; border: 2px solid var(--gold-primary);">
            <div style="overflow: hidden;">
              <div style="font-weight: 700; font-size: 0.85rem; color: var(--navy-primary); white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">${u.nama_lengkap}</div>
              <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">${roleLabel}</div>
            </div>
          </div>
          ${u.role === 'admin' ? `<a href="#admin" class="mobile-nav-link" onclick="App.toggleMobileDrawer(false)"><i class="fas fa-tools"></i> Panel Admin</a>` : ''}
          <a href="#dashboard" class="mobile-nav-link" onclick="App.toggleMobileDrawer(false)"><i class="fas fa-id-badge"></i> Profil Pribadi</a>
          <button type="button" class="mobile-nav-link" style="color: var(--danger-primary); border: none; background: transparent; cursor: pointer; text-align: left; width: 100%;" onclick="App.logout(); App.toggleMobileDrawer(false);"><i class="fas fa-sign-out-alt"></i> Keluar</button>
        `;
      }

      if (mobileTabAuthLabel) {
        mobileTabAuthLabel.textContent = u.role === 'admin' ? 'Admin' : 'Profil';
      }
    } else {
      if (container) {
        container.innerHTML = `
          <button type="button" class="btn btn-outline btn-sm" onclick="App.openLoginModal()">
            <i class="fas fa-sign-in-alt"></i> Masuk
          </button>
          <button type="button" class="btn btn-primary btn-sm" onclick="App.openRegisterModal()">
            <i class="fas fa-user-plus"></i> Daftar Alumni
          </button>
        `;
      }

      if (mobileAuth) {
        mobileAuth.innerHTML = `
          <button type="button" class="btn btn-navy btn-sm" style="width: 100%; justify-content: center;" onclick="App.toggleMobileDrawer(false); App.openLoginModal();">
            <i class="fas fa-sign-in-alt"></i> Masuk Akun
          </button>
          <button type="button" class="btn btn-primary btn-sm" style="width: 100%; justify-content: center;" onclick="App.toggleMobileDrawer(false); App.openRegisterModal();">
            <i class="fas fa-user-plus"></i> Daftar Alumni Baru
          </button>
        `;
      }

      if (mobileTabAuthLabel) {
        mobileTabAuthLabel.textContent = 'Masuk';
      }
    }
  },

  // Modal Login
  openLoginModal() {
    this.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">Masuk ke Portal Alumni</h3>
        <button type="button" class="modal-close-btn" onclick="App.closeModal()">&times;</button>
      </div>
      <form id="form-login" onsubmit="App.handleLoginSubmit(event)">
        <div class="modal-body" style="display: flex; flex-direction: column; gap: 16px;">
          <div style="text-align: center; margin-bottom: 8px;">
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              Gunakan Email atau NISN yang terdaftar di SMA PGRI 2 Jombang.
            </p>
          </div>
          <div>
            <label style="display: block; font-size: 0.8125rem; font-weight: 700; margin-bottom: 6px; color: var(--navy-primary);">Email atau NISN</label>
            <input type="text" name="identifier" class="form-control" style="width: 100%;" placeholder="Contoh: alumni@gmail.com atau NISN" required>
          </div>
          <div>
            <label style="display: block; font-size: 0.8125rem; font-weight: 700; margin-bottom: 6px; color: var(--navy-primary);">Password</label>
            <input type="password" name="password" class="form-control" style="width: 100%;" placeholder="Masukkan password Anda" required>
          </div>
          <div style="font-size: 0.75rem; background: var(--navy-soft); padding: 10px; border-radius: 8px; border: 1px dashed rgba(14, 82, 127, 0.2);">
            <strong>Tips Akses Demo:</strong><br>
            • Akun Admin: <code>admin@smapgri2jombang.sch.id</code> / <code>admin123</code><br>
            • Akun Alumni: <code>rizky.pratama@gmail.com</code> / <code>alumni123</code>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline btn-sm" onclick="App.closeModal()">Batal</button>
          <button type="submit" class="btn btn-navy btn-sm" style="min-width: 120px;">Masuk Sekarang</button>
        </div>
      </form>
    `);
  },

  // Handle Login Submit
  async handleLoginSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const identifier = form.identifier.value.trim();
    const password = form.password.value;

    try {
      submitBtn.disabled = true;
      submitBtn.innerText = 'Memeriksa...';

      const res = await this.apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      });

      this.saveAuth(res.token, res.user);
      this.closeModal();
      this.showToast(res.message, 'success');

      if (res.user.role === 'admin') {
        Router.navigate('admin');
      } else {
        Router.navigate('dashboard');
      }
    } catch (err) {
      this.showToast(err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = 'Masuk Sekarang';
    }
  },

  // Modal Register
  openRegisterModal() {
    this.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">Pendaftaran Alumni SMA PGRI 2 Jombang</h3>
        <button type="button" class="modal-close-btn" onclick="App.closeModal()">&times;</button>
      </div>
      <form id="form-register" onsubmit="App.handleRegisterSubmit(event)">
        <div class="modal-body" style="display: flex; flex-direction: column; gap: 14px; max-height: 70vh; overflow-y: auto;">
          <p style="font-size: 0.8125rem; color: var(--text-muted);">
            Lengkapi data diri Anda untuk terdaftar dalam direktori resmi lulusan Grida Joe.
          </p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Nama Lengkap *</label>
              <input type="text" name="nama_lengkap" class="form-control" placeholder="Nama sesuai ijazah" required>
            </div>
            <div>
              <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">NISN *</label>
              <input type="text" name="nisn" class="form-control" placeholder="10 digit NISN" required>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Tahun Kelulusan *</label>
              <select name="tahun_lulus" class="form-select" required>
                <option value="">Pilih Angkatan...</option>
                ${Array.from({ length: 42 }, (_, i) => 2026 - i).map(thn => `<option value="${thn}">Lulusan Tahun ${thn}</option>`).join('')}
              </select>
            </div>
            <div>
              <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Jurusan *</label>
              <select name="jurusan" class="form-select" required>
                <option value="MIPA / IPA">MIPA / IPA</option>
                <option value="IPS">IPS</option>
                <option value="Bahasa & Budaya">Bahasa & Budaya</option>
                <option value="Umum">Umum</option>
              </select>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Email Aktif *</label>
              <input type="email" name="email" class="form-control" placeholder="email@domain.com" required>
            </div>
            <div>
              <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Nomor WhatsApp</label>
              <input type="text" name="no_telepon" class="form-control" placeholder="08xxxxxxxxxx">
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Aktivitas Saat Ini *</label>
              <select name="status_saat_ini" class="form-select" required>
                <option value="Melanjutkan Studi">Melanjutkan Studi (Kuliah)</option>
                <option value="Bekerja">Bekerja di Perusahaan/Instansi</option>
                <option value="Wirausaha">Wirausaha / Bisnis Mandiri</option>
                <option value="Mencari Kerja">Mencari Kerja / Fresh Graduate</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div>
              <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Nama Kampus / Kantor / Bisnis</label>
              <input type="text" name="nama_instansi_terkini" class="form-control" placeholder="Contoh: Universitas Brawijaya">
            </div>
          </div>
          <div>
            <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Foto Profil (Format JPG/PNG/WEBP, Maks. 10 MB)</label>
            <input type="file" id="register-foto-input" class="form-control" accept="image/*">
            <input type="hidden" name="foto_profil" id="register-foto-url">
            <small style="color: var(--text-muted); font-size: 0.72rem;">Format berkas gambar JPG, PNG, atau WEBP.</small>
          </div>
          <div>
            <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Password Akun *</label>
            <input type="password" name="password" class="form-control" placeholder="Minimal 6 karakter" required minlength="6">
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline btn-sm" onclick="App.closeModal()">Batal</button>
          <button type="submit" class="btn btn-primary btn-sm">Daftar Akun Alumni</button>
        </div>
      </form>
    `);
  },

  // Handle Register Submit
  async handleRegisterSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');

    const fileInput = document.getElementById('register-foto-input');
    let fotoUrl = '';

    try {
      submitBtn.disabled = true;
      submitBtn.innerText = 'Menyimpan...';

      // Jika ada file foto, upload terlebih dahulu
      if (fileInput && fileInput.files.length > 0) {
        submitBtn.innerText = 'Mengunggah foto ke bot...';
        const uploadResult = await this.uploadFile(fileInput.files[0]);
        fotoUrl = uploadResult.url;
      }

      const payload = {
        nama_lengkap: form.nama_lengkap.value,
        nisn: form.nisn.value,
        email: form.email.value,
        password: form.password.value,
        no_telepon: form.no_telepon.value,
        tahun_lulus: form.tahun_lulus.value,
        jurusan: form.jurusan.value,
        status_saat_ini: form.status_saat_ini.value,
        nama_instansi_terkini: form.nama_instansi_terkini.value,
        foto_profil: fotoUrl || undefined,
      };

      submitBtn.innerText = 'Mendaftarkan...';
      const res = await this.apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      this.saveAuth(res.token, res.user);
      this.closeModal();
      this.showToast(res.message, 'success');
      Router.navigate('dashboard');
    } catch (err) {
      this.showToast(err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = 'Daftar Akun Alumni';
    }
  },

  // Universal Modal Renderer
  openModal(htmlContent) {
    let overlay = document.getElementById('app-modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'app-modal-overlay';
      overlay.className = 'modal-overlay';
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `<div class="modal-card">${htmlContent}</div>`;
    overlay.classList.add('active');

    overlay.onclick = (e) => {
      if (e.target === overlay) {
        this.closeModal();
      }
    };
  },

  closeModal() {
    const overlay = document.getElementById('app-modal-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      overlay.innerHTML = '';
    }
  },

  // Kontrol Menu Samping Mobile (Off-Canvas Drawer)
  toggleMobileDrawer(open) {
    const overlay = document.getElementById('mobile-drawer-overlay');
    const drawer = document.getElementById('mobile-drawer');
    if (!overlay || !drawer) return;

    if (open === undefined) {
      open = !drawer.classList.contains('active');
    }

    if (open) {
      overlay.classList.add('active');
      drawer.classList.add('active');
      document.body.style.overflow = 'hidden';
    } else {
      overlay.classList.remove('active');
      drawer.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  // Setup Global Event Listeners
  setupEventListeners() {
    window.addEventListener('hashchange', () => {
      Router.handleRoute();
    });
  }
};

window.App = App;
