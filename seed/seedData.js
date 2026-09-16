require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { connectDB, getIsMongoConnected } = require('../config/db');
const { getInitialData } = require('../config/initialSeed');

// Models
const UserModel = require('../models/User');
const TracerStudyModel = require('../models/TracerStudy');
const NewsModel = require('../models/News');
const DonationModel = require('../models/Donation');
const CareerModel = require('../models/Career');
const ForumModel = require('../models/Forum');
const GalleryModel = require('../models/Gallery');
const BannerModel = require('../models/Banner');

async function seedMongoCredentials() {
  console.log('🚀 Memulai proses seeding data & demo credentials ke MongoDB...');
  await connectDB();

  if (!getIsMongoConnected()) {
    console.error('❌ Gagal terhubung ke MongoDB. Pastikan MONGODB_URI di .env sudah benar.');
    process.exit(1);
  }

  const initial = getInitialData();

  try {
    // 1. Pastikan Admin Demo ada / terupdate
    const salt = bcrypt.genSaltSync(10);
    const adminPasswordHash = bcrypt.hashSync('admin123', salt);
    const alumniPasswordHash = bcrypt.hashSync('alumni123', salt);

    const adminData = {
      nama_lengkap: 'Admin Tracer Study Grida Joe',
      nisn: 'ADMIN001',
      email: 'admin@smapgri2jombang.sch.id',
      password: adminPasswordHash,
      no_telepon: '081234567890',
      tahun_lulus: 2010,
      jurusan: 'MIPA / IPA',
      role: 'admin',
      status_verifikasi: 'approved',
      catatan_verifikasi: 'Akun Administrator Resmi SMA PGRI 2 Jombang',
      bio: 'Pengelola Portal Tracer Study & Jejaring Alumni SMA PGRI 2 Jombang.',
      status_saat_ini: 'Bekerja',
      nama_instansi_terkini: 'SMA PGRI 2 Jombang',
      jabatan_atau_prodi: 'Koordinator BKK & Tracer Study'
    };

    const alumniData = {
      nama_lengkap: 'Ahmad Rizky Pratama',
      nisn: '0034567891',
      email: 'rizky.pratama@gmail.com',
      password: alumniPasswordHash,
      no_telepon: '081332114455',
      tahun_lulus: 2021,
      jurusan: 'MIPA / IPA',
      role: 'alumni',
      status_verifikasi: 'approved',
      catatan_verifikasi: 'Data ijazah terverifikasi Grida Joe',
      bio: 'Alumni Grida Joe 2021, passionate di bidang software engineering dan cloud computing.',
      status_saat_ini: 'Melanjutkan Studi',
      nama_instansi_terkini: 'Universitas Brawijaya Malang',
      jabatan_atau_prodi: 'S1 Teknik Informatika'
    };

    await UserModel.findOneAndUpdate(
      { email: adminData.email },
      { $set: adminData },
      { upsert: true, new: true }
    );
    console.log('✅ Demo Credential [ADMIN] berhasil di-seed:');
    console.log('   Email   : admin@smapgri2jombang.sch.id');
    console.log('   Password: admin123');

    await UserModel.findOneAndUpdate(
      { email: alumniData.email },
      { $set: alumniData },
      { upsert: true, new: true }
    );
    console.log('✅ Demo Credential [ALUMNI] berhasil di-seed:');
    console.log('   Email   : rizky.pratama@gmail.com');
    console.log('   Password: alumni123');

    // 2. Cek apakah koleksi lain butuh seeding data awal
    const newsCount = await NewsModel.countDocuments();
    if (newsCount === 0) {
      console.log('🌱 Menyemai data awal berita, tracer study, donasi, karir, forum, dan galeri...');
      await TracerStudyModel.insertMany(initial.tracerStudies);
      await NewsModel.insertMany(initial.news);
      await DonationModel.insertMany(initial.donations);
      await CareerModel.insertMany(initial.careers);
      await ForumModel.insertMany(initial.forums);
      await GalleryModel.insertMany(initial.gallery);
      console.log('✅ Semua koleksi awal MongoDB berhasil diisi.');
    }

    const bannerCount = await BannerModel.countDocuments();
    if (bannerCount === 0 && initial.banners) {
      console.log('🌱 Menyemai 3 slide banner hero awal ke MongoDB...');
      await BannerModel.insertMany(initial.banners);
      console.log('✅ Slide banner hero awal berhasil di-seed.');
    }

    console.log('\n🎉 Selesai! Semua kredensial demo siap digunakan di MongoDB.');
  } catch (err) {
    console.error('❌ Terjadi kesalahan saat seeding ke MongoDB:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Koneksi MongoDB ditutup.');
    process.exit(0);
  }
}

seedMongoCredentials();
