const mongoose = require('mongoose');

/**
 * Connects to MongoDB. Call once at application startup.
 * Relies on MONGO_URI environment variable.
 */
const dbConnect = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI environment variable is not defined.');
  }

  try {
    await mongoose.connect(uri);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1); // exit so a process manager (PM2, Docker) can restart
  }
};

// Graceful shutdown on app termination signals
const gracefulShutdown = async (signal) => {
  console.log(`${signal} received — closing MongoDB connection.`);
  await mongoose.connection.close();
  process.exit(0);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = dbConnect;
