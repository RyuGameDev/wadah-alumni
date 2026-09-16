/**
 * ============================================================
 * TRACER STUDY SMA PGRI 2 JOMBANG - CLIENT ROUTER (router.js)
 * Single Page Application Views & Component Renderers
 * ============================================================
 */

const Router = {
  routes: {},

  init() {
    this.handleRoute();
  },

  navigate(hash) {
    window.location.hash = hash;
  },

  getHash() {
    const raw = window.location.hash.slice(1);
    const [route, ...params] = raw.split('/');
    return { route: route || 'home', params };
  },

  async handleRoute() {
    const { route, params } = this.getHash();
    App.state.activeView = route;

    // Update active nav links (Desktop)
    document.querySelectorAll('.nav-item a').forEach(link => {
      const href = link.getAttribute('href');
      if (href === `#${route}` || (route === 'home' && href === '#home')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Update active mobile bottom bar tabs
    document.querySelectorAll('.mobile-tab-item').forEach(tab => {
      const tabRoute = tab.getAttribute('data-route');
      if (tabRoute === route) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // Update active mobile drawer links
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
      const href = link.getAttribute('href');
      if (href === `#${route}` || (route === 'home' && href === '#home')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Close mobile drawer if currently open
    if (typeof App !== 'undefined' && typeof App.toggleMobileDrawer === 'function') {
      App.toggleMobileDrawer(false);
    }

    const mainContainer = document.getElementById('main-content');
    if (!mainContainer) return;

    // Tampilkan skeleton loader ringan
    mainContainer.innerHTML = `<div style="text-align: center; padding: 80px 20px;"><div style="display: inline-block; width: 40px; height: 40px; border: 4px solid var(--navy-soft); border-top-color: var(--gold-primary); border-radius: 50%; animation: spin 0.8s linear infinite;"></div><p style="margin-top: 14px; font-weight: 600; color: var(--navy-primary);">Memuat portal alumni...</p></div><style>@keyframes spin { to { transform: rotate(360deg); } }</style>`;

    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      switch (route) {
        case 'home':
          await this.renderHome(mainContainer);
          break;
        case 'alumni':
          await this.renderAlumni(mainContainer);
          break;
        case 'berita':
          await this.renderNews(mainContainer, params[0]);
          break;
        case 'donasi':
          await this.renderDonation(mainContainer, params[0]);
          break;
        case 'karir':
          await this.renderCareer(mainContainer);
          break;
        case 'forum':
          await this.renderForum(mainContainer, params[0]);
          break;
        case 'tracer':
          await this.renderTracer(mainContainer);
          break;
        case 'dashboard':
          await this.renderDashboard(mainContainer);
          break;
        case 'admin':
          await this.renderAdmin(mainContainer);
          break;
        default:
          await this.renderHome(mainContainer);
      }
    } catch (err) {
      mainContainer.innerHTML = `
        <div class="container section" style="text-align: center;">
          <h2 style="color: var(--danger-primary);">Terjadi Kesalahan</h2>
          <p style="color: var(--text-muted); margin: 12px 0 24px;">${err.message}</p>
          <button class="btn btn-navy btn-sm" onclick="Router.navigate('home')">Kembali ke Beranda</button>
        </div>
      `;
    }
  },

  // ============================================================
  // 1. BERANDA (HOME VIEW)
  // ============================================================
  async renderHome(container) {
    // Ambil data statistik, berita terbaru, donasi, galeri secara paralel
    const [statsRes, newsRes, donationRes, galleryRes] = await Promise.all([
      App.apiRequest('/api/alumni/stats/summary'),
      App.apiRequest('/api/news?limit=3'),
      App.apiRequest('/api/donations'),
      App.apiRequest('/api/gallery'),
    ]);

    const stats = statsRes.data;
    const latestNews = newsRes.data || [];
    const donationList = (donationRes.data || []).slice(0, 3);
    const galleryList = (galleryRes.data || []).slice(0, 4);

    container.innerHTML = `
      <!-- HERO SECTION -->
      <section class="hero-section">
        <div class="container">
          <div class="hero-grid">
            <div>
              <div class="hero-badge">
                <span>🎓</span> TRACER STUDY RESMI SMA PGRI 2 JOMBANG
              </div>
              <h1 class="hero-title">
                Menghubungkan Alumni, <span>Menempa Jejak Para Juara.</span>
              </h1>
              <p class="hero-desc">
                Portal resmi Tracer Study & Jejaring Alumni SMA PGRI 2 Jombang ("Grida Joe").
                Wadah terpadu pelacakan jejak alumni, jejaring lintas angkatan, bursa karir, forum diskusi, serta kontribusi nyata bagi almamater.
              </p>
              <div class="hero-actions">
                ${!App.state.user ? `
                  <button class="btn btn-primary" onclick="App.openRegisterModal()">
                    <i class="fas fa-user-plus"></i> Gabung Alumni Sekarang
                  </button>
                  <button class="btn btn-outline" style="background: rgba(255,255,255,0.12); color: #fff; border-color: rgba(255,255,255,0.25);" onclick="App.openLoginModal()">
                    <i class="fas fa-sign-in-alt"></i> Masuk Akun
                  </button>
                ` : `
                  <a href="#tracer" class="btn btn-primary">
                    <i class="fas fa-edit"></i> Isi Kuesioner Tracer Study
                  </a>
                  <a href="#dashboard" class="btn btn-outline" style="background: rgba(255,255,255,0.12); color: #fff; border-color: rgba(255,255,255,0.25);">
                    <i class="fas fa-user-circle"></i> Dashboard Saya
                  </a>
                `}
                <a href="#alumni" class="btn btn-outline" style="background: transparent; color: #fff; border-color: rgba(255,255,255,0.35);">
                  <i class="fas fa-search"></i> Cari Alumni
                </a>
              </div>
              <div class="hero-stats-strip">
                <div class="hero-stat-item">
                  <div class="hero-stat-icon"><i class="fas fa-graduation-cap"></i></div>
                  <div><strong>${stats.total_alumni}+</strong> Alumni Terdaftar</div>
                </div>
                <div class="hero-stat-item">
                  <div class="hero-stat-icon"><i class="fas fa-university"></i></div>
                  <div><strong>PTN & PTS</strong> Ternama Nasional</div>
                </div>
                <div class="hero-stat-item">
                  <div class="hero-stat-icon"><i class="fas fa-briefcase"></i></div>
                  <div><strong>Karier & Industri</strong> Lintas Sektor</div>
                </div>
              </div>
            </div>

            <div class="hero-visual">
              <div class="carousel-card" id="home-hero-carousel">
                <div class="carousel-slide active">
                  <img src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&auto=format&fit=crop&q=80" alt="Kegiatan Sekolah">
                  <div class="carousel-overlay">
                    <div class="carousel-caption-title">Pelepasan Wisuda Purnawiyata</div>
                    <div class="carousel-caption-sub">Melahirkan Generasi Juara yang Berakhlak Mulia</div>
                  </div>
                </div>
                <div class="carousel-slide">
                  <img src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80" alt="Alumni Gathering">
                  <div class="carousel-overlay">
                    <div class="carousel-caption-title">Temu Alumni & Sharing Session</div>
                    <div class="carousel-caption-sub">Sinergi Kakak Tingkat Menuntun Adik Kelas Menuju PTN</div>
                  </div>
                </div>
                <div class="carousel-slide">
                  <img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80" alt="Prestasi">
                  <div class="carousel-overlay">
                    <div class="carousel-caption-title">Prestasi Nasional & Internasional</div>
                    <div class="carousel-caption-sub">SMA PGRI 2 Jombang: Sekolahnya Para Juara</div>
                  </div>
                </div>
                <div class="carousel-dots" id="hero-carousel-dots">
                  <span class="carousel-dot active" onclick="Router.setHeroSlide(0)"></span>
                  <span class="carousel-dot" onclick="Router.setHeroSlide(1)"></span>
                  <span class="carousel-dot" onclick="Router.setHeroSlide(2)"></span>
                </div>
              </div>

              <!-- Floating Micro-Badges -->
              <div class="floating-badge floating-badge-1">
                <div class="badge-icon gold"><i class="fas fa-trophy"></i></div>
                <div class="badge-text">
                  <strong>IMPRESSIA</strong>
                  <span>Karakter Unggul Grida Joe</span>
                </div>
              </div>

              <div class="floating-badge floating-badge-2">
                <div class="badge-icon green"><i class="fas fa-shield-alt"></i></div>
                <div class="badge-text">
                  <strong>Data Terverifikasi</strong>
                  <span>Sistem Tracer Terintegrasi</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- QUICK SERVICES STRIP -->
      <div class="container quick-service-strip">
        <div class="quick-service-grid">
          <div class="quick-service-item" onclick="Router.navigate('alumni')">
            <div class="service-icon-wrap"><i class="fas fa-search"></i></div>
            <div class="service-info">
              <strong>Cari Alumni</strong>
              <p>Temukan rekan seangkatan dan jaringan alumni lintas tahun.</p>
            </div>
          </div>
          <div class="quick-service-item" onclick="Router.navigate('berita')">
            <div class="service-icon-wrap"><i class="fas fa-newspaper"></i></div>
            <div class="service-info">
              <strong>Kabar & Berita</strong>
              <p>Informasi prestasi, agenda temu kangen, dan kegiatan sekolah.</p>
            </div>
          </div>
          <div class="quick-service-item" onclick="Router.navigate('forum')">
            <div class="service-icon-wrap"><i class="fas fa-comments"></i></div>
            <div class="service-info">
              <strong>Forum Alumni</strong>
              <p>Ruang diskusi karir, info kampus, dan kolaborasi bisnis.</p>
            </div>
          </div>
          <div class="quick-service-item" onclick="Router.navigate('donasi')">
            <div class="service-icon-wrap"><i class="fas fa-hand-holding-heart"></i></div>
            <div class="service-info">
              <strong>Donasi Almamater</strong>
              <p>Wadah kepedulian beasiswa adik kelas dan sarana sekolah.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- STATISTIK JEJAK LULUSAN -->
      <section class="section">
        <div class="container">
          <div class="section-header text-center">
            <div>
              <span class="section-eyebrow">DATA REAL-TIME TRACER STUDY</span>
              <h2 class="section-title">Jejak Langkah Lulusan <span>SMA PGRI 2 Jombang</span></h2>
              <p class="section-desc">Distribusi pelacakan lulusan pada perguruan tinggi negeri/swasta, dunia industri, dan wirausaha mandiri.</p>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-card-icon"><i class="fas fa-users"></i></div>
              <div>
                <div class="stat-num">${stats.total_alumni}</div>
                <div class="stat-label">Total Alumni Terdata</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon"><i class="fas fa-user-graduate"></i></div>
              <div>
                <div class="stat-num">${stats.kuliah}</div>
                <div class="stat-label">Melanjutkan Studi (PTN/PTS)</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon"><i class="fas fa-briefcase"></i></div>
              <div>
                <div class="stat-num">${stats.bekerja}</div>
                <div class="stat-label">Bekerja di Perusahaan</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-card-icon"><i class="fas fa-chart-line"></i></div>
              <div>
                <div class="stat-num">${stats.wirausaha}</div>
                <div class="stat-label">Wirausaha / Entrepreneur</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- TENTANG ALMAMATER & NILAI IMPRESSIA -->
      <section class="section section-soft">
        <div class="container">
          <div class="about-grid">
            <div>
              <span class="section-eyebrow">TENTANG ALMAMATER KEBANGGAAN</span>
              <h2 class="section-title" style="margin-bottom: 18px;">
                SMA PGRI 2 Jombang <br><span>"Sekolahnya Para Juara"</span>
              </h2>
              <p style="color: var(--text-muted); line-height: 1.8; margin-bottom: 20px;">
                Berdiri sejak 1 Juli 1982 di pusat Kabupaten Jombang, SMA PGRI 2 Jombang (dikenal akrab dengan julukan <strong>Grida Joe</strong>) telah meluluskan ribuan putra-putri terbaik yang kini tersebar di berbagai sektor profesional, akademik, pemerintahan, dan wirausaha nasional.
              </p>
              <p style="color: var(--text-muted); line-height: 1.8; margin-bottom: 24px;">
                Dengan semangat <strong>IMPRESSIA</strong>, sekolah berkomitmen mencetak insan pembelajar yang berakhlak mulia, berprestasi tinggi, serta tangguh menghadapi tantangan masa depan.
              </p>
              <div style="display: flex; gap: 14px; flex-wrap: wrap;">
                <div style="display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 0.85rem; color: var(--navy-primary);">
                  <i class="fas fa-check-circle" style="color: var(--emerald-primary);"></i> Akreditasi A Unggul
                </div>
                <div style="display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 0.85rem; color: var(--navy-primary);">
                  <i class="fas fa-check-circle" style="color: var(--emerald-primary);"></i> Bimbingan Intensif PTN
                </div>
                <div style="display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 0.85rem; color: var(--emerald-primary);">
                  <i class="fas fa-check-circle"></i> Ekstrakurikuler Juara
                </div>
              </div>
            </div>

            <div class="impressia-box">
              <div class="impressia-header">
                <div class="impressia-logo"><i class="fas fa-award"></i></div>
                <div>
                  <div class="impressia-title">NILAI <span>IMPRESSIA</span></div>
                  <small style="color: var(--text-muted); font-weight: 600;">Budaya Karakter SMA PGRI 2 Jombang</small>
                </div>
              </div>

              <div class="impressia-list">
                <div class="impressia-item">
                  <div class="impressia-letter">I</div>
                  <div>
                    <strong>Beriman & Bertaqwa</strong>
                    <span>Fondasi spiritual yang kokoh, berakhlak mulia dalam pergaulan.</span>
                  </div>
                </div>
                <div class="impressia-item">
                  <div class="impressia-letter">M</div>
                  <div>
                    <strong>Mandiri & Tangguh</strong>
                    <span>Mampu berdiri di atas kaki sendiri dan siap menghadapi dinamika zaman.</span>
                  </div>
                </div>
                <div class="impressia-item">
                  <div class="impressia-letter">P</div>
                  <div>
                    <strong>Berprestasi</strong>
                    <span>Mencapai standar tertinggi di bidang akademik maupun non-akademik.</span>
                  </div>
                </div>
                <div class="impressia-item">
                  <div class="impressia-letter">R</div>
                  <div>
                    <strong>Berkreasi & Inovatif</strong>
                    <span>Kreativitas tanpa batas, adaptif terhadap perkembangan teknologi digital.</span>
                  </div>
                </div>
                <div class="impressia-item">
                  <div class="impressia-letter">A</div>
                  <div>
                    <strong>Akhlak Mulia</strong>
                    <span>Menjunjung tinggi etika, kesantunan, dan empati kepada sesama.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ALUR SISTEM TRACER STUDY -->
      <section class="section">
        <div class="container">
          <div class="flow-container">
            <div class="flow-header">
              <span class="ticker-badge" style="display: inline-block; margin-bottom: 12px;">ALUR SISTEM TRACER</span>
              <h3>Bagaimana Tracer Study Bekerja?</h3>
              <p>Mekanisme penelusuran lulusan yang terstruktur, aman, dan memudahkan alumni memperbarui jejak karirnya kapan saja.</p>
            </div>

            <div class="flow-grid">
              <div class="flow-step-card">
                <div class="flow-step-number">01</div>
                <strong>Pendaftaran Akun</strong>
                <span>Alumni mengisi identitas, NISN, tahun kelulusan, dan foto profil.</span>
              </div>
              <div class="flow-step-card">
                <div class="flow-step-number">02</div>
                <strong>Verifikasi Data</strong>
                <span>Administrator sekolah memastikan keabsahan data alumni terdaftar.</span>
              </div>
              <div class="flow-step-card">
                <div class="flow-step-number">03</div>
                <strong>Akun Aktif</strong>
                <span>Alumni mendapatkan akses penuh ke direktori, forum, dan info loker.</span>
              </div>
              <div class="flow-step-card">
                <div class="flow-step-number">04</div>
                <strong>Pengisian Kuesioner</strong>
                <span>Alumni memperbarui data studi lanjut, karir, dan umpan balik sekolah.</span>
              </div>
              <div class="flow-step-card">
                <div class="flow-step-number">05</div>
                <strong>Analisis & Sinergi</strong>
                <span>Data menjadi dasar pengembangan mutu kurikulum dan relasi almamater.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- KABAR & BERITA TERBARU -->
      <section class="section section-soft">
        <div class="container">
          <div class="section-header">
            <div>
              <span class="section-eyebrow">INFORMASI TERKINI</span>
              <h2 class="section-title">Kabar & Kegiatan <span>Alumni</span></h2>
              <p class="section-desc">Prestasi membanggakan, agenda temu angkatan, serta warta almamater tercinta.</p>
            </div>
            <a href="#berita" class="btn btn-outline btn-sm">Lihat Semua Berita &rarr;</a>
          </div>

          <div class="cards-grid">
            ${latestNews.map(item => `
              <div class="card-item">
                <div class="card-thumb">
                  <img src="${item.cover_image}" alt="${item.judul}">
                  <span class="card-category-badge">${item.kategori}</span>
                </div>
                <div class="card-body">
                  <div class="card-meta">
                    <span><i class="far fa-calendar-alt"></i> ${new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span><i class="far fa-eye"></i> ${item.views || 0} Pembaca</span>
                  </div>
                  <h3 class="card-title"><a href="#berita/${item.slug}">${item.judul}</a></h3>
                  <p class="card-desc">${item.ringkasan}</p>
                  <div class="card-footer-action">
                    <span style="font-size: 0.75rem; color: var(--text-muted);">${item.author}</span>
                    <a href="#berita/${item.slug}" class="card-link-more">Baca Selengkapnya &rarr;</a>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- PROGRAM DONASI ALUMNI -->
      <section class="section">
        <div class="container">
          <div class="section-header">
            <div>
              <span class="section-eyebrow">KONTRIBUSI NYATA</span>
              <h2 class="section-title">Program Donasi & <span>Kepedulian Alumni</span></h2>
              <p class="section-desc">Salurkan kepedulian Anda untuk mendukung beasiswa adik kelas dan renovasi sarana ibadah almamater.</p>
            </div>
            <a href="#donasi" class="btn btn-outline btn-sm">Lihat Semua Program &rarr;</a>
          </div>

          <div class="cards-grid">
            ${donationList.map(prog => {
              const percent = Math.min(100, Math.round((prog.terkumpul / prog.target_nominal) * 100));
              return `
                <div class="card-item">
                  <div class="card-thumb">
                    <img src="${prog.cover_image}" alt="${prog.judul}">
                    <span class="card-category-badge" style="background: var(--emerald-primary);">Program Aktif</span>
                  </div>
                  <div class="card-body">
                    <h3 class="card-title"><a href="#donasi/${prog._id}">${prog.judul}</a></h3>
                    <p class="card-desc">${prog.deskripsi.substring(0, 120)}...</p>

                    <div class="donation-progress-wrap">
                      <div class="progress-bar-bg">
                        <div class="progress-bar-fill" style="width: ${percent}%;"></div>
                      </div>
                      <div class="donation-stats">
                        <div class="donation-raised">Terkumpul <strong>Rp ${(prog.terkumpul || 0).toLocaleString('id-ID')}</strong></div>
                        <div style="font-weight: 700; color: var(--emerald-primary);">${percent}%</div>
                      </div>
                      <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">
                        Target: Rp ${prog.target_nominal.toLocaleString('id-ID')} • ${prog.donatur?.length || 0} Donatur
                      </div>
                    </div>

                    <div class="card-footer-action">
                      <button class="btn btn-primary btn-sm" style="width: 100%;" onclick="Router.openDonationModal('${prog._id}')">
                        <i class="fas fa-hand-holding-usd"></i> Beri Donasi Sekarang
                      </button>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </section>

      <!-- DOKUMENTASI GALERI FOTO -->
      <section class="section section-soft">
        <div class="container">
          <div class="section-header text-center">
            <div>
              <span class="section-eyebrow">DOKUMENTASI MEMORI</span>
              <h2 class="section-title">Galeri Dokumentasi <span>Alumni</span></h2>
              <p class="section-desc">Kilasan momen kebersamaan, nostalgia almamater, dan kegiatan komunitas alumni Grida Joe.</p>
            </div>
          </div>

          <div class="cards-grid" style="grid-template-columns: repeat(4, 1fr);">
            ${galleryList.map(gal => `
              <div class="card-item" style="cursor: pointer;" onclick="Router.openLightbox('${gal.gambar_url}', '${gal.judul}', '${gal.kategori}')">
                <div class="card-thumb" style="aspect-ratio: 1 / 1;">
                  <img src="${gal.gambar_url}" alt="${gal.judul}">
                  <span class="card-category-badge">${gal.kategori}</span>
                </div>
                <div style="padding: 14px;">
                  <strong style="display: block; font-size: 0.85rem; color: var(--navy-primary);">${gal.judul}</strong>
                  <small style="color: var(--text-muted); font-size: 0.72rem;">${gal.tanggal_kegiatan || 'Dokumentasi'}</small>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- CTA BANNER DAFTAR -->
      <section class="section" style="padding-top: 20px;">
        <div class="container">
          <div style="background: linear-gradient(135deg, var(--navy-dark) 0%, var(--navy-primary) 60%, #0d4277 100%); padding: 50px 40px; border-radius: var(--radius-lg); color: #ffffff; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 30px; box-shadow: var(--shadow-lg);">
            <div style="max-width: 650px;">
              <span class="ticker-badge" style="margin-bottom: 12px; display: inline-block;">MARI BERSINERGI</span>
              <h2 style="font-family: var(--font-heading); font-size: 2rem; font-weight: 800; margin-bottom: 10px;">
                Bangga Menjadi Bagian dari Ikatan Alumni SMA PGRI 2 Jombang!
              </h2>
              <p style="color: rgba(255,255,255,0.78); font-size: 0.95rem; line-height: 1.6;">
                Daftarkan akun alumni Anda sekarang, perbarui jejak studi & karir, serta buka pintu peluang kolaborasi tanpa batas bersama ribuan rekan seangkatan.
              </p>
            </div>
            <div>
              ${!App.state.user ? `
                <button class="btn btn-primary" style="padding: 14px 28px; font-size: 1rem;" onclick="App.openRegisterModal()">
                  <i class="fas fa-user-plus"></i> Gabung Alumni Sekarang
                </button>
              ` : `
                <a href="#tracer" class="btn btn-primary" style="padding: 14px 28px; font-size: 1rem;">
                  <i class="fas fa-clipboard-check"></i> Lengkapi Kuesioner Tracer
                </a>
              `}
            </div>
          </div>
        </div>
      </section>
    `;

    // Start auto carousel
    this.startHeroCarousel();
  },

  // Hero carousel controller
  heroSlideIndex: 0,
  heroSlideTimer: null,

  startHeroCarousel() {
    if (this.heroSlideTimer) clearInterval(this.heroSlideTimer);
    this.heroSlideTimer = setInterval(() => {
      this.heroSlideIndex = (this.heroSlideIndex + 1) % 3;
      this.setHeroSlide(this.heroSlideIndex);
    }, 5000);
  },

  setHeroSlide(index) {
    this.heroSlideIndex = index;
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.carousel-dot');
    slides.forEach((s, i) => s.classList.toggle('active', i === index));
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
  },

  // ============================================================
  // 2. CARI ALUMNI (ALUMNI DIRECTORY VIEW)
  // ============================================================
  async renderAlumni(container) {
    if (!App.state.user) {
      container.innerHTML = `
        <div class="container section">
          <div style="max-width: 680px; margin: 40px auto; background: #ffffff; border-radius: var(--radius-lg); border: 1px solid var(--border-color); box-shadow: var(--shadow-lg); padding: 48px 36px; text-align: center; position: relative; overflow: hidden;">
            <div style="position: absolute; top: 0; left: 0; right: 0; height: 5px; background: linear-gradient(90deg, var(--navy-primary), var(--gold-primary));"></div>
            
            <div style="width: 80px; height: 80px; border-radius: 50%; background: var(--gold-soft); color: var(--gold-dark); display: flex; align-items: center; justify-content: center; font-size: 2.2rem; margin: 0 auto 24px; border: 2px solid var(--border-gold); box-shadow: 0 8px 24px rgba(245, 158, 11, 0.25);">
              <i class="fas fa-user-lock"></i>
            </div>

            <span class="ticker-badge" style="display: inline-block; margin-bottom: 12px; background: rgba(239, 68, 68, 0.12); color: #b91c1c; border: 1px solid rgba(239, 68, 68, 0.25);">
              <i class="fas fa-shield-alt"></i> AKSES TERBATAS &amp; RAHASIA
            </span>

            <h2 style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 800; color: var(--navy-primary); margin-bottom: 12px;">
              Direktori Alumni Bersifat Privat
            </h2>

            <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.7; margin-bottom: 28px;">
              Informasi kontak, riwayat studi, dan karir alumni SMA PGRI 2 Jombang dilindungi demi menjaga privasi dan keamanan seluruh lulusan. Silakan <strong>masuk ke akun Anda</strong> untuk membuka direktori lengkap.
            </p>

            <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-bottom: 30px;">
              <button class="btn btn-navy" onclick="App.openLoginModal()" style="padding: 12px 26px; font-size: 0.925rem;">
                <i class="fas fa-sign-in-alt"></i> Masuk Sekarang
              </button>
              <button class="btn btn-primary" onclick="App.openRegisterModal()" style="padding: 12px 26px; font-size: 0.925rem;">
                <i class="fas fa-user-plus"></i> Pendaftaran Alumni Baru
              </button>
            </div>

            <div style="background: var(--navy-soft); border-radius: var(--radius-sm); padding: 14px 18px; font-size: 0.8rem; color: var(--navy-medium); text-align: left; border-left: 3px solid var(--gold-primary);">
              <strong>💡 Belum memiliki akun atau ingin mencoba demo?</strong><br>
              Gunakan akun demo: <code>admin@smapgri2jombang.sch.id</code> (pass: <code>admin123</code>) atau <code>rizky.pratama@gmail.com</code> (pass: <code>alumni123</code>).
            </div>
          </div>
        </div>
      `;
      return;
    }

    let alumniList = [];
    try {
      const res = await App.apiRequest('/api/alumni');
      alumniList = res.data || [];
    } catch (err) {
      if (!App.state.user || err.message.includes('Sesi') || err.message.includes('Token') || err.message.includes('Akses') || err.message.includes('otentikasi')) {
        return this.renderAlumni(container);
      }
      throw err;
    }

    container.innerHTML = `
      <div class="container section">
        <div class="section-header">
          <div>
            <span class="section-eyebrow">DIREKTORI RESMI</span>
            <h2 class="section-title">Direktori & Cari <span>Alumni</span></h2>
            <p class="section-desc">Temukan data rekan seangkatan, jurusan, kampus, maupun tempat kerja alumni SMA PGRI 2 Jombang.</p>
          </div>
          <div>
            ${!App.state.user ? `
              <button class="btn btn-primary btn-sm" onclick="App.openRegisterModal()">
                <i class="fas fa-user-plus"></i> Daftarkan Diri Anda
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="filters-card">
          <div class="filter-group">
            <input type="text" id="filter-search" class="form-control" placeholder="Cari nama, NISN, atau instansi..." style="min-width: 260px;" oninput="Router.filterAlumniList()">
            
            <select id="filter-angkatan" class="form-select" onchange="Router.filterAlumniList()">
              <option value="">Semua Angkatan</option>
              ${Array.from({ length: 42 }, (_, i) => 2026 - i).map(thn => `<option value="${thn}">Angkatan ${thn}</option>`).join('')}
            </select>

            <select id="filter-jurusan" class="form-select" onchange="Router.filterAlumniList()">
              <option value="">Semua Jurusan</option>
              <option value="MIPA / IPA">MIPA / IPA</option>
              <option value="IPS">IPS</option>
              <option value="Bahasa & Budaya">Bahasa & Budaya</option>
            </select>

            <select id="filter-status" class="form-select" onchange="Router.filterAlumniList()">
              <option value="">Semua Status</option>
              <option value="Melanjutkan Studi">Melanjutkan Studi</option>
              <option value="Bekerja">Bekerja</option>
              <option value="Wirausaha">Wirausaha</option>
              <option value="Mencari Kerja">Mencari Kerja</option>
            </select>
          </div>

          <div>
            <span id="alumni-count-badge" style="font-size: 0.8125rem; font-weight: 700; color: var(--navy-medium);">
              Menampilkan ${alumniList.length} alumni
            </span>
          </div>
        </div>

        <!-- Alumni Grid -->
        <div class="cards-grid" id="alumni-grid-container" style="grid-template-columns: repeat(4, 1fr);">
          ${this.generateAlumniCardsHtml(alumniList)}
        </div>
      </div>
    `;

    // Simpan cache alumni di memory router untuk filtering cepat
    this.cachedAlumni = alumniList;
  },

  cachedAlumni: [],

  generateAlumniCardsHtml(list) {
    if (list.length === 0) {
      return `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: #fff; border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
          <div style="font-size: 2.5rem; margin-bottom: 12px;">🔍</div>
          <h3 style="color: var(--navy-primary); margin-bottom: 6px;">Tidak Ada Alumni Ditemukan</h3>
          <p style="color: var(--text-muted); font-size: 0.875rem;">Coba sesuaikan kata kunci pencarian atau filter angkatan Anda.</p>
        </div>
      `;
    }

    return list.map(a => `
      <div class="alumni-card">
        <img class="alumni-card-avatar" src="${a.foto_profil || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'}" alt="${a.nama_lengkap}">
        <h4 class="alumni-card-name">${a.nama_lengkap}</h4>
        <div class="alumni-card-batch">Lulusan ${a.tahun_lulus} • ${a.jurusan || 'Alumni'}</div>
        
        <div class="alumni-card-status">
          <span style="font-size: 0.7rem; text-transform: uppercase; font-weight: 800; color: var(--gold-dark);">${a.status_saat_ini || 'Melanjutkan Studi'}</span><br>
          <strong>${a.nama_instansi_terkini || 'SMA PGRI 2 Jombang'}</strong>
          ${a.jabatan_atau_prodi ? `<div style="font-size: 0.72rem; color: var(--text-muted);">${a.jabatan_atau_prodi}</div>` : ''}
        </div>

        <div class="alumni-card-actions">
          <button class="btn btn-outline btn-sm" style="width: 100%;" onclick="Router.openAlumniDetailModal('${a._id}')">
            <i class="fas fa-id-card"></i> Lihat Profil
          </button>
        </div>
      </div>
    `).join('');
  },

  async filterAlumniList() {
    const q = document.getElementById('filter-search')?.value.toLowerCase().trim() || '';
    const angkatan = document.getElementById('filter-angkatan')?.value || '';
    const jurusan = document.getElementById('filter-jurusan')?.value || '';
    const status = document.getElementById('filter-status')?.value || '';

    const filtered = this.cachedAlumni.filter(a => {
      if (angkatan && String(a.tahun_lulus) !== String(angkatan)) return false;
      if (jurusan && a.jurusan !== jurusan) return false;
      if (status && a.status_saat_ini !== status) return false;
      if (q) {
        const full = `${a.nama_lengkap} ${a.nisn} ${a.nama_instansi_terkini || ''} ${a.jabatan_atau_prodi || ''}`.toLowerCase();
        if (!full.includes(q)) return false;
      }
      return true;
    });

    const container = document.getElementById('alumni-grid-container');
    const badge = document.getElementById('alumni-count-badge');
    if (container) container.innerHTML = this.generateAlumniCardsHtml(filtered);
    if (badge) badge.innerText = `Menampilkan ${filtered.length} alumni`;
  },

  async openAlumniDetailModal(id) {
    try {
      const res = await App.apiRequest(`/api/alumni/${id}`);
      const a = res.data;

      App.openModal(`
        <div class="modal-header">
          <h3 class="modal-title">Biodata Alumni</h3>
          <button type="button" class="modal-close-btn" onclick="App.closeModal()">&times;</button>
        </div>
        <div class="modal-body" style="text-align: center;">
          <img src="${a.foto_profil}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; margin: 0 auto 16px; border: 3px solid var(--gold-primary);">
          <h3 style="font-family: var(--font-heading); color: var(--navy-primary); margin-bottom: 4px;">${a.nama_lengkap}</h3>
          <span class="alumni-card-batch" style="margin-bottom: 16px;">Angkatan ${a.tahun_lulus} • Jurusan ${a.jurusan}</span>
          
          <div style="background: var(--bg-main); border-radius: var(--radius-md); padding: 18px; text-align: left; margin: 16px 0; font-size: 0.85rem; display: flex; flex-direction: column; gap: 10px;">
            <div><strong>Status Terkini:</strong> ${a.status_saat_ini}</div>
            <div><strong>Instansi / Kampus:</strong> ${a.nama_instansi_terkini || '-'}</div>
            ${a.jabatan_atau_prodi ? `<div><strong>Jabatan / Program Studi:</strong> ${a.jabatan_atau_prodi}</div>` : ''}
            ${a.alamat ? `<div><strong>Domisili:</strong> ${a.alamat}</div>` : ''}
            ${a.bio ? `<div><strong>Tentang:</strong> <em>"${a.bio}"</em></div>` : ''}
          </div>

          <div style="display: flex; justify-content: center; gap: 12px; margin-top: 10px;">
            ${a.linkedin ? `<a href="${a.linkedin}" target="_blank" class="btn btn-outline btn-sm"><i class="fab fa-linkedin"></i> LinkedIn</a>` : ''}
            ${a.instagram ? `<a href="${a.instagram}" target="_blank" class="btn btn-outline btn-sm"><i class="fab fa-instagram"></i> Instagram</a>` : ''}
            ${a.no_telepon ? `<a href="https://wa.me/${a.no_telepon.replace(/\D/g,'')}" target="_blank" class="btn btn-primary btn-sm"><i class="fab fa-whatsapp"></i> Hubungi WA</a>` : ''}
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline btn-sm" onclick="App.closeModal()">Tutup</button>
        </div>
      `);
    } catch (err) {
      App.showToast(err.message, 'error');
    }
  },

  // ============================================================
  // 3. BERITA ALUMNI (NEWS VIEW)
  // ============================================================
  async renderNews(container, slug) {
    if (slug) {
      // Tampilan Baca Berita Detail
      const res = await App.apiRequest(`/api/news/${slug}`);
      const article = res.data;

      container.innerHTML = `
        <div class="container section">
          <div style="max-width: 820px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: var(--radius-lg); border: 1px solid var(--border-color); box-shadow: var(--shadow-md);">
            <a href="#berita" class="btn btn-outline btn-sm" style="margin-bottom: 24px;">&larr; Kembali ke Daftar Berita</a>
            
            <span class="card-category-badge" style="position: static; display: inline-block; margin-bottom: 12px;">${article.kategori}</span>
            <h1 style="font-family: var(--font-heading); font-size: 2.2rem; font-weight: 800; color: var(--navy-primary); line-height: 1.25; margin-bottom: 16px;">
              ${article.judul}
            </h1>

            <div class="card-meta" style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--border-color);">
              <span><i class="far fa-user"></i> Ditulis oleh: <strong>${article.author}</strong></span>
              <span><i class="far fa-calendar-alt"></i> ${new Date(article.createdAt).toLocaleDateString('id-ID', { dateStyle: 'full' })}</span>
              <span><i class="far fa-eye"></i> ${article.views} Kali dibaca</span>
            </div>

            <div style="border-radius: var(--radius-md); overflow: hidden; margin-bottom: 28px; box-shadow: var(--shadow-sm);">
              <img src="${article.cover_image}" alt="${article.judul}" style="width: 100%; max-height: 440px; object-fit: cover;">
            </div>

            <div style="font-size: 1.05rem; line-height: 1.85; color: #1e293b; white-space: pre-line;">
              ${article.konten}
            </div>

            <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px;">
              <span style="font-size: 0.85rem; font-weight: 700; color: var(--navy-primary);">Bagikan kabar ini ke rekan alumni:</span>
              <div style="display: flex; gap: 8px;">
                <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(article.judul + ' ' + window.location.href)}" target="_blank" class="btn btn-primary btn-sm"><i class="fab fa-whatsapp"></i> WhatsApp</a>
                <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}" target="_blank" class="btn btn-outline btn-sm"><i class="fab fa-facebook"></i> Facebook</a>
              </div>
            </div>
          </div>
        </div>
      `;
      return;
    }

    // Tampilan Daftar Berita
    const res = await App.apiRequest('/api/news');
    const newsList = res.data || [];

    container.innerHTML = `
      <div class="container section">
        <div class="section-header">
          <div>
            <span class="section-eyebrow">PORTAL INFORMASI</span>
            <h2 class="section-title">Warta & Kabar <span>Alumni</span></h2>
            <p class="section-desc">Ikuti perkembangan prestasi, kegiatan temu angkatan, serta informasi terkini seputar SMA PGRI 2 Jombang.</p>
          </div>
          ${App.state.user?.role === 'admin' ? `
            <button class="btn btn-navy btn-sm" onclick="Router.openCreateNewsModal()">
              <i class="fas fa-plus-circle"></i> Tambah Berita (Admin)
            </button>
          ` : ''}
        </div>

        <div class="cards-grid">
          ${newsList.map(item => `
            <div class="card-item">
              <div class="card-thumb">
                <img src="${item.cover_image}" alt="${item.judul}">
                <span class="card-category-badge">${item.kategori}</span>
              </div>
              <div class="card-body">
                <div class="card-meta">
                  <span><i class="far fa-calendar-alt"></i> ${new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span><i class="far fa-eye"></i> ${item.views} views</span>
                </div>
                <h3 class="card-title"><a href="#berita/${item.slug}">${item.judul}</a></h3>
                <p class="card-desc">${item.ringkasan}</p>
                <div class="card-footer-action">
                  <span style="font-size: 0.75rem; color: var(--text-muted);">${item.author}</span>
                  <a href="#berita/${item.slug}" class="card-link-more">Baca Berita &rarr;</a>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  openCreateNewsModal() {
    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">Tulis Berita Baru</h3>
        <button type="button" class="modal-close-btn" onclick="App.closeModal()">&times;</button>
      </div>
      <form onsubmit="Router.handleCreateNewsSubmit(event)">
        <div class="modal-body" style="display: flex; flex-direction: column; gap: 14px; max-height: 70vh; overflow-y: auto;">
          <div>
            <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Judul Berita *</label>
            <input type="text" name="judul" class="form-control" required placeholder="Judul artikel berita">
          </div>
          <div>
            <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Kategori *</label>
            <select name="kategori" class="form-select" required>
              <option value="Prestasi Alumni">Prestasi Alumni</option>
              <option value="Reuni & Temu Kangen">Reuni & Temu Kangen</option>
              <option value="Kegiatan Sekolah">Kegiatan Sekolah</option>
              <option value="Info Akademik & Kampus">Info Akademik & Kampus</option>
              <option value="Kabar Sosial & Komunitas">Kabar Sosial & Komunitas</option>
              <option value="Umum">Umum</option>
            </select>
          </div>
          <div>
            <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Cover Foto (Maks 10MB - Sesuai Limit Telegram Bot)</label>
            <input type="file" id="news-cover-input" class="form-control" accept="image/*">
            <input type="hidden" name="cover_image">
          </div>
          <div>
            <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Ringkasan Pendek *</label>
            <textarea name="ringkasan" class="form-control" rows="2" required placeholder="Ringkasan 1-2 kalimat untuk preview"></textarea>
          </div>
          <div>
            <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Isi Konten Berita Lengkap *</label>
            <textarea name="konten" class="form-control" rows="6" required placeholder="Tuliskan berita lengkap..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline btn-sm" onclick="App.closeModal()">Batal</button>
          <button type="submit" class="btn btn-navy btn-sm">Publikasikan Berita</button>
        </div>
      </form>
    `);
  },

  async handleCreateNewsSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const fileInput = document.getElementById('news-cover-input');
    const submitBtn = form.querySelector('button[type="submit"]');

    try {
      submitBtn.disabled = true;
      submitBtn.innerText = 'Mengunggah & Menyimpan...';

      let coverUrl = '';
      let telegramFileId = '';

      if (fileInput && fileInput.files.length > 0) {
        const uploadResult = await App.uploadFile(fileInput.files[0]);
        coverUrl = uploadResult.url;
        telegramFileId = uploadResult.fileId || '';
      }

      await App.apiRequest('/api/news', {
        method: 'POST',
        body: JSON.stringify({
          judul: form.judul.value,
          kategori: form.kategori.value,
          ringkasan: form.ringkasan.value,
          konten: form.konten.value,
          cover_image: coverUrl || undefined,
          telegram_file_id: telegramFileId || undefined,
        }),
      });

      App.closeModal();
      App.showToast('Berita berhasil dipublikasikan!', 'success');
      this.handleRoute();
    } catch (err) {
      App.showToast(err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = 'Publikasikan Berita';
    }
  },

  // ============================================================
  // 4. PROGRAM DONASI ALUMNI (DONATION VIEW)
  // ============================================================
  async renderDonation(container, id) {
    const res = await App.apiRequest('/api/donations');
    const donations = res.data || [];

    container.innerHTML = `
      <div class="container section">
        <div class="section-header">
          <div>
            <span class="section-eyebrow">PROGRAM KEPEDULIAN ALAMATER</span>
            <h2 class="section-title">Wadah Donasi & Kontribusi <span>Alumni</span></h2>
            <p class="section-desc">Satu langkah kecil kepedulian Anda menghadirkan masa depan yang jauh lebih cerah bagi generasi penerus SMA PGRI 2 Jombang.</p>
          </div>
        </div>

        <div class="cards-grid">
          ${donations.map(prog => {
            const percent = Math.min(100, Math.round((prog.terkumpul / prog.target_nominal) * 100));
            return `
              <div class="card-item">
                <div class="card-thumb">
                  <img src="${prog.cover_image}" alt="${prog.judul}">
                  <span class="card-category-badge" style="background: var(--emerald-primary);">Program Donasi</span>
                </div>
                <div class="card-body">
                  <h3 class="card-title">${prog.judul}</h3>
                  <p class="card-desc">${prog.deskripsi}</p>

                  <div class="donation-progress-wrap">
                    <div class="progress-bar-bg">
                      <div class="progress-bar-fill" style="width: ${percent}%;"></div>
                    </div>
                    <div class="donation-stats">
                      <div class="donation-raised">Terkumpul <strong>Rp ${(prog.terkumpul || 0).toLocaleString('id-ID')}</strong></div>
                      <div style="font-weight: 700; color: var(--emerald-primary);">${percent}%</div>
                    </div>
                    <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">
                      Target: Rp ${prog.target_nominal.toLocaleString('id-ID')} • ${prog.donatur?.length || 0} Donatur
                    </div>
                  </div>

                  <div style="background: var(--navy-soft); padding: 12px; border-radius: var(--radius-sm); margin-bottom: 16px; font-size: 0.75rem;">
                    <strong>Rekening Transfer:</strong><br>
                    ${prog.rekening_tujuan?.bank || 'Bank Jatim'} - <code>${prog.rekening_tujuan?.nomor_rekening || '011-2053-9726'}</code><br>
                    a.n. ${prog.rekening_tujuan?.atas_nama || 'Ikatan Alumni SMA PGRI 2 Jombang'}
                  </div>

                  <div class="card-footer-action">
                    <button class="btn btn-primary btn-sm" style="width: 100%;" onclick="Router.openDonationModal('${prog._id}')">
                      <i class="fas fa-hand-holding-usd"></i> Kirim Donasi Sekarang
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  openDonationModal(id) {
    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">Konfirmasi Donasi Alumni</h3>
        <button type="button" class="modal-close-btn" onclick="App.closeModal()">&times;</button>
      </div>
      <form onsubmit="Router.handleDonationSubmit(event, '${id}')">
        <div class="modal-body" style="display: flex; flex-direction: column; gap: 14px; max-height: 70vh; overflow-y: auto;">
          <div style="background: var(--navy-soft); padding: 14px; border-radius: var(--radius-md); font-size: 0.8125rem;">
            <strong>Rekening Resmi Ikatan Alumni:</strong><br>
            Bank Jatim / BSI : <code>011-2053-9726</code><br>
            a.n. Ikatan Alumni SMA PGRI 2 Jombang
          </div>
          <div>
            <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Nama Donatur *</label>
            <input type="text" name="nama" class="form-control" value="${App.state.user?.nama_lengkap || ''}" placeholder="Nama Anda atau kosongkan untuk Hamba Allah">
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Angkatan / Status</label>
              <input type="text" name="angkatan" class="form-control" value="${App.state.user ? `Alumni ${App.state.user.tahun_lulus}` : ''}" placeholder="Contoh: Alumni 2018">
            </div>
            <div>
              <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Nominal Donasi (Rp) *</label>
              <input type="number" name="nominal" class="form-control" placeholder="Minimal Rp 10.000" min="10000" required>
            </div>
          </div>
          <div>
            <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Pesan & Doa Kebaikan</label>
            <textarea name="pesan_doa" class="form-control" rows="2" placeholder="Tuliskan doa atau pesan untuk almamater dan adik kelas..."></textarea>
          </div>
          <div>
            <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Bukti Transfer (Maks. 20MB - Disimpan via Telegram Bot)</label>
            <input type="file" id="donation-proof-input" class="form-control" accept="image/*,application/pdf">
            <small style="color: var(--text-muted); font-size: 0.72rem;">Dapat berupa tangkapan layar (screenshot) transfer atau PDF mutasi.</small>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline btn-sm" onclick="App.closeModal()">Batal</button>
          <button type="submit" class="btn btn-primary btn-sm">Kirim Konfirmasi Donasi</button>
        </div>
      </form>
    `);
  },

  async handleDonationSubmit(e, id) {
    e.preventDefault();
    const form = e.target;
    const fileInput = document.getElementById('donation-proof-input');
    const submitBtn = form.querySelector('button[type="submit"]');

    try {
      submitBtn.disabled = true;
      submitBtn.innerText = 'Memproses...';

      let proofUrl = '';
      let telegramFileId = '';

      if (fileInput && fileInput.files.length > 0) {
        submitBtn.innerText = 'Mengunggah bukti transfer ke bot...';
        const uploadResult = await App.uploadFile(fileInput.files[0]);
        proofUrl = uploadResult.url;
        telegramFileId = uploadResult.fileId || '';
      }

      await App.apiRequest(`/api/donations/${id}/donate`, {
        method: 'POST',
        body: JSON.stringify({
          nama: form.nama.value,
          angkatan: form.angkatan.value,
          nominal: form.nominal.value,
          pesan_doa: form.pesan_doa.value,
          bukti_transfer: proofUrl || undefined,
          telegram_file_id: telegramFileId || undefined,
        }),
      });

      App.closeModal();
      App.showToast('Donasi Anda berhasil dicatat! Terima kasih atas kontribusi terbaik Anda.', 'success');
      this.handleRoute();
    } catch (err) {
      App.showToast(err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = 'Kirim Konfirmasi Donasi';
    }
  },

  // ============================================================
  // 5. LOWONGAN KERJA / KARIR (CAREER VIEW)
  // ============================================================
  async renderCareer(container) {
    const res = await App.apiRequest('/api/careers');
    const careerList = res.data || [];

    container.innerHTML = `
      <div class="container section">
        <div class="section-header">
          <div>
            <span class="section-eyebrow">BURSA KERJA ALUMNI</span>
            <h2 class="section-title">Peluang Karir & <span>Lowongan Kerja</span></h2>
            <p class="section-desc">Peluang kerja dan magang yang dibagikan secara khusus oleh alumni maupun jaringan mitra SMA PGRI 2 Jombang.</p>
          </div>
          <div>
            ${App.state.user ? `
              <button class="btn btn-primary btn-sm" onclick="Router.openPostCareerModal()">
                <i class="fas fa-plus-circle"></i> Bagikan Info Loker
              </button>
            ` : `
              <button class="btn btn-outline btn-sm" onclick="App.openLoginModal()">
                <i class="fas fa-sign-in-alt"></i> Masuk untuk Pasang Loker
              </button>
            `}
          </div>
        </div>

        <div class="cards-grid">
          ${careerList.map(item => `
            <div class="card-item">
              <div style="padding: 24px 24px 0; display: flex; align-items: center; gap: 14px;">
                <img src="${item.logo_perusahaan}" style="width: 50px; height: 50px; border-radius: 12px; object-fit: cover; border: 1px solid var(--border-color);">
                <div>
                  <h3 style="font-family: var(--font-heading); font-size: 1.15rem; font-weight: 700; color: var(--navy-primary); margin-bottom: 2px;">${item.posisi}</h3>
                  <div style="font-size: 0.8125rem; font-weight: 600; color: var(--text-muted);">${item.perusahaan}</div>
                </div>
              </div>

              <div class="card-body">
                <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px;">
                  <span class="alumni-card-batch" style="margin: 0; background: var(--navy-soft);">${item.tipe_pekerjaan}</span>
                  <span class="alumni-card-batch" style="margin: 0; background: var(--gold-soft); color: var(--gold-dark);"><i class="fas fa-map-marker-alt"></i> ${item.lokasi}</span>
                </div>

                <div style="font-size: 0.8125rem; font-weight: 700; color: var(--emerald-primary); margin-bottom: 12px;">
                  Gaji: ${item.rentang_gaji}
                </div>

                <p class="card-desc" style="font-size: 0.8125rem;">${item.deskripsi.substring(0, 130)}...</p>

                <div style="background: var(--bg-main); padding: 10px 14px; border-radius: var(--radius-sm); font-size: 0.75rem; margin-bottom: 16px;">
                  <strong>Kontak / Cara Melamar:</strong><br>
                  <code>${item.kontak_lamaran}</code>
                </div>

                <div class="card-footer-action">
                  <small style="color: var(--text-muted); font-size: 0.72rem;">Diposting oleh: ${item.diposting_oleh}</small>
                  <button class="btn btn-navy btn-sm" onclick="Router.openCareerDetailModal('${item._id}')">Detail Lowongan</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  openPostCareerModal() {
    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">Pasang Lowongan Kerja</h3>
        <button type="button" class="modal-close-btn" onclick="App.closeModal()">&times;</button>
      </div>
      <form onsubmit="Router.handlePostCareerSubmit(event)">
        <div class="modal-body" style="display: flex; flex-direction: column; gap: 14px; max-height: 70vh; overflow-y: auto;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Posisi / Jabatan *</label>
              <input type="text" name="posisi" class="form-control" required placeholder="Contoh: Staff Keuangan">
            </div>
            <div>
              <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Nama Perusahaan *</label>
              <input type="text" name="perusahaan" class="form-control" required placeholder="PT / CV / Lembaga">
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div>
              <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Lokasi Penempatan *</label>
              <input type="text" name="lokasi" class="form-control" required placeholder="Jombang, Surabaya, Remote, dll">
            </div>
            <div>
              <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Tipe Pekerjaan *</label>
              <select name="tipe_pekerjaan" class="form-select" required>
                <option value="Penuh Waktu (Full Time)">Penuh Waktu (Full Time)</option>
                <option value="Paruh Waktu (Part Time)">Paruh Waktu (Part Time)</option>
                <option value="Magang (Internship)">Magang (Internship)</option>
                <option value="Pekerja Lepas (Freelance)">Pekerja Lepas (Freelance)</option>
                <option value="BUMN / Instansi Pemerintah">BUMN / Instansi Pemerintah</option>
              </select>
            </div>
          </div>
          <div>
            <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Estimasi Rentang Gaji</label>
            <input type="text" name="rentang_gaji" class="form-control" placeholder="Contoh: Rp 3.500.000 - Rp 5.000.000">
          </div>
          <div>
            <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Deskripsi Pekerjaan *</label>
            <textarea name="deskripsi" class="form-control" rows="3" required placeholder="Tugas utama dan tanggung jawab..."></textarea>
          </div>
          <div>
            <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Kualifikasi & Persyaratan *</label>
            <textarea name="kualifikasi" class="form-control" rows="3" required placeholder="Pendidikan minimal, keahlian yang dibutuhkan..."></textarea>
          </div>
          <div>
            <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Kontak Lamaran / Email / Link *</label>
            <input type="text" name="kontak_lamaran" class="form-control" required placeholder="Email hrd@perusahaan.com atau Link formulir">
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline btn-sm" onclick="App.closeModal()">Batal</button>
          <button type="submit" class="btn btn-primary btn-sm">Publikasikan Lowongan</button>
        </div>
      </form>
    `);
  },

  async handlePostCareerSubmit(e) {
    e.preventDefault();
    const form = e.target;
    try {
      await App.apiRequest('/api/careers', {
        method: 'POST',
        body: JSON.stringify({
          posisi: form.posisi.value,
          perusahaan: form.perusahaan.value,
          lokasi: form.lokasi.value,
          tipe_pekerjaan: form.tipe_pekerjaan.value,
          rentang_gaji: form.rentang_gaji.value,
          deskripsi: form.deskripsi.value,
          kualifikasi: form.kualifikasi.value,
          kontak_lamaran: form.kontak_lamaran.value,
        }),
      });

      App.closeModal();
      App.showToast('Lowongan kerja berhasil dipublikasikan!', 'success');
      this.handleRoute();
    } catch (err) {
      App.showToast(err.message, 'error');
    }
  },

  async openCareerDetailModal(id) {
    try {
      const res = await App.apiRequest(`/api/careers/${id}`);
      const c = res.data;

      App.openModal(`
        <div class="modal-header">
          <h3 class="modal-title">Detail Lowongan Pekerjaan</h3>
          <button type="button" class="modal-close-btn" onclick="App.closeModal()">&times;</button>
        </div>
        <div class="modal-body" style="display: flex; flex-direction: column; gap: 14px; max-height: 70vh; overflow-y: auto;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <img src="${c.logo_perusahaan}" style="width: 60px; height: 60px; border-radius: 12px; object-fit: cover;">
            <div>
              <h3 style="font-family: var(--font-heading); color: var(--navy-primary); font-size: 1.3rem;">${c.posisi}</h3>
              <div style="font-weight: 700; color: var(--text-muted);">${c.perusahaan} • ${c.lokasi}</div>
              <span class="alumni-card-batch" style="margin-top: 6px;">${c.tipe_pekerjaan} • ${c.rentang_gaji}</span>
            </div>
          </div>

          <div style="margin-top: 10px;">
            <h4 style="font-size: 0.95rem; color: var(--navy-primary); margin-bottom: 6px;">Deskripsi Tugas:</h4>
            <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.7; white-space: pre-line;">${c.deskripsi}</p>
          </div>

          <div>
            <h4 style="font-size: 0.95rem; color: var(--navy-primary); margin-bottom: 6px;">Kualifikasi:</h4>
            <p style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.7; white-space: pre-line;">${c.kualifikasi}</p>
          </div>

          <div style="background: var(--navy-soft); padding: 14px; border-radius: var(--radius-md); font-size: 0.85rem;">
            <strong>Kirimkan Lamaran / Hubungi:</strong><br>
            <span style="font-weight: 700; color: var(--navy-primary);">${c.kontak_lamaran}</span>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline btn-sm" onclick="App.closeModal()">Tutup</button>
        </div>
      `);
    } catch (err) {
      App.showToast(err.message, 'error');
    }
  },

  // ============================================================
  // 6. FORUM DISKUSI ALUMNI (FORUM VIEW)
  // ============================================================
  async renderForum(container, threadId) {
    if (threadId) {
      // Thread detail & comment replies
      const res = await App.apiRequest(`/api/forum/${threadId}`);
      const t = res.data;

      container.innerHTML = `
        <div class="container section">
          <div style="max-width: 820px; margin: 0 auto;">
            <a href="#forum" class="btn btn-outline btn-sm" style="margin-bottom: 20px;">&larr; Kembali ke Forum</a>
            
            <div style="background: #ffffff; padding: 32px; border-radius: var(--radius-lg); border: 1px solid var(--border-color); box-shadow: var(--shadow-md); margin-bottom: 24px;">
              <span class="alumni-card-batch" style="margin-bottom: 10px;">${t.kategori}</span>
              <h1 style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 800; color: var(--navy-primary); margin-bottom: 14px;">
                ${t.judul}
              </h1>

              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                <img src="${t.author_foto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
                <div>
                  <strong style="display: block; font-size: 0.875rem; color: var(--navy-primary);">${t.author_nama}</strong>
                  <span style="font-size: 0.72rem; color: var(--text-muted);">${t.author_angkatan} • ${new Date(t.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</span>
                </div>
              </div>

              <div style="font-size: 0.95rem; line-height: 1.8; color: #1e293b; white-space: pre-line; margin-bottom: 20px;">
                ${t.konten}
              </div>

              ${t.lampiran_gambar ? `
                <div style="border-radius: var(--radius-md); overflow: hidden; margin-bottom: 20px;">
                  <img src="${t.lampiran_gambar}" alt="Lampiran" style="max-height: 400px; width: 100%; object-fit: cover;">
                </div>
              ` : ''}

              <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 16px;">
                <button class="btn btn-outline btn-sm" onclick="Router.handleUpvote('${t._id}')">
                  👍 Apresiasi Topik (${t.upvotes_count || 0})
                </button>
                <span style="font-size: 0.8rem; color: var(--text-muted);">${t.komentar?.length || 0} Balasan Komentar</span>
              </div>
            </div>

            <!-- Balasan Komentar -->
            <div style="background: #ffffff; padding: 28px; border-radius: var(--radius-lg); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
              <h3 style="font-family: var(--font-heading); font-size: 1.2rem; color: var(--navy-primary); margin-bottom: 20px;">
                Diskusi & Tanggapan (${t.komentar?.length || 0})
              </h3>

              <div style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 28px;">
                ${(t.komentar || []).map(c => `
                  <div style="display: flex; gap: 14px; background: var(--bg-main); padding: 16px; border-radius: var(--radius-md);">
                    <img src="${c.author_foto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'}" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover; flex-shrink: 0;">
                    <div style="flex: 1;">
                      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                        <strong style="font-size: 0.85rem; color: var(--navy-primary);">${c.author_nama} <small style="font-weight: 500; color: var(--text-muted);">(${c.author_angkatan})</small></strong>
                        <small style="color: var(--text-light); font-size: 0.7rem;">${new Date(c.tanggal).toLocaleDateString('id-ID')}</small>
                      </div>
                      <p style="font-size: 0.85rem; color: var(--text-main); line-height: 1.6;">${c.konten}</p>
                    </div>
                  </div>
                `).join('')}
              </div>

              <!-- Form Kirim Komentar -->
              ${App.state.user ? `
                <form onsubmit="Router.handleCommentSubmit(event, '${t._id}')">
                  <div style="margin-bottom: 12px;">
                    <label style="display: block; font-size: 0.8125rem; font-weight: 700; margin-bottom: 6px; color: var(--navy-primary);">Tuliskan Tanggapan Anda:</label>
                    <textarea name="konten" class="form-control" rows="3" required placeholder="Bagikan tanggapan, info, atau solusi Anda..."></textarea>
                  </div>
                  <button type="submit" class="btn btn-navy btn-sm"><i class="fas fa-paper-plane"></i> Kirim Tanggapan</button>
                </form>
              ` : `
                <div style="text-align: center; padding: 20px; background: var(--navy-soft); border-radius: var(--radius-md);">
                  <p style="font-size: 0.85rem; margin-bottom: 10px;">Silakan masuk untuk berpartisipasi dalam diskusi ini.</p>
                  <button class="btn btn-navy btn-sm" onclick="App.openLoginModal()">Masuk Sekarang</button>
                </div>
              `}
            </div>
          </div>
        </div>
      `;
      return;
    }

    // Forum Topics List
    const res = await App.apiRequest('/api/forum');
    const topics = res.data || [];

    container.innerHTML = `
      <div class="container section">
        <div class="section-header">
          <div>
            <span class="section-eyebrow">RUANG KOLABORASI</span>
            <h2 class="section-title">Forum Komunikasi & <span>Diskusi Alumni</span></h2>
            <p class="section-desc">Berbagi informasi kampus, lowongan, pengalaman kerja, hingga nostalgia bersama sesama alumni Grida Joe.</p>
          </div>
          <div>
            ${App.state.user ? `
              <button class="btn btn-primary btn-sm" onclick="Router.openCreateTopicModal()">
                <i class="fas fa-edit"></i> Buat Topik Baru
              </button>
            ` : `
              <button class="btn btn-outline btn-sm" onclick="App.openLoginModal()">
                <i class="fas fa-sign-in-alt"></i> Masuk untuk Buat Topik
              </button>
            `}
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 16px;">
          ${topics.map(t => `
            <div class="card-item" style="padding: 24px; display: flex; flex-direction: row; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap;">
              <div style="flex: 1; min-width: 280px;">
                <span class="alumni-card-batch" style="margin-bottom: 8px;">${t.kategori}</span>
                <h3 style="font-family: var(--font-heading); font-size: 1.2rem; margin-bottom: 6px;">
                  <a href="#forum/${t._id}" style="color: var(--navy-primary);">${t.judul}</a>
                </h3>
                <p style="font-size: 0.825rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 10px;">
                  ${t.konten.substring(0, 160)}...
                </p>
                <div style="display: flex; align-items: center; gap: 12px; font-size: 0.75rem; color: var(--text-muted);">
                  <span><i class="far fa-user"></i> ${t.author_nama} (${t.author_angkatan})</span>
                  <span><i class="far fa-calendar"></i> ${new Date(t.createdAt).toLocaleDateString('id-ID')}</span>
                </div>
              </div>

              <div style="display: flex; align-items: center; gap: 14px;">
                <div style="text-align: center; background: var(--bg-main); padding: 8px 16px; border-radius: var(--radius-sm);">
                  <strong style="font-size: 1.1rem; color: var(--navy-primary);">${t.komentar?.length || 0}</strong>
                  <div style="font-size: 0.7rem; color: var(--text-muted);">Balasan</div>
                </div>
                <div style="text-align: center; background: var(--gold-soft); padding: 8px 16px; border-radius: var(--radius-sm);">
                  <strong style="font-size: 1.1rem; color: var(--gold-dark);">${t.upvotes_count || 0}</strong>
                  <div style="font-size: 0.7rem; color: var(--gold-dark);">Apresiasi</div>
                </div>
                <a href="#forum/${t._id}" class="btn btn-outline btn-sm">Lihat Diskusi &rarr;</a>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  openCreateTopicModal() {
    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">Mulai Topik Diskusi Baru</h3>
        <button type="button" class="modal-close-btn" onclick="App.closeModal()">&times;</button>
      </div>
      <form onsubmit="Router.handleCreateTopicSubmit(event)">
        <div class="modal-body" style="display: flex; flex-direction: column; gap: 14px; max-height: 70vh; overflow-y: auto;">
          <div>
            <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Judul Topik *</label>
            <input type="text" name="judul" class="form-control" required placeholder="Judul ringkas & menarik">
          </div>
          <div>
            <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Kategori *</label>
            <select name="kategori" class="form-select" required>
              <option value="Diskusi Umum">Diskusi Umum</option>
              <option value="Sharing Karir & Dunia Kerja">Sharing Karir & Dunia Kerja</option>
              <option value="Info Kampus & Perkuliahan">Info Kampus & Perkuliahan</option>
              <option value="Peluang Bisnis & Wirausaha">Peluang Bisnis & Wirausaha</option>
              <option value="Nostalgia & Info Reuni">Nostalgia & Info Reuni</option>
            </select>
          </div>
          <div>
            <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Lampiran Gambar (Opsional, Maks 10MB via Telegram)</label>
            <input type="file" id="forum-image-input" class="form-control" accept="image/*">
          </div>
          <div>
            <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Isi Topik Diskusi *</label>
            <textarea name="konten" class="form-control" rows="6" required placeholder="Tuliskan ide, pertanyaan, atau pembahasan yang ingin Anda diskusikan bersama alumni..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline btn-sm" onclick="App.closeModal()">Batal</button>
          <button type="submit" class="btn btn-primary btn-sm">Posting Topik</button>
        </div>
      </form>
    `);
  },

  async handleCreateTopicSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const fileInput = document.getElementById('forum-image-input');
    const submitBtn = form.querySelector('button[type="submit"]');

    try {
      submitBtn.disabled = true;
      submitBtn.innerText = 'Mengunggah & Menyimpan...';

      let imageUrl = '';
      let telegramFileId = '';

      if (fileInput && fileInput.files.length > 0) {
        const uploadRes = await App.uploadFile(fileInput.files[0]);
        imageUrl = uploadRes.url;
        telegramFileId = uploadRes.fileId || '';
      }

      await App.apiRequest('/api/forum', {
        method: 'POST',
        body: JSON.stringify({
          judul: form.judul.value,
          kategori: form.kategori.value,
          konten: form.konten.value,
          lampiran_gambar: imageUrl || undefined,
          telegram_file_id: telegramFileId || undefined,
        }),
      });

      App.closeModal();
      App.showToast('Topik diskusi berhasil dipublikasikan!', 'success');
      this.handleRoute();
    } catch (err) {
      App.showToast(err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = 'Posting Topik';
    }
  },

  async handleCommentSubmit(e, threadId) {
    e.preventDefault();
    const form = e.target;
    try {
      await App.apiRequest(`/api/forum/${threadId}/comment`, {
        method: 'POST',
        body: JSON.stringify({ konten: form.konten.value }),
      });
      App.showToast('Tanggapan berhasil dikirim!', 'success');
      this.handleRoute();
    } catch (err) {
      App.showToast(err.message, 'error');
    }
  },

  async handleUpvote(threadId) {
    if (!App.state.user) {
      App.openLoginModal();
      return;
    }
    try {
      await App.apiRequest(`/api/forum/${threadId}/upvote`, { method: 'POST' });
      App.showToast('Apresiasi berhasil diberikan!', 'success');
      this.handleRoute();
    } catch (err) {
      App.showToast(err.message, 'error');
    }
  },

  // ============================================================
  // 7. FORMULIR TRACER STUDY LENGKAP
  // ============================================================
  async renderTracer(container) {
    if (!App.state.user) {
      container.innerHTML = `
        <div class="container section" style="text-align: center; max-width: 600px; margin: 0 auto;">
          <div style="font-size: 3rem; margin-bottom: 16px;">📝</div>
          <h2 style="font-family: var(--font-heading); color: var(--navy-primary); margin-bottom: 8px;">Kuesioner Tracer Study Alumni</h2>
          <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 24px;">
            Silakan masuk atau daftarkan akun alumni Anda terlebih dahulu untuk mengisi formulir pelacakan jejak alumni SMA PGRI 2 Jombang.
          </p>
          <button class="btn btn-primary" onclick="App.openLoginModal()"><i class="fas fa-sign-in-alt"></i> Masuk Akun</button>
        </div>
      `;
      return;
    }

    // Ambil data tracer existing jika ada
    const res = await App.apiRequest('/api/alumni/tracer/me');
    const existing = res.data || {};

    const status = existing.status_saat_ini || App.state.user.status_saat_ini || 'Melanjutkan Studi';
    const kuliah = existing.data_kuliah || {};
    const kerja = existing.data_kerja || {};
    const usaha = existing.data_wirausaha || {};
    const umpan = existing.umpan_balik || {};

    container.innerHTML = `
      <div class="container section">
        <div style="max-width: 820px; margin: 0 auto; background: #ffffff; padding: 40px; border-radius: var(--radius-lg); border: 1px solid var(--border-color); box-shadow: var(--shadow-md);">
          <div style="text-align: center; margin-bottom: 32px;">
            <span class="section-eyebrow">FORMULIR RESMI TRACER STUDY</span>
            <h2 style="font-family: var(--font-heading); font-size: 2rem; color: var(--navy-primary); font-weight: 800; margin-bottom: 8px;">
              Pelacakan Jejak Kelulusan Alumni
            </h2>
            <p style="color: var(--text-muted); font-size: 0.875rem;">
              Data Anda sangat berharga bagi peningkatan mutu pendidikan, akreditasi, dan keselarasan kurikulum SMA PGRI 2 Jombang.
            </p>
          </div>

          <form id="tracer-form" onsubmit="Router.handleTracerSubmit(event)">
            <!-- 1. IDENTITAS -->
            <div style="background: var(--bg-main); padding: 18px; border-radius: var(--radius-md); margin-bottom: 24px;">
              <h4 style="font-size: 0.95rem; color: var(--navy-primary); margin-bottom: 12px; font-weight: 700;">1. Identitas Alumni</h4>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.85rem;">
                <div><strong>Nama:</strong> ${App.state.user.nama_lengkap}</div>
                <div><strong>NISN:</strong> ${App.state.user.nisn}</div>
                <div><strong>Tahun Lulus:</strong> ${App.state.user.tahun_lulus}</div>
                <div><strong>Jurusan:</strong> ${App.state.user.jurusan}</div>
              </div>
            </div>

            <!-- 2. STATUS AKTIVITAS -->
            <div style="margin-bottom: 24px;">
              <h4 style="font-size: 0.95rem; color: var(--navy-primary); margin-bottom: 8px; font-weight: 700;">2. Aktivitas Utama Saat Ini *</h4>
              <select name="status_saat_ini" id="tracer-status-select" class="form-select" style="width: 100%;" onchange="Router.toggleTracerSections(this.value)" required>
                <option value="Melanjutkan Studi" ${status === 'Melanjutkan Studi' ? 'selected' : ''}>Melanjutkan Studi (Kuliah / Perguruan Tinggi)</option>
                <option value="Bekerja" ${status === 'Bekerja' ? 'selected' : ''}>Bekerja di Perusahaan / Instansi</option>
                <option value="Wirausaha" ${status === 'Wirausaha' ? 'selected' : ''}>Wirausaha / Membuka Usaha Mandiri</option>
                <option value="Mencari Kerja" ${status === 'Mencari Kerja' ? 'selected' : ''}>Sedang Mencari Kerja / Persiapan</option>
                <option value="Lainnya" ${status === 'Lainnya' ? 'selected' : ''}>Lainnya</option>
              </select>
            </div>

            <!-- 2A. SECTION KULIAH -->
            <div id="tracer-section-kuliah" style="margin-bottom: 24px; padding: 20px; border: 1px solid var(--border-color); border-radius: var(--radius-md); ${status === 'Melanjutkan Studi' ? '' : 'display: none;'}">
              <h4 style="font-size: 0.95rem; color: var(--navy-primary); margin-bottom: 14px; font-weight: 700;">Detail Perguruan Tinggi</h4>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                <div>
                  <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Nama Perguruan Tinggi / Universitas</label>
                  <input type="text" name="kuliah_ptn" class="form-control" value="${kuliah.perguruan_tinggi || ''}" placeholder="Contoh: Universitas Brawijaya">
                </div>
                <div>
                  <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Fakultas</label>
                  <input type="text" name="kuliah_fakultas" class="form-control" value="${kuliah.fakultas || ''}" placeholder="Contoh: Ilmu Komputer">
                </div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div>
                  <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Program Studi</label>
                  <input type="text" name="kuliah_prodi" class="form-control" value="${kuliah.program_studi || ''}" placeholder="Contoh: Teknik Informatika">
                </div>
                <div>
                  <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Jenjang Studi</label>
                  <select name="kuliah_jenjang" class="form-select">
                    <option value="S1" ${kuliah.jenjang === 'S1' ? 'selected' : ''}>S1 (Sarjana)</option>
                    <option value="D4" ${kuliah.jenjang === 'D4' ? 'selected' : ''}>D4 (Sarjana Terapan)</option>
                    <option value="D3" ${kuliah.jenjang === 'D3' ? 'selected' : ''}>D3 (Diploma)</option>
                    <option value="Kedinasan" ${kuliah.jenjang === 'Kedinasan' ? 'selected' : ''}>Ikatan Dinas</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- 2B. SECTION KERJA -->
            <div id="tracer-section-kerja" style="margin-bottom: 24px; padding: 20px; border: 1px solid var(--border-color); border-radius: var(--radius-md); ${status === 'Bekerja' ? '' : 'display: none;'}">
              <h4 style="font-size: 0.95rem; color: var(--navy-primary); margin-bottom: 14px; font-weight: 700;">Detail Pekerjaan</h4>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                <div>
                  <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Nama Perusahaan / Instansi</label>
                  <input type="text" name="kerja_perusahaan" class="form-control" value="${kerja.nama_perusahaan || ''}" placeholder="Contoh: Bank Jatim Cabang Jombang">
                </div>
                <div>
                  <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Jabatan / Posisi Kerja</label>
                  <input type="text" name="kerja_jabatan" class="form-control" value="${kerja.jabatan || ''}" placeholder="Contoh: Staff Operasional">
                </div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div>
                  <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Rentang Penghasilan / Gaji</label>
                  <select name="kerja_gaji" class="form-select">
                    <option value="< Rp 2.000.000" ${kerja.rentang_gaji === '< Rp 2.000.000' ? 'selected' : ''}>&lt; Rp 2.000.000</option>
                    <option value="Rp 2.000.000 - Rp 4.000.000" ${kerja.rentang_gaji === 'Rp 2.000.000 - Rp 4.000.000' ? 'selected' : ''}>Rp 2.000.000 - Rp 4.000.000</option>
                    <option value="Rp 4.000.000 - Rp 7.000.000" ${kerja.rentang_gaji === 'Rp 4.000.000 - Rp 7.000.000' ? 'selected' : ''}>Rp 4.000.000 - Rp 7.000.000</option>
                    <option value="> Rp 7.000.000" ${kerja.rentang_gaji === '> Rp 7.000.000' ? 'selected' : ''}>&gt; Rp 7.000.000</option>
                  </select>
                </div>
                <div>
                  <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Keselarasan dengan Minat/Jurusan SMA</label>
                  <select name="kerja_selaras" class="form-select">
                    <option value="Sangat Selaras">Sangat Selaras</option>
                    <option value="Cukup Selaras">Cukup Selaras</option>
                    <option value="Kurang Selaras">Kurang Selaras</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- 2C. SECTION WIRAUSAHA -->
            <div id="tracer-section-usaha" style="margin-bottom: 24px; padding: 20px; border: 1px solid var(--border-color); border-radius: var(--radius-md); ${status === 'Wirausaha' ? '' : 'display: none;'}">
              <h4 style="font-size: 0.95rem; color: var(--navy-primary); margin-bottom: 14px; font-weight: 700;">Detail Usaha Mandiri</h4>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                <div>
                  <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Nama Usaha / Bisnis</label>
                  <input type="text" name="usaha_nama" class="form-control" value="${usaha.nama_usaha || ''}" placeholder="Contoh: Grida Roastery & Coffee">
                </div>
                <div>
                  <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Bidang Usaha</label>
                  <input type="text" name="usaha_bidang" class="form-control" value="${usaha.bidang_usaha || ''}" placeholder="Kuliner / Fashion / Jasa / Digital">
                </div>
              </div>
            </div>

            <!-- 3. EVALUASI ALMAMATER -->
            <div style="margin-bottom: 24px;">
              <h4 style="font-size: 0.95rem; color: var(--navy-primary); margin-bottom: 8px; font-weight: 700;">3. Umpan Balik bagi SMA PGRI 2 Jombang</h4>
              <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Kepuasan terhadap Pembelajaran di Sekolah (Skala 1 - 5 Bintang)</label>
                <select name="kepuasan" class="form-select">
                  <option value="5">⭐⭐⭐⭐⭐ Sangat Puas (5)</option>
                  <option value="4">⭐⭐⭐⭐ Puas (4)</option>
                  <option value="3">⭐⭐⭐ Cukup (3)</option>
                </select>
              </div>
              <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Aspek Paling Bermanfaat yang Didapatkan di Grida Joe</label>
                <input type="text" name="aspek" class="form-control" value="${umpan.aspek_paling_bermanfaat || ''}" placeholder="Contoh: Pendidikan karakter, bimbingan SNBT, ekstrakurikuler">
              </div>
              <div>
                <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Saran & Masukan untuk Almamater Tercinta</label>
                <textarea name="saran" class="form-control" rows="3" placeholder="Tuliskan saran untuk kemajuan SMA PGRI 2 Jombang ke depan...">${umpan.saran_untuk_sekolah || ''}</textarea>
              </div>
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%; padding: 14px; font-size: 1rem;">
              <i class="fas fa-save"></i> Simpan Data Tracer Study
            </button>
          </form>
        </div>
      </div>
    `;
  },

  toggleTracerSections(val) {
    const k = document.getElementById('tracer-section-kuliah');
    const w = document.getElementById('tracer-section-kerja');
    const u = document.getElementById('tracer-section-usaha');
    if (k) k.style.display = val === 'Melanjutkan Studi' ? 'block' : 'none';
    if (w) w.style.display = val === 'Bekerja' ? 'block' : 'none';
    if (u) u.style.display = val === 'Wirausaha' ? 'block' : 'none';
  },

  async handleTracerSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const status = form.status_saat_ini.value;

    const payload = {
      status_saat_ini: status,
      data_kuliah: {
        perguruan_tinggi: form.kuliah_ptn?.value || '',
        fakultas: form.kuliah_fakultas?.value || '',
        program_studi: form.kuliah_prodi?.value || '',
        jenjang: form.kuliah_jenjang?.value || '',
      },
      data_kerja: {
        nama_perusahaan: form.kerja_perusahaan?.value || '',
        jabatan: form.kerja_jabatan?.value || '',
        rentang_gaji: form.kerja_gaji?.value || '',
        keselarasan_bidang: form.kerja_selaras?.value || '',
      },
      data_wirausaha: {
        nama_usaha: form.usaha_nama?.value || '',
        bidang_usaha: form.usaha_bidang?.value || '',
      },
      umpan_balik: {
        kepuasan_pembelajaran: parseInt(form.kepuasan?.value, 10) || 5,
        aspek_paling_bermanfaat: form.aspek?.value || '',
        saran_untuk_sekolah: form.saran?.value || '',
      },
    };

    try {
      const res = await App.apiRequest('/api/alumni/tracer', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      App.showToast(res.message, 'success');
      Router.navigate('dashboard');
    } catch (err) {
      App.showToast(err.message, 'error');
    }
  },

  // ============================================================
  // 8. DASHBOARD ALUMNI (MEMBER AREA)
  // ============================================================
  async renderDashboard(container) {
    if (!App.state.user) {
      Router.navigate('home');
      return;
    }

    const u = App.state.user;
    const tracerRes = await App.apiRequest('/api/alumni/tracer/me');
    const tracer = tracerRes.data;

    container.innerHTML = `
      <div class="container section">
        <div style="display: grid; grid-template-columns: 320px 1fr; gap: 32px; align-items: flex-start;">
          <!-- Sidebar Profil -->
          <div style="background: #ffffff; padding: 28px; border-radius: var(--radius-lg); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); text-align: center;">
            <img src="${u.foto_profil || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; margin: 0 auto 16px; border: 3px solid var(--gold-primary);">
            <h3 style="font-family: var(--font-heading); color: var(--navy-primary); font-size: 1.25rem;">${u.nama_lengkap}</h3>
            <span class="alumni-card-batch" style="margin-bottom: 14px;">Angkatan ${u.tahun_lulus} • ${u.jurusan}</span>
            <div style="font-size: 0.8125rem; color: var(--text-muted); margin-bottom: 16px;">
              <strong>NISN:</strong> ${u.nisn}<br>
              <strong>Email:</strong> ${u.email}
            </div>
            <button class="btn btn-outline btn-sm" style="width: 100%;" onclick="Router.openEditProfileModal()">
              <i class="fas fa-user-edit"></i> Edit Profil Saya
            </button>
          </div>

          <!-- Main Dashboard Content -->
          <div style="display: flex; flex-direction: column; gap: 24px;">
            <!-- Status Tracer Card -->
            <div style="background: #ffffff; padding: 28px; border-radius: var(--radius-lg); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
              <div>
                <span class="section-eyebrow">STATUS PELACAKAN</span>
                <h3 style="font-family: var(--font-heading); color: var(--navy-primary); font-size: 1.3rem;">
                  ${tracer ? '✅ Kuesioner Tracer Study Telah Terisi' : '⚠️ Kuesioner Tracer Study Belum Diisi'}
                </h3>
                <p style="color: var(--text-muted); font-size: 0.85rem;">
                  ${tracer ? `Terakhir diperbarui pada: ${new Date(tracer.updatedAt || tracer.createdAt).toLocaleDateString('id-ID')}` : 'Mohon luangkan waktu 2 menit untuk memperbarui data kelulusan Anda.'}
                </p>
              </div>
              <a href="#tracer" class="btn btn-primary btn-sm">
                <i class="fas fa-edit"></i> ${tracer ? 'Perbarui Data Tracer' : 'Isi Kuesioner Sekarang'}
              </a>
            </div>

            <!-- Detail Jejak Terdaftar -->
            <div style="background: #ffffff; padding: 28px; border-radius: var(--radius-lg); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
              <h4 style="font-family: var(--font-heading); color: var(--navy-primary); font-size: 1.1rem; margin-bottom: 16px;">Informasi Aktivitas Terkini Anda</h4>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 0.875rem;">
                <div style="background: var(--bg-main); padding: 14px; border-radius: var(--radius-sm);">
                  <span style="color: var(--text-muted); font-size: 0.75rem;">Aktivitas:</span>
                  <div style="font-weight: 700; color: var(--navy-primary);">${u.status_saat_ini || 'Belum diisi'}</div>
                </div>
                <div style="background: var(--bg-main); padding: 14px; border-radius: var(--radius-sm);">
                  <span style="color: var(--text-muted); font-size: 0.75rem;">Nama Kampus / Instansi:</span>
                  <div style="font-weight: 700; color: var(--navy-primary);">${u.nama_instansi_terkini || '-'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  openEditProfileModal() {
    const u = App.state.user;
    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">Edit Profil Alumni</h3>
        <button type="button" class="modal-close-btn" onclick="App.closeModal()">&times;</button>
      </div>
      <form onsubmit="Router.handleEditProfileSubmit(event)">
        <div class="modal-body" style="display: flex; flex-direction: column; gap: 12px; max-height: 70vh; overflow-y: auto;">
          <div>
            <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Nama Lengkap</label>
            <input type="text" name="nama_lengkap" class="form-control" value="${u.nama_lengkap}" required>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">No. WhatsApp</label>
              <input type="text" name="no_telepon" class="form-control" value="${u.no_telepon || ''}">
            </div>
            <div>
              <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Kota Domisili</label>
              <input type="text" name="alamat" class="form-control" value="${u.alamat || ''}">
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div>
              <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Link LinkedIn</label>
              <input type="text" name="linkedin" class="form-control" value="${u.linkedin || ''}">
            </div>
            <div>
              <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Link Instagram</label>
              <input type="text" name="instagram" class="form-control" value="${u.instagram || ''}">
            </div>
          </div>
          <div>
            <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Bio Singkat</label>
            <textarea name="bio" class="form-control" rows="2">${u.bio || ''}</textarea>
          </div>
          <div>
            <label style="display: block; font-size: 0.775rem; font-weight: 700; margin-bottom: 4px;">Perbarui Foto Profil (Maks. 10MB - Sesuai Limit Telegram Bot)</label>
            <input type="file" id="edit-profile-photo-input" class="form-control" accept="image/*">
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline btn-sm" onclick="App.closeModal()">Batal</button>
          <button type="submit" class="btn btn-navy btn-sm">Simpan Perubahan</button>
        </div>
      </form>
    `);
  },

  async handleEditProfileSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const fileInput = document.getElementById('edit-profile-photo-input');

    try {
      let photoUrl = '';
      if (fileInput && fileInput.files.length > 0) {
        const uploadRes = await App.uploadFile(fileInput.files[0]);
        photoUrl = uploadRes.url;
      }

      const res = await App.apiRequest('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          nama_lengkap: form.nama_lengkap.value,
          no_telepon: form.no_telepon.value,
          alamat: form.alamat.value,
          linkedin: form.linkedin.value,
          instagram: form.instagram.value,
          bio: form.bio.value,
          foto_profil: photoUrl || undefined,
        }),
      });

      App.state.user = res.user;
      localStorage.setItem('grida_user', JSON.stringify(res.user));
      App.renderHeaderUserStatus();
      App.closeModal();
      App.showToast('Profil berhasil diperbarui!', 'success');
      this.handleRoute();
    } catch (err) {
      App.showToast(err.message, 'error');
    }
  },

  // ============================================================
  // 9. PANEL ADMIN SEKOLAH (ADMIN CONTROL CENTER)
  // ============================================================
  async renderAdmin(container) {
    if (App.state.user?.role !== 'admin') {
      Router.navigate('home');
      return;
    }

    const [dashRes, alumniRes] = await Promise.all([
      App.apiRequest('/api/admin/dashboard'),
      App.apiRequest('/api/admin/alumni'),
    ]);

    const stats = dashRes.data;
    const allAlumni = alumniRes.data || [];

    container.innerHTML = `
      <div class="container section">
        <div class="section-header">
          <div>
            <span class="section-eyebrow">KONTROL ADMINISTRATOR</span>
            <h2 class="section-title">Pusat Kendali <span>Tracer Study & Alumni</span></h2>
            <p class="section-desc">Pengelolaan data alumni, verifikasi lulusan, unduh laporan Excel, dan moderasi konten SMA PGRI 2 Jombang.</p>
          </div>
          <div style="display: flex; gap: 10px;">
            <a href="/api/admin/export/tracer" target="_blank" class="btn btn-primary btn-sm">
              <i class="fas fa-file-excel"></i> Ekspor Data Tracer (Excel/CSV)
            </a>
          </div>
        </div>

        <!-- Metric Stat Cards -->
        <div class="stats-grid" style="margin-bottom: 32px;">
          <div class="stat-card">
            <div class="stat-card-icon"><i class="fas fa-users"></i></div>
            <div>
              <div class="stat-num">${stats.total_alumni}</div>
              <div class="stat-label">Total Akun Alumni</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card-icon"><i class="fas fa-check-double"></i></div>
            <div>
              <div class="stat-num">${stats.total_tracer_terisi}</div>
              <div class="stat-label">Kuesioner Terisi</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card-icon"><i class="fas fa-hand-holding-heart"></i></div>
            <div>
              <div class="stat-num">Rp ${(stats.total_donasi_terkumpul || 0).toLocaleString('id-ID')}</div>
              <div class="stat-label">Total Donasi Masuk</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card-icon"><i class="fas fa-newspaper"></i></div>
            <div>
              <div class="stat-num">${stats.total_berita}</div>
              <div class="stat-label">Berita / Artikel</div>
            </div>
          </div>
        </div>

        <!-- Alumni Verification & Management Table -->
        <div style="background: #ffffff; border-radius: var(--radius-lg); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); overflow: hidden;">
          <div style="padding: 20px 24px; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between;">
            <h3 style="font-family: var(--font-heading); font-size: 1.15rem; color: var(--navy-primary);">
              Daftar Alumni & Status Verifikasi
            </h3>
            <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">
              Total ${allAlumni.length} data alumni
            </span>
          </div>

          <div class="table-responsive">
            <table class="table-custom">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Alumni</th>
                  <th>NISN</th>
                  <th>Angkatan</th>
                  <th>Jurusan</th>
                  <th>Status Terkini</th>
                  <th>Status Akun</th>
                  <th>Aksi Verifikasi</th>
                </tr>
              </thead>
              <tbody>
                ${allAlumni.map((a, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>
                      <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${a.foto_profil}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
                        <div>
                          <strong>${a.nama_lengkap}</strong>
                          <div style="font-size: 0.72rem; color: var(--text-muted);">${a.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><code>${a.nisn}</code></td>
                    <td>Angkatan ${a.tahun_lulus}</td>
                    <td>${a.jurusan}</td>
                    <td>${a.status_saat_ini || '-'}</td>
                    <td>
                      <span class="admin-badge ${a.status_verifikasi === 'approved' ? 'badge-approved' : (a.status_verifikasi === 'rejected' ? 'badge-rejected' : 'badge-pending')}">
                        ${(a.status_verifikasi || 'approved').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div style="display: flex; gap: 6px;">
                        ${a.status_verifikasi !== 'approved' ? `
                          <button class="btn btn-sm" style="background: var(--emerald-soft); color: var(--emerald-primary); padding: 4px 8px; font-size: 0.75rem;" onclick="Router.setAlumniStatus('${a._id}', 'approved')">
                            ✓ Setujui
                          </button>
                        ` : ''}
                        ${a.status_verifikasi !== 'rejected' ? `
                          <button class="btn btn-sm" style="background: var(--danger-soft); color: var(--danger-primary); padding: 4px 8px; font-size: 0.75rem;" onclick="Router.setAlumniStatus('${a._id}', 'rejected')">
                            ✕ Tolak
                          </button>
                        ` : ''}
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  async setAlumniStatus(id, status) {
    try {
      await App.apiRequest(`/api/admin/alumni/${id}/verify`, {
        method: 'PUT',
        body: JSON.stringify({ status_verifikasi: status }),
      });
      App.showToast(`Status alumni berhasil diubah menjadi ${status.toUpperCase()}`, 'success');
      this.handleRoute();
    } catch (err) {
      App.showToast(err.message, 'error');
    }
  },

  // Modal Lightbox Foto
  openLightbox(url, title, cat) {
    App.openModal(`
      <div class="modal-header">
        <h3 class="modal-title">${title} <small style="font-size: 0.75rem; color: var(--text-muted);">(${cat})</small></h3>
        <button type="button" class="modal-close-btn" onclick="App.closeModal()">&times;</button>
      </div>
      <div class="modal-body" style="padding: 0; text-align: center; background: #000;">
        <img src="${url}" alt="${title}" style="max-height: 75vh; width: 100%; object-fit: contain;">
      </div>
    `);
  }
};

window.Router = Router;
