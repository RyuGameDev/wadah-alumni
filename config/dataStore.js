const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { getIsMongoConnected } = require('./db');
const { getInitialData } = require('./initialSeed');

// Model Mongoose
const UserModel = require('../models/User');
const TracerStudyModel = require('../models/TracerStudy');
const NewsModel = require('../models/News');
const DonationModel = require('../models/Donation');
const CareerModel = require('../models/Career');
const ForumModel = require('../models/Forum');
const GalleryModel = require('../models/Gallery');
const BannerModel = require('../models/Banner');

const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'data') : path.join(__dirname, '..', 'data');
const LOCAL_DB_FILE = path.join(DATA_DIR, 'local_db.json');

// Memory cache untuk fallback local
let localDB = null;

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {}
}

function loadLocalDB() {
  ensureDataDir();
  if (fs.existsSync(LOCAL_DB_FILE)) {
    try {
      const content = fs.readFileSync(LOCAL_DB_FILE, 'utf-8');
      localDB = JSON.parse(content);
      return;
    } catch (e) {
      console.error('Gagal membaca local_db.json, mereset data:', e.message);
    }
  }

  // Jika belum ada, inisialisasi dengan initial seed
  localDB = getInitialData();
  saveLocalDB();
}

function saveLocalDB() {
  ensureDataDir();
  try {
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(localDB, null, 2), 'utf-8');
  } catch (e) {
    // Di lingkungan serverless write file lokal diabaikan jika gagal
  }
}

function generateId() {
  return new mongoose.Types.ObjectId().toString();
}

// Inisialisasi data & auto-seed kredensial demo ke MongoDB
async function initStore() {
  loadLocalDB();

  // Jika MongoDB terhubung, pastikan kredensial demo & data awal tersedia
  if (getIsMongoConnected()) {
    try {
      const initial = getInitialData();
      const userCount = await UserModel.countDocuments();
      
      if (userCount === 0) {
        console.log('🌱 Melakukan auto-seeding data awal SMA PGRI 2 Jombang ke MongoDB...');
        await UserModel.insertMany(initial.users);
        await TracerStudyModel.insertMany(initial.tracerStudies);
        await NewsModel.insertMany(initial.news);
        await DonationModel.insertMany(initial.donations);
        await CareerModel.insertMany(initial.careers);
        await ForumModel.insertMany(initial.forums);
        await GalleryModel.insertMany(initial.gallery);
        if (initial.banners) await BannerModel.insertMany(initial.banners);
        console.log('✅ Seeding MongoDB awal berhasil.');
      } else {
        // Pastikan kredensial admin demo selalu ada
        const adminExists = await UserModel.findOne({ email: 'admin@smapgri2jombang.sch.id' });
        if (!adminExists) {
          const adminUser = initial.users.find(u => u.role === 'admin');
          if (adminUser) await UserModel.create(adminUser);
          console.log('✅ Kredensial admin demo dibuat di MongoDB.');
        }

        // Pastikan kredensial alumni demo selalu ada
        const alumniExists = await UserModel.findOne({ email: 'rizky.pratama@gmail.com' });
        if (!alumniExists) {
          const alumniUser = initial.users.find(u => u.email === 'rizky.pratama@gmail.com');
          if (alumniUser) await UserModel.create(alumniUser);
          console.log('✅ Kredensial alumni demo dibuat di MongoDB.');
        }

        // Pastikan banner awal ada di MongoDB jika koleksi banner masih kosong
        const bannerCount = await BannerModel.countDocuments();
        if (bannerCount === 0 && initial.banners) {
          await BannerModel.insertMany(initial.banners);
          console.log('✅ Default Hero Banners berhasil di-seed ke MongoDB.');
        }
      }
    } catch (err) {
      console.error('Error saat seeding kredensial/banner MongoDB:', err.message);
    }
  }
}

// Universal Repository Generator untuk abstraksi Mongoose vs Local Fallback
function createRepo(collectionName, MongooseModel) {
  return {
    async find(filter = {}, sort = { createdAt: -1 }) {
      if (getIsMongoConnected()) {
        return await MongooseModel.find(filter).sort(sort).lean();
      }

      let items = [...(localDB[collectionName] || [])];

      // Filter sederhana
      items = items.filter(item => {
        for (const [key, val] of Object.entries(filter)) {
          if (val === undefined || val === null || val === '') continue;
          if (key === '$or' && Array.isArray(val)) {
            const orMatch = val.some(condition => {
              for (const [orK, orV] of Object.entries(condition)) {
                if (orV instanceof RegExp) {
                  return orV.test(item[orK] || '');
                }
                return item[orK] === orV;
              }
              return false;
            });
            if (!orMatch) return false;
            continue;
          }

          if (val instanceof RegExp) {
            if (!val.test(item[key] || '')) return false;
          } else if (typeof val === 'object') {
            if (val.$regex) {
              const regex = new RegExp(val.$regex, val.$options || '');
              if (!regex.test(item[key] || '')) return false;
            }
          } else {
            if (item[key] != val) return false;
          }
        }
        return true;
      });

      // Sorting
      if (sort) {
        const [sortKey, sortOrder] = Object.entries(sort)[0] || ['createdAt', -1];
        items.sort((a, b) => {
          const valA = a[sortKey] || 0;
          const valB = b[sortKey] || 0;
          return sortOrder === -1 ? (valB > valA ? 1 : -1) : (valA > valB ? 1 : -1);
        });
      }

      return items;
    },

    async findById(id) {
      if (!id) return null;
      if (getIsMongoConnected()) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          return null;
        }
        try {
          return await MongooseModel.findById(id).lean();
        } catch (e) {
          return null;
        }
      }
      return (localDB[collectionName] || []).find(item => item._id && item._id.toString() === id.toString()) || null;
    },

    async findOne(filter = {}) {
      if (getIsMongoConnected()) {
        return await MongooseModel.findOne(filter).lean();
      }
      const all = await this.find(filter);
      return all[0] || null;
    },

    async create(data) {
      if (getIsMongoConnected()) {
        const doc = await MongooseModel.create(data);
        return doc.toObject();
      }
      const newItem = {
        _id: data._id || generateId(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      localDB[collectionName].unshift(newItem);
      saveLocalDB();
      return newItem;
    },

    async findByIdAndUpdate(id, updateData, options = {}) {
      if (!id) return null;
      if (getIsMongoConnected()) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          return null;
        }
        try {
          return await MongooseModel.findByIdAndUpdate(id, updateData, { new: true, ...options }).lean();
        } catch (e) {
          return null;
        }
      }

      const list = localDB[collectionName] || [];
      const index = list.findIndex(item => item._id && item._id.toString() === id.toString());
      if (index === -1) return null;

      // Tangani operator $inc, $push, dll jika ada
      const current = list[index];
      let updated = { ...current };

      if (updateData.$inc) {
        for (const [k, v] of Object.entries(updateData.$inc)) {
          updated[k] = (updated[k] || 0) + v;
        }
        delete updateData.$inc;
      }

      if (updateData.$push) {
        for (const [k, v] of Object.entries(updateData.$push)) {
          updated[k] = [...(updated[k] || []), v];
        }
        delete updateData.$push;
      }

      updated = {
        ...updated,
        ...updateData,
        updatedAt: new Date(),
      };

      list[index] = updated;
      saveLocalDB();
      return updated;
    },

    async findByIdAndDelete(id) {
      if (!id) return null;
      if (getIsMongoConnected()) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          return null;
        }
        try {
          return await MongooseModel.findByIdAndDelete(id).lean();
        } catch (e) {
          return null;
        }
      }
      const list = localDB[collectionName] || [];
      const index = list.findIndex(item => item._id && item._id.toString() === id.toString());
      if (index === -1) return null;
      const [removed] = list.splice(index, 1);
      saveLocalDB();
      return removed;
    },

    async countDocuments(filter = {}) {
      if (getIsMongoConnected()) {
        return await MongooseModel.countDocuments(filter);
      }
      const results = await this.find(filter);
      return results.length;
    },
  };
}

module.exports = {
  initStore,
  users: createRepo('users', UserModel),
  tracerStudies: createRepo('tracerStudies', TracerStudyModel),
  news: createRepo('news', NewsModel),
  donations: createRepo('donations', DonationModel),
  careers: createRepo('careers', CareerModel),
  forums: createRepo('forums', ForumModel),
  gallery: createRepo('gallery', GalleryModel),
  banners: createRepo('banners', BannerModel),
};
