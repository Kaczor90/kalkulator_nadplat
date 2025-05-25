const mongoose = require('mongoose');

console.log('Testing MongoDB connection directly...');

// Get MongoDB URI from environment
const mongoUri = process.env.MONGODB_URI;
console.log('MongoDB URI:', mongoUri ? mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//\\1:***@') : 'NOT SET');

if (!mongoUri) {
  console.error('MONGODB_URI environment variable is not set');
  process.exit(1);
}

// Connection options
const options = {
  connectTimeoutMS: 30000,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 60000,
  heartbeatFrequencyMS: 30000,
  tls: true,
  retryWrites: true,
  retryReads: true,
};

console.log('Connection options:', JSON.stringify(options, null, 2));

// Connect to MongoDB
mongoose.connect(mongoUri, options)
  .then(async () => {
    console.log('✅ MongoDB connection successful!');
    
    // Get connection details
    const connection = mongoose.connection;
    console.log('Connection details:');
    console.log('- Ready State:', connection.readyState);
    console.log('- Ready State Text:', getReadyStateText(connection.readyState));
    console.log('- Host:', connection.host || 'unknown');
    console.log('- Port:', connection.port || 'unknown');
    console.log('- Database:', connection.name || 'unknown');
    console.log('- Using Atlas:', mongoUri.includes('mongodb+srv'));
    
    // Try to list collections
    try {
      const collections = await connection.db.listCollections().toArray();
      console.log('Available collections:', collections.map(c => c.name).join(', ') || 'none');
    } catch (error) {
      console.error('Error listing collections:', error.message);
    }
    
    // Close connection
    await mongoose.disconnect();
    console.log('Connection closed');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

function getReadyStateText(state) {
  switch (state) {
    case 0: return 'disconnected';
    case 1: return 'connected';
    case 2: return 'connecting';
    case 3: return 'disconnecting';
    default: return 'unknown';
  }
} 