// Elite Fitness - Cloudinary Media Service
const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadImage(filePath, folder = 'elite-fitness', options = {}) {
  try {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      process.env.CLOUDINARY_CLOUD_NAME === 'placeholder'
    ) {
      logger.warn('Cloudinary not configured - returning placeholder URL');
      return { url: '/uploads/placeholder.jpg', publicId: 'placeholder' };
    }

    const result = await cloudinary.uploader.upload(filePath, {
      folder: `elite-fitness/${folder}`,
      ...options,
    });

    return { url: result.secure_url, publicId: result.public_id };
  } catch (error) {
    logger.error('Cloudinary upload error:', error.message);
    throw new Error('Failed to upload image. Please try again.');
  }
}

async function uploadVideo(filePath, folder = 'exercises') {
  try {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      process.env.CLOUDINARY_CLOUD_NAME === 'placeholder'
    ) {
      return { url: '/uploads/placeholder-video.mp4', publicId: 'placeholder' };
    }

    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'video',
      folder: `elite-fitness/${folder}`,
      eager: [{ streaming_profile: 'hd', format: 'm3u8' }],
      eager_async: true,
    });

    return { url: result.secure_url, publicId: result.public_id };
  } catch (error) {
    logger.error('Cloudinary video upload error:', error.message);
    throw new Error('Failed to upload video. Please try again.');
  }
}

async function deleteMedia(publicId) {
  try {
    if (!publicId || publicId === 'placeholder') return true;
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    logger.error('Cloudinary delete error:', error.message);
    return false;
  }
}

module.exports = { uploadImage, uploadVideo, deleteMedia, cloudinary };
