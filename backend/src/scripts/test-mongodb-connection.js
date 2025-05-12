/**
 * MongoDB Connection Test Script
 * 
 * This script tests a MongoDB connection outside of the NestJS framework.
 * It helps diagnose connection issues with MongoDB Atlas or other MongoDB instances.
 * 
 * Run with: 
 * node test-mongodb-connection.js
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load environment variables
try {
  require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
} catch (error) {
  console.log('No .env file found, using environment variables');
}

// Get MongoDB URI from environment variable
let mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('MONGODB_URI environment variable is not set');
  process.exit(1);
}

// Replace password placeholder if needed
if (mongoUri.includes('<MONGODB_PASSWORD>') && process.env.MONGODB_PASSWORD) {
  mongoUri = mongoUri.replace('<MONGODB_PASSWORD>', process.env.MONGODB_PASSWORD);
}

// Redact password for logging
const redactedUri = mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//\\1:***@');
console.log(`Attempting to connect to MongoDB: ${redactedUri}`);

// Configure Mongoose
mongoose.set('debug', true);
console.log('Mongoose debug mode enabled');

// Connection options
const mongooseOptions = {
  connectTimeoutMS: 30000,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 60000,
  heartbeatFrequencyMS: 30000,
  tls: true,
  retryWrites: true,
  retryReads: true,
};

console.log('Using connection options:', JSON.stringify(mongooseOptions, null, 2));

// Set up event handlers
mongoose.connection.on('connected', () => {
  console.log('MongoDB connection established successfully');
  console.log(`Connected to MongoDB at ${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}`);
});

mongoose.connection.on('error', (err) => {
  console.error(`MongoDB connection error: ${err.message}`);
  
  // Log more specific error information
  if (err.message && err.message.includes('ENOTFOUND')) {
    console.error('DNS resolution failed. Check your MongoDB hostname and network connection.');
  } else if (err.message && err.message.includes('authentication failed')) {
    console.error('Authentication failed. Check your MongoDB username and password.');
  } else if (err.message && err.message.includes('timed out')) {
    console.error('Connection timed out. Check your network or firewall settings.');
  }
  
  console.error(err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB connection disconnected');
});

// Connect to MongoDB
mongoose.connect(mongoUri, mongooseOptions)
  .then(async () => {
    console.log('Connection successful!');
    
    // Try to run a simple query
    try {
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log(`Available collections: ${collections.map(c => c.name).join(', ')}`);
    } catch (error) {
      console.error('Error listing collections:', error);
    }
    
    // Close connection after tests
    setTimeout(() => {
      mongoose.disconnect()
        .then(() => {
          console.log('Connection closed successfully');
          process.exit(0);
        })
        .catch(err => {
          console.error('Error closing connection:', err);
          process.exit(1);
        });
    }, 5000);
  })
  .catch(err => {
    console.error('Connection failed:', err);
    process.exit(1);
  }); 