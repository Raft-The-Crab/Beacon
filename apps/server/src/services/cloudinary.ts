import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { Request } from 'express';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer configuration for memory storage
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max per file (for videos)
    files: 10, // Max 10 files at once
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb) => {
    // Allow images, videos, audio, documents
    const allowedMimes = [
      // Images
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      // Videos
      'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
      // Audio
      'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm',
      // Documents
      'application/pdf', 'text/plain',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

interface UploadOptions {
  folder?: string;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  transformation?: any[];
}

class CloudinaryService {
  async uploadFile(
    file: Express.Multer.File,
    options: UploadOptions = {}
  ): Promise<{
    url: string;
    publicId: string;
    format: string;
    width?: number;
    height?: number;
    size: number;
  }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: options.folder || 'beacon/attachments',
          resource_type: options.resourceType || 'auto',
          transformation: options.transformation,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              format: result.format,
              width: result.width,
              height: result.height,
              size: result.bytes,
            });
          }
        }
      );

      uploadStream.end(file.buffer);
    });
  }

  async uploadAvatar(file: Express.Multer.File, userId: string) {
    return this.uploadFile(file, {
      folder: `beacon/avatars/${userId}`,
      resourceType: 'image',
      transformation: [
        { width: 512, height: 512, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });
  }

  async uploadBanner(file: Express.Multer.File, entityId: string) {
    return this.uploadFile(file, {
      folder: `beacon/banners/${entityId}`,
      resourceType: 'image',
      transformation: [
        { width: 1920, height: 480, crop: 'fill' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });
  }

  async uploadAttachment(file: Express.Multer.File, channelId: string) {
    const isVideo = file.mimetype.startsWith('video/');
    
    return this.uploadFile(file, {
      folder: `beacon/attachments/${channelId}`,
      resourceType: isVideo ? 'video' : 'auto',
      transformation: isVideo
        ? [
            { quality: 'auto', fetch_format: 'auto' },
            { duration: 300 }, // 5 minutes max
          ]
        : undefined,
    });
  }

  async deleteFile(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image') {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      return true;
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      return false;
    }
  }

  async getOptimizedUrl(publicId: string, options: any = {}) {
    return cloudinary.url(publicId, {
      quality: 'auto',
      fetch_format: 'auto',
      ...options,
    });
  }
}

export const cloudinaryService = new CloudinaryService();
