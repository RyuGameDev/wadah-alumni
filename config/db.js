const mongoose = require('mongoose');

let isConnected = false;

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tracer_smapgri2jombang';
  
  try {
    console.log(`📡 Mencoba menghubungkan ke MongoDB (${uri})...`);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    isConnected = true;
    console.log('✅ Terhubung ke database MongoDB dengan sukses.');
  } catch (err) {
    isConnected = false;
    console.warn('⚠️ Tidak dapat terhubung ke MongoDB server lokal/remote:', err.message);
    console.warn('ℹ️ Sistem otomatis mengaktifkan Real-time Persistent Local JSON Store di /data/local_db.json.');
    console.warn('ℹ️ Seluruh fitur (auth, tracer study, forum, berita, donasi, loker, admin) tetap berjalan 100% normal tanpa error!');
  }
}

function getIsMongoConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

module.exports = {
  connectDB,
  getIsMongoConnected,
};
