import cloudinary from '../config/cloudinary.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if Cloudinary is configured
const isCloudinaryConfigured = () => {
  return process.env.CLOUDINARY_CLOUD_NAME && 
         process.env.CLOUDINARY_API_KEY && 
         process.env.CLOUDINARY_API_SECRET &&
         process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloudinary_name' &&
         process.env.CLOUDINARY_API_KEY !== 'your_cloudinary_api_key' &&
         process.env.CLOUDINARY_API_SECRET !== 'your_cloudinary_api_secret';
};

export const uploadImage = async (file, options = {}) => {
  try {
    console.log('Upload service - File received:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      bufferExists: !!file.buffer,
      bufferLength: file.buffer ? file.buffer.length : 0
    });

    // Validate file buffer
    if (!file.buffer || file.buffer.length === 0) {
      throw new Error('File buffer is empty or missing');
    }

    console.log('Cloudinary config check:', {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY ? 'SET' : 'NOT SET',
      apiSecret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET',
      isConfigured: isCloudinaryConfigured()
    });

    if (isCloudinaryConfigured()) {
      // Use Cloudinary with explicit configuration
      return new Promise((resolve, reject) => {
        // Ensure Cloudinary is configured with current env vars
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        console.log('Preparing Cloudinary upload with file buffer length:', file.buffer ? file.buffer.length : 'no buffer');
        
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: options.folder || 'medium-clone',
            width: options.width || 800,
            height: options.height || 600,
            crop: options.crop || 'fill',
            quality: 'auto'
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(new Error(`Cloudinary upload failed: ${error.message}`));
            } else {
              console.log('Cloudinary upload successful:', result.secure_url);
              resolve({
                public_id: result.public_id,
                url: result.secure_url
              });
            }
          }
        );
        
        if (!file.buffer || file.buffer.length === 0) {
          console.error('File buffer is empty or missing');
          reject(new Error('File buffer is empty or missing'));
          return;
        }
        
        console.log('Sending buffer to Cloudinary, size:', file.buffer.length);
        uploadStream.end(file.buffer);
      });
    } else {
      // Use local storage as fallback
      console.log('Using local storage fallback');
      
      if (!file.buffer) {
        throw new Error('File buffer is missing for local storage');
      }
      
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const filename = `image-${uniqueSuffix}${ext}`;
      const filepath = path.join(uploadsDir, filename);
      
      // Write buffer to file
      await fs.promises.writeFile(filepath, file.buffer);
      
      const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
      return {
        public_id: filename,
        url: `${baseUrl}/uploads/${filename}`
      };
    }
  } catch (error) {
    console.error('Upload service error:', error);
    throw error;
  }
};

export const deleteImage = async (publicId) => {
  if (isCloudinaryConfigured() && publicId && !publicId.includes('image-')) {
    // Cloudinary file
    try {
      await cloudinary.uploader.destroy(publicId);
      console.log('Deleted image from Cloudinary:', publicId);
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
    }
  } else if (publicId && publicId.includes('image-')) {
    // Local file
    try {
      const uploadsDir = path.join(__dirname, '../uploads');
      const filepath = path.join(uploadsDir, publicId);
      
      if (fs.existsSync(filepath)) {
        await fs.promises.unlink(filepath);
        console.log('Deleted local image file:', publicId);
      }
    } catch (error) {
      console.error('Error deleting local image file:', error);
    }
  }
};