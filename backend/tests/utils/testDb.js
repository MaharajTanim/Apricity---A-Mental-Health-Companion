/**
 * Test Database Setup Utilities
 *
 * Provides in-memory MongoDB instance for testing using mongodb-memory-server.
 * This allows tests to run without requiring an actual MongoDB installation.
 */

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;

/**
 * Connect to in-memory database
 * Creates a new MongoMemoryServer instance and connects mongoose to it
 */
const connect = async () => {
  // Disconnect any existing connection
  await mongoose.disconnect();

  // Create in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Connect mongoose to the in-memory database
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log("✓ Connected to in-memory MongoDB");
};

/**
 * Close database connection and stop server
 */
const closeDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }

  if (mongoServer) {
    await mongoServer.stop();
  }

  console.log("✓ Closed in-memory MongoDB connection");
};

/**
 * Clear all collections in the database
 * Useful for cleaning up between tests
 */
const clearDatabase = async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }

  console.log("✓ Cleared all collections");
};

/**
 * Drop all collections in the database
 * More thorough cleanup than clearDatabase
 */
const dropCollections = async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    const collection = collections[key];
    try {
      await collection.drop();
    } catch (error) {
      // Collection doesn't exist, ignore error
      if (error.message !== "ns not found") {
        throw error;
      }
    }
  }

  console.log("✓ Dropped all collections");
};

module.exports = {
  connect,
  closeDatabase,
  clearDatabase,
  dropCollections,
};
