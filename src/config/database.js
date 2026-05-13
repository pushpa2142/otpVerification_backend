/**
 * Database Configuration
 * Manages MongoDB connection with retry logic and graceful shutdown
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');
let isConnected = false;
if (isConnected) {
  return;
}
/**
 * Print a human-friendly diagnostic based on the Mongoose error
 */
const printDiagnostic = (error, mongoURI) => {
  const isAtlas = mongoURI.includes('mongodb+srv') || mongoURI.includes('atlas');
  const msg = error.message || '';

  logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.error('  MongoDB Connection Failed — Diagnosis:');
  logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (msg.includes('ECONNREFUSED') || msg.includes('connect ECONNREFUSED')) {
    logger.error('  ❌ CAUSE : MongoDB is not running on this machine.');
    logger.error('  📋 FIX   :');
    logger.error('     Windows : net start MongoDB');
    logger.error('               — or run the MongoDB installer from mongodb.com/try/download/community');
    logger.error('     macOS   : brew services start mongodb-community@7.0');
    logger.error('     Linux   : sudo systemctl start mongod');
    logger.error('     ☁️  OR   : Use MongoDB Atlas (free) → https://www.mongodb.com/atlas');
  } else if (msg.includes('ENOTFOUND') || msg.includes('getaddrinfo')) {
    logger.error('  ❌ CAUSE : Hostname not found — wrong Atlas cluster URL or no internet.');
    logger.error('  📋 FIX   : Check MONGODB_URI in your .env file.');
    logger.error('             The Atlas URI should look like:');
    logger.error('             mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/phone_verify');
  } else if (msg.includes('Authentication failed') || msg.includes('Unauthorized') || msg.includes('auth')) {
    logger.error('  ❌ CAUSE : Wrong username or password in the MongoDB URI.');
    logger.error('  📋 FIX   : Update MONGODB_URI in .env with correct credentials.');
    logger.error('             For Atlas: check Database Access → your user → Edit Password');
    logger.error('             Local URI format: mongodb://username:password@localhost:27017/phone_verify?authSource=admin');
  } else if (msg.includes('SSL') || msg.includes('TLS') || msg.includes('certificate')) {
    logger.error('  ❌ CAUSE : SSL/TLS certificate issue (common with Atlas on some networks).');
    logger.error('  📋 FIX   : Add &tls=true&tlsAllowInvalidCertificates=true to your Atlas URI');
    logger.error('             — or check if your firewall/VPN is blocking port 27017.');
  } else if (msg.includes('Server selection timed out') || msg.includes('timed out')) {
    if (isAtlas) {
      logger.error('  ❌ CAUSE : Cannot reach MongoDB Atlas — IP not whitelisted or firewall blocking.');
      logger.error('  📋 FIX   : Atlas Dashboard → Network Access → Add IP Address → Allow 0.0.0.0/0');
    } else {
      logger.error('  ❌ CAUSE : MongoDB is not running or port 27017 is blocked.');
      logger.error('  📋 FIX   : Start MongoDB, then retry.');
    }
  } else {
    logger.error(`  ❌ ERROR : ${msg}`);
  }

  logger.error('');
  logger.error(`  🔍 URI used (masked): ${mongoURI.replace(/:([^@]+)@/, ':****@')}`);
  logger.error('  📖 See MONGODB_FIX.md for full step-by-step instructions.');
  logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
};

/**
 * Connect to MongoDB with retry mechanism
 * @param {number} retries - Number of retry attempts
 */
const connectDB = async (retries = 5) => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/phone_verify';

  // Warn if still using the placeholder value
  if (mongoURI.includes('your_') || mongoURI === '') {
    logger.error('MONGODB_URI in .env is still set to a placeholder. Please set a real value.');
    process.exit(1);
  }

  const options = {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    family: 4, // Use IPv4
  };

  logger.info(`Connecting to MongoDB... (URI: ${mongoURI.replace(/:([^@]+)@/, ':****@')})`);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(mongoURI, options);
      logger.info(`MongoDB connected: ${mongoose.connection.host} / db: ${mongoose.connection.name}`);
      break;
    } catch (error) {
      logger.error(`MongoDB connection attempt ${attempt}/${retries} failed: ${error.message}`);

      if (attempt === retries) {
        printDiagnostic(error, mongoURI);
        process.exit(1);
      }

      const waitMs = Math.pow(2, attempt) * 1000;
      logger.info(`Retrying in ${waitMs / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, waitMs));
    }
  }
};

/**
 * Gracefully close MongoDB connection
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed gracefully');
    isConnected = true;
  } catch (error) {
    logger.error(`Error closing MongoDB connection: ${error.message}`);
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected. Attempting reconnection...');
});

mongoose.connection.on('error', (error) => {
  logger.error(`MongoDB connection error: ${error.message}`);
});

module.exports = { connectDB, disconnectDB };
