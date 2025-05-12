# MongoDB Setup Guide for Render.com

This document provides step-by-step instructions to set up MongoDB Atlas with your render.com deployment.

## MongoDB Atlas Connection String

We're using the following MongoDB Atlas connection string:

```
mongodb+srv://radekdsa:<PASSWORD>@cluster0.h9egut1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

## Setup Steps

### 1. Set up Environment Variables in Render.com

1. Go to your service dashboard in render.com
2. Navigate to the "Environment" tab
3. Add the following environment variables:

   | Key | Value |
   | --- | --- |
   | `MONGODB_URI` | `mongodb+srv://radekdsa:<MONGODB_PASSWORD>@cluster0.h9egut1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0` |
   | `MONGODB_PASSWORD` | `Kaczor1990!@#` |
   | `DEBUG` | `true` |
   | `MONGOOSE_DEBUG` | `true` |
   | `TZ` | `UTC` |

4. Click "Save Changes"
5. Redeploy your application for these changes to take effect

### 2. Test the MongoDB Connection

You can test your MongoDB connection by navigating to the `/api/health` endpoint of your application. This will show the current connection status and details.

If you're developing locally, you can also use the test script:

```bash
cd backend
node src/scripts/test-mongodb-connection.js
```

### 3. Troubleshooting Connection Issues

If you continue to experience connection issues:

1. **Check your password**: Ensure your MongoDB Atlas password is correct and doesn't contain special characters that might need URL encoding
2. **Network Access**: Verify that your render.com IP addresses are whitelisted in MongoDB Atlas network access
3. **MongoDB User**: Confirm that your MongoDB user has the appropriate permissions
4. **Check Logs**: In render.com dashboard, check the logs for detailed error messages
5. **Try with TLS disabled**: If you're experiencing TLS issues, you can modify `backend/src/config/render.config.js` to set `tls: false`

### 4. MongoDB Atlas Configuration

Make sure your MongoDB Atlas cluster has:

1. Your render.com IP addresses whitelisted in Network Access
2. A database user with appropriate privileges
3. The correct database name ('mortgage-calculator' by default)

## Additional Information

The application is configured to log detailed MongoDB connection information and errors to help diagnose issues.

You can find these logs in your render.com service logs under the "Logs" tab. 