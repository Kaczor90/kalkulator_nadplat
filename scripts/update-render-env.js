/**
 * Update Render.com Environment Variables
 * 
 * This script uses the Render API to update environment variables
 * for your application. This can be useful to update the MongoDB connection
 * string without having to redeploy the entire application.
 * 
 * Prerequisites:
 * 1. Install required packages: npm install node-fetch dotenv
 * 2. Create a Render API key at https://render.com/docs/api
 * 3. Create a .env file with:
 *    - RENDER_API_KEY=your_render_api_key
 *    - RENDER_SERVICE_ID=your_service_id (from the URL of your service)
 * 
 * Usage:
 * node update-render-env.js
 */

require('dotenv').config();
const fetch = require('node-fetch');

// Get environment variables
const RENDER_API_KEY = process.env.RENDER_API_KEY;
const RENDER_SERVICE_ID = process.env.RENDER_SERVICE_ID;
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;

// Check if required environment variables are set
if (!RENDER_API_KEY || !RENDER_SERVICE_ID) {
  console.error('Missing required environment variables: RENDER_API_KEY and RENDER_SERVICE_ID');
  console.error('Please set these in your .env file');
  process.exit(1);
}

// Function to update environment variables on Render.com
async function updateRenderEnvVars() {
  try {
    console.log('Fetching current environment variables from Render.com...');
    
    // First, get current environment variables
    const getResponse = await fetch(
      `https://api.render.com/v1/services/${RENDER_SERVICE_ID}/env-vars`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${RENDER_API_KEY}`
        }
      }
    );
    
    if (!getResponse.ok) {
      const errorText = await getResponse.text();
      console.error(`Failed to get environment variables: ${getResponse.status} ${getResponse.statusText}`);
      console.error(errorText);
      process.exit(1);
    }
    
    const currentEnvVars = await getResponse.json();
    console.log(`Found ${currentEnvVars.length} existing environment variables`);
    
    // Prepare environment variables to update
    const envVarsToUpdate = [];
    
    // Update or add MongoDB URI if provided
    if (MONGODB_URI) {
      const existingMongoDbUri = currentEnvVars.find(env => env.key === 'MONGODB_URI');
      if (existingMongoDbUri) {
        console.log('Updating existing MONGODB_URI');
        envVarsToUpdate.push({
          key: 'MONGODB_URI',
          value: MONGODB_URI
        });
      } else {
        console.log('Adding new MONGODB_URI');
        envVarsToUpdate.push({
          key: 'MONGODB_URI',
          value: MONGODB_URI
        });
      }
    }
    
    // Update or add MongoDB password if provided
    if (MONGODB_PASSWORD) {
      const existingMongoDbPassword = currentEnvVars.find(env => env.key === 'MONGODB_PASSWORD');
      if (existingMongoDbPassword) {
        console.log('Updating existing MONGODB_PASSWORD');
        envVarsToUpdate.push({
          key: 'MONGODB_PASSWORD',
          value: MONGODB_PASSWORD
        });
      } else {
        console.log('Adding new MONGODB_PASSWORD');
        envVarsToUpdate.push({
          key: 'MONGODB_PASSWORD',
          value: MONGODB_PASSWORD
        });
      }
    }
    
    // Check if we have anything to update
    if (envVarsToUpdate.length === 0) {
      console.log('No environment variables to update');
      process.exit(0);
    }
    
    // Update environment variables
    console.log('Updating environment variables on Render.com...');
    const updateResponse = await fetch(
      `https://api.render.com/v1/services/${RENDER_SERVICE_ID}/env-vars`,
      {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RENDER_API_KEY}`
        },
        body: JSON.stringify(envVarsToUpdate)
      }
    );
    
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error(`Failed to update environment variables: ${updateResponse.status} ${updateResponse.statusText}`);
      console.error(errorText);
      process.exit(1);
    }
    
    const result = await updateResponse.json();
    console.log('Environment variables updated successfully:');
    console.log(`Updated ${result.length} environment variables`);
    
    console.log('\nIMPORTANT: You need to redeploy your service for these changes to take effect!');
    console.log('You can do this from the Render.com dashboard or via the API.');
    
  } catch (error) {
    console.error('Error updating environment variables:', error);
    process.exit(1);
  }
}

// Run the update function
updateRenderEnvVars(); 