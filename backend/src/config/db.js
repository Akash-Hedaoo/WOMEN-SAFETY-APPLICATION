const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/safe-era';
  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`[DB] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[DB] MongoDB connection warning: ${error.message}`);
    console.warn(`[DB] Running Safe-Era backend server in fallback in-memory mode.`);
  }
};

module.exports = connectDB;
