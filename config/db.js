const mongoose = require('mongoose');

let isConnected = false;

async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tracer_smapgri2jombang';
  
  try {
    const maskedUri = uri.includes('@') ? uri.replace(/:([^@]+)@/, ':****@') : uri;
    console.log(`📡 Menghubungkan ke MongoDB (${maskedUri})...`);
    
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      bufferCommands: false,
    });
    isConnected = true;
    console.log('✅ Terhubung ke database MongoDB dengan sukses.');
  } catch (err) {
    isConnected = false;
    console.warn('⚠️ Tidak dapat terhubung ke MongoDB:', err.message);
    console.warn('ℹ️ Sistem otomatis mengaktifkan Real-time Persistent Local JSON Store.');
  }
}

function getIsMongoConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

module.exports = {
  connectDB,
  getIsMongoConnected,
};
