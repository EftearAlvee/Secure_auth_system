const mongoose = require('mongoose');

class Database {
  constructor() {
    this.isConnected = false;
    this.connection = null;
  }

  async connect() {
    if (this.isConnected) {
      console.log('📊 Database already connected');
      return this.connection;
    }

    try {
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4,
        maxPoolSize: 10,
        minPoolSize: 2,
        retryWrites: true,
        retryReads: true,
      };

      await mongoose.connect(process.env.MONGODB_URI, options);

      this.isConnected = true;
      this.connection = mongoose.connection;

      console.log('✅ MongoDB Atlas Connected Successfully');
      console.log(`📊 Database Name: ${this.connection.name}`);
      console.log(`🔗 Connection Host: ${this.connection.host}`);

      this.setupEventListeners();
      return this.connection;

    } catch (error) {
      console.error('❌ MongoDB Connection Failed:', error.message);
      throw error;
    }
  }

  setupEventListeners() {
    mongoose.connection.on('connected', () => {
      console.log('🟢 Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('🔴 Mongoose connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🟡 Mongoose disconnected from MongoDB');
      this.isConnected = false;
    });

    // Only add process listeners in non-serverless environment
    if (process.env.NODE_ENV !== 'production') {
      process.on('SIGINT', async () => {
        await this.disconnect();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        await this.disconnect();
        process.exit(0);
      });
    }
  }

  async disconnect() {
    if (!this.isConnected) return;
    try {
      await mongoose.disconnect();
      this.isConnected = false;
      this.connection = null;
      console.log('📴 MongoDB Disconnected Successfully');
    } catch (error) {
      console.error('Error disconnecting:', error.message);
    }
  }

  getConnectionStatus() {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    return {
      state: states[mongoose.connection.readyState],
      isConnected: mongoose.connection.readyState === 1,
      databaseName: mongoose.connection.name
    };
  }

  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { healthy: false, message: 'Database not connected' };
      }
      await mongoose.connection.db.admin().ping();
      return {
        healthy: true,
        message: 'Database is healthy',
        status: this.getConnectionStatus()
      };
    } catch (error) {
      return { healthy: false, message: error.message };
    }
  }

  async createIndexes() {
    try {
      if (!this.isConnected) return false;

      const User = require('./models/user');

      await User.collection.createIndex({ username: 1 }, { unique: true });
      await User.collection.createIndex({ email: 1 }, { unique: true });
      await User.collection.createIndex({ createdAt: -1 });
      await User.collection.createIndex({ 'loginHistory.timestamp': -1 });

      console.log('✅ Database indexes created successfully');
      return true;
    } catch (error) {
      console.error('Error creating indexes:', error.message);
      return false;
    }
  }
}

// For Vercel serverless, we need to cache the connection
let cached = global.mongooseDb;

if (!cached) {
  cached = global.mongooseDb = { conn: null, promise: null };
}

async function getDbConnection() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const db = new Database();
    cached.promise = db.connect().then((connection) => {
      return connection;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// Export both the class and the cached connection function
module.exports = new Database();
module.exports.getDbConnection = getDbConnection;
