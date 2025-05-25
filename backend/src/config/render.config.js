// Configuration for render.com deployment
module.exports = {
  // Log configuration
  debug: process.env.DEBUG === 'true',
  
  // Mongo configuration for render.com
  // This is used to adjust connection parameters based on render.com environment
  mongodb: {
    // MongoDB Atlas connection string
    uri: process.env.MONGODB_URI || "mongodb+srv://radekdsa:<MONGODB_PASSWORD>@cluster0.h9egut1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    
    // Add options specific to render.com deployment
    options: {
      // Connection timeout and retry settings
      connectTimeoutMS: 30000, // Increased for render.com
      serverSelectionTimeoutMS: 30000, // Increased for render.com
      socketTimeoutMS: 60000, // Increased for render.com
      heartbeatFrequencyMS: 30000, // Increased for render.com
      
      // MongoDB Atlas specific settings
      tls: true, // Enable TLS for secure connections
      tlsAllowInvalidCertificates: false,
      retryWrites: true,
      retryReads: true,
      maxPoolSize: 10, // Limit connection pool size for render.com
      minPoolSize: 1,
      maxIdleTimeMS: 45000, // Close idle connections after 45 seconds
      
      // ServerApi configuration from the provided example
      serverApi: {
        version: '1', // ServerApiVersion.v1
        strict: true,
        deprecationErrors: true
      }
    }
  }
};

// Add some resilience - if this file is directly required and fails to load
try {
  // Let caller know we loaded successfully
  module.exports.__loaded = true;
} catch (e) {
  // This is to prevent any errors when this file is loaded
  console.error('Error in render.config.js:', e);
} 