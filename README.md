# 🎓 Portal Tracer Study & Direktori Alumni SMA PGRI 2 Jombang ("Grida Joe")

Portal web resmi pelacakan jejak alumni, jejaring karir, warta alumni, donasi almamater, forum diskusi, dan manajemen tracer study **SMA PGRI 2 Jombang** (*"Sekolahnya Para Juara"*).

---

## ✨ Fitur Unggulan

- 🏛️ **Desain Neo-Collegiate Luxury**: Antarmuka modern dengan Deep Navy (`#06152b`), Imperial Gold (`#f59e0b`), dan Glassmorphism.
- 📱 **Ultra Mobile Responsive & Native App Bar**: Dilengkapi bilah navigasi bawah khas aplikasi native, off-canvas sliding drawer, dan layout adaptif untuk semua jenis layar (mobile hingga monitor ultrawide).
- 🔒 **Direktori Cari Alumni Privat & Terproteksi**: Hanya dapat diakses oleh anggota/alumni yang telah masuk (*login required*) demi menjaga keamanan dan privasi data lulusan.
- 📝 **Kuesioner Tracer Study Interaktif**: Pelacakan lulusan untuk jalur Kuliah, Bekerja, Wirausaha, maupun Mencari Kerja.
- 🤖 **Telegram Bot API Storage**: Penyimpanan berkas foto dan dokumen terintegrasi langsung ke Telegram Bot API dengan validasi batas ukuran (Foto $\le$ 10 MB, Dokumen $\le$ 20 MB).
- 🗄️ **Dual Database Support**: Kompatibel dengan **MongoDB** (Mongoose) dan otomatis mengaktifkan **Local Persistent JSON Store** jika server MongoDB offline, sehingga aplikasi selalu siap dijalankan langsung tanpa kendala setup database.
- 📰 **Warta & Berita Alumni**: Publikasi agenda, kabar duka/sukacita, dan prestasi alumni.
- 🤝 **Program Donasi & Crowdfunding**: Penggalangan dana almamater dengan persentase capaian target dan upload bukti transfer.
- 💼 **Bursa Karir & Loker**: Lowongan pekerjaan dan magang terverifikasi.
- 💬 **Forum Diskusi**: Ruang diskusi antar-alumni dan adik kelas.
- 🛠️ **Panel Administrator Lengkap**: Manajemen verifikasi alumni, analisis kuesioner, dan **Ekspor Data Tracer ke Excel/CSV**.

---

## 🚀 Panduan Instalasi & Menjalankan

### 1. Clone Repository
```bash
git clone https://github.com/RyuGameDev/wadah-alumni.git
cd wadah-alumni
```

### 2. Install Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment (`.env`)
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Sesuaikan variabel environment sesuai kebutuhan (Token Telegram Bot, Chat ID, MongoDB URI).

### 4. Jalankan Aplikasi
```bash
# Mode Produksi
npm start

# Mode Development
npm run dev
```

Buka peramban di: **`http://localhost:5000`**

---

## 🔐 Akun Demo Bawaan

| Peran | Username / Email | Password |
|---|---|---|
| **Administrator Sekolah** | `admin@smapgri2jombang.sch.id` | `admin123` |
| **Alumni (Terverifikasi)** | `rizky.pratama@gmail.com` | `alumni123` |

---

## 🛡️ Hak Cipta
&copy; 2026 **SMA PGRI 2 Jombang**. Seluruh Hak Cipta Dilindungi.
Motto: *"Sekolahnya Para Juara"* | Visi: IMPRESSIA | NPSN: 20539726
