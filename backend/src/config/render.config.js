// Configuration for render.com deployment
module.exports = {
  // Log configuration
  debug: process.env.DEBUG === 'true',
  
  // Mongo configuration for render.com
  // This is used to adjust connection parameters based on render.com environment
  mongodb: {
    // Use the MONGODB_URI environment variable provided by render.com
    uri: process.env.MONGODB_URI,
    
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
    }
  }
}; 