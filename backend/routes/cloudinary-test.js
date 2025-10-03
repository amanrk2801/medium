import express from 'express';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();

// Test Cloudinary connection
router.get('/test-connection', async (req, res) => {
  try {
    // Test Cloudinary connection by getting account details
    const result = await cloudinary.api.ping();
    
    res.json({
      success: true,
      message: 'Cloudinary connection successful',
      status: result.status,
      config: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key_set: !!process.env.CLOUDINARY_API_KEY,
        api_secret_set: !!process.env.CLOUDINARY_API_SECRET
      }
    });
  } catch (error) {
    console.error('Cloudinary connection test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Cloudinary connection failed',
      error: error.message,
      config: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key_set: !!process.env.CLOUDINARY_API_KEY,
        api_secret_set: !!process.env.CLOUDINARY_API_SECRET
      }
    });
  }
});

export default router;