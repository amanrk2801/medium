import express from 'express';
import smartUpload from '../middleware/smartUpload.js';
import { uploadImage } from '../services/uploadService.js';

const router = express.Router();

// Test image upload endpoint
router.post('/upload', smartUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No file uploaded' 
      });
    }

    const result = await uploadImage(req.file, {
      folder: 'test-uploads',
      width: 400,
      height: 300
    });

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      file: {
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: result.url,
        public_id: result.public_id
      }
    });
  } catch (error) {
    console.error('Test upload error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Upload failed',
      error: error.message 
    });
  }
});

export default router;