const mongoose = require("mongoose");
const logger = console;

/**
 * Connect to MongoDB using Mongoose
 * Reads connection URI from environment variables
 */
const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      "mongodb://localhost:27017/apricity";

    // Use TLS only for MongoDB Atlas (mongodb+srv://)
    const isAtlas = mongoURI.includes("mongodb+srv://");

    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      ...(isAtlas && {
        tls: true,
        tlsAllowInvalidCertificates: false,
      }),
    };

    const conn = await mongoose.connect(mongoURI, options);

    logger.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    logger.log(`📊 Database: ${conn.connection.name}`);

    // Connection event handlers
    mongoose.connection.on("error", (err) => {
      logger.error(`❌ MongoDB connection error: ${err}`);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("⚠️  MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      logger.log("🔄 MongoDB reconnected");
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      logger.log("MongoDB connection closed through app termination");
      process.exit(0);
    });

    return conn;
  } catch (error) {
    logger.error(`❌ Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Disconnect from MongoDB
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    logger.log("MongoDB connection closed");
  } catch (error) {
    logger.error(`Error disconnecting from MongoDB: ${error.message}`);
    throw error;
  }
};

/**
 * Check if MongoDB is connected
 */
const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

module.exports = {
  connectDB,
  disconnectDB,
  isConnected,
  mongoose,
};
