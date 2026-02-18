/**
 * File Upload Service - Cloudinary integration
 */

import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export interface UploadResult {
  url: string;
  secure_url: string;
  public_id: string;
  format: string;
  width?: number;
  height?: number;
  bytes: number;
  resource_type: string;
}

export class FileUploadService {
  /**
   * Upload file to Cloudinary
   */
  async uploadFile(
    buffer: Buffer,
    options: {
      folder?: string;
      resource_type?: 'image' | 'video' | 'raw' | 'auto';
      allowed_formats?: string[];
      max_file_size?: number;
    } = {}
  ): Promise<UploadResult> {
    const {
      folder = 'beacon',
      resource_type = 'auto',
      allowed_formats,
      max_file_size = 50 * 1024 * 1024 // 50MB default
    } = options;

    if (buffer.length > max_file_size) {
      throw new Error(`File size exceeds ${max_file_size / 1024 / 1024}MB limit`);
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type,
          allowed_formats,
          chunk_size: 6000000 // 6MB chunks
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Upload failed'));
          
          resolve({
            url: result.url,
            secure_url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
            resource_type: result.resource_type
          });
        }
      );

      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  }

  /**
   * Upload image with transformations
   */
  async uploadImage(
    buffer: Buffer,
    options: {
      folder?: string;
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
    } = {}
  ): Promise<UploadResult> {
    const {
      folder = 'beacon/images',
    } = options;

    return this.uploadFile(buffer, {
      folder,
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      max_file_size: 10 * 1024 * 1024 // 10MB for images
    });
  }

  /**
   * Upload avatar with circular crop
   */
  async uploadAvatar(buffer: Buffer, userId: string): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'beacon/avatars',
          public_id: `avatar_${userId}`,
          resource_type: 'image',
          transformation: [
            { width: 512, height: 512, crop: 'fill', gravity: 'face' },
            { radius: 'max' },
            { quality: 'auto:good', fetch_format: 'auto' }
          ],
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
          overwrite: true
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Avatar upload failed'));
          
          resolve({
            url: result.url,
            secure_url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
            resource_type: result.resource_type
          });
        }
      );

      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  }

  /**
   * Upload guild icon
   */
  async uploadGuildIcon(buffer: Buffer, guildId: string): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'beacon/guilds',
          public_id: `guild_${guildId}`,
          resource_type: 'image',
          transformation: [
            { width: 512, height: 512, crop: 'fill' },
            { radius: 'max' },
            { quality: 'auto:good', fetch_format: 'auto' }
          ],
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
          overwrite: true
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Guild icon upload failed'));
          
          resolve({
            url: result.url,
            secure_url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
            resource_type: result.resource_type
          });
        }
      );

      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  }

  /**
   * Delete file from Cloudinary
   */
  async deleteFile(publicId: string, resourceType: string = 'image'): Promise<void> {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  }

  /**
   * Get optimized image URL
   */
  getOptimizedUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string;
      format?: string;
    } = {}
  ): string {
    return cloudinary.url(publicId, {
      width: options.width,
      height: options.height,
      crop: options.crop || 'fill',
      quality: options.quality || 'auto:good',
      fetch_format: options.format || 'auto'
    });
  }
}

export const fileUploadService = new FileUploadService();
