import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Import the Jest global object and set it to the global environment
import { jest } from '@jest/globals';
global.jest = jest;

// Connecting to an in-memory database
let mongod;

export const connectDB = async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  
  const mongooseOpts = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };

  await mongoose.connect(uri, mongooseOpts);
};

// Clear all collections in the database
export const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

// Close the database connection and stop the server
export const closeDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
};

// Generate a test JWT token
export const generateTestToken = async (userId) => {
  const jwt = await import('jsonwebtoken');
  return jwt.default.sign(
    { id: userId }, 
    process.env.JWT_SECRET || 'testsecret', 
    { expiresIn: '1h' }
  );
}; 