// 

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not set');
    }
    let mongoHost = 'set';
    try {
      const u = new URL(mongoUri);
      mongoHost = u.host || 'set';
    } catch (_) {}
    console.log(' MONGO_URI host:', mongoHost);

    let retries = 10; // Number of retries
    let connected = false;

    while (retries > 0 && !connected) {
      try {
        console.log(` Trying to connect to MongoDB... (Attempt ${11 - retries})`);
        const conn = await mongoose.connect(mongoUri);
        console.log(` MongoDB Connected: ${conn.connection.host}`);
        connected = true;
      } catch (error) {
        console.error(`❌ MongoDB connection error on attempt ${11 - retries}: ${error.message}`);
        retries--;
        if (retries > 0) {
          await new Promise(res => setTimeout(res, 10000)); // Wait 10 seconds before retrying
        }
      }
    }

    if (!connected) {
      console.error('🔴 Failed to connect to MongoDB after multiple retries. Exiting...');
      process.exit(1);
    }

  } catch (err) {
    console.error(`🔴 Initial connection setup error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
