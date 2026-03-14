import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import streamifier from 'streamifier';
import { AuthRequest } from '../middleware/auth';
import { StorageService } from './storage';

// Primary Config
const primaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
};

// Secondary Config (Failover)
const secondaryUrl = process.env.CLOUDINARY_URL_SECONDARY;

export interface UploadResult {
  url: string;
  secure_url: string;
  public_id: string;
  format: string;
  width?: number;
  height?: number;
  bytes: number;
  resource_type: string;
  r2_backup_url?: string;
}

export class FileUploadService {
  private currentProvider: 'primary' | 'secondary' = 'primary';
  private readonly r2BackupEnabled = (process.env.R2_BACKUP_ENABLED || 'true').toLowerCase() !== 'false';

  constructor() {
    this.configurePrimary();
  }

  private configurePrimary() {
    cloudinary.config(primaryConfig);
    this.currentProvider = 'primary';
  }

  private configureSecondary() {
    if (secondaryUrl) {
      cloudinary.config({ cloudinary_url: secondaryUrl });
      this.currentProvider = 'secondary';
      console.warn('⚠️ Cloudinary failover: Switched to secondary provider');
    }
  }

  /**
   * Internal upload implementation with retry logic
   */
  private async executeUpload(
    buffer: Buffer,
    options: any
  ): Promise<UploadApiResponse> {
    try {
      return await this.performUpload(buffer, options);
    } catch (error) {
      if (this.currentProvider === 'primary' && secondaryUrl) {
        this.configureSecondary();
        return await this.performUpload(buffer, options);
      }
      throw error;
    }
  }

  private performUpload(buffer: Buffer, options: any): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Upload failed'));
          resolve(result);
        }
      );
      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  }

  private inferMimeType(resourceType: string, format: string): string {
    const safeFormat = String(format || '').toLowerCase();
    if (resourceType === 'image') return `image/${safeFormat || 'jpeg'}`;
    if (resourceType === 'video') return `video/${safeFormat || 'mp4'}`;
    return 'application/octet-stream';
  }

  /**
   * General file upload
   */
  async uploadFile(
    buffer: Buffer,
    options: {
      folder?: string;
      resource_type?: 'image' | 'video' | 'raw' | 'auto';
      allowed_formats?: string[];
      max_file_size?: number;
      transformation?: any[];
    } = {}
  ): Promise<UploadResult> {
    const {
      folder = 'beacon/uploads',
      resource_type = 'auto',
      allowed_formats,
      max_file_size = 50 * 1024 * 1024,
      transformation
    } = options;

    if (buffer.length > max_file_size) {
      throw new Error(`File size exceeds ${max_file_size / (1024 * 1024)}MB limit`);
    }

    const result = await this.executeUpload(buffer, {
      folder,
      resource_type,
      allowed_formats,
      transformation,
      chunk_size: 6000000 // 6MB chunks for reliability
    });

    let r2BackupUrl: string | undefined;
    if (this.r2BackupEnabled && StorageService.isConfigured()) {
      try {
        const ext = result.format ? `.${result.format}` : '';
        const filename = `${result.public_id.replace(/[^a-zA-Z0-9/_-]/g, '_')}${ext}`;
        r2BackupUrl = await StorageService.uploadFile(
          buffer,
          filename,
          this.inferMimeType(result.resource_type, result.format)
        );
      } catch (backupError) {
        console.warn('[UploadService] R2 backup upload failed:', backupError);
      }
    }

    return {
      url: result.url,
      secure_url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      resource_type: result.resource_type,
      r2_backup_url: r2BackupUrl,
    };
  }

  /**
   * User avatar upload (optimized)
   */
  async uploadAvatar(buffer: Buffer, userId: string): Promise<UploadResult> {
    return this.uploadFile(buffer, {
      folder: 'beacon/avatars',
      resource_type: 'image',
      transformation: [
        { width: 512, height: 512, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' }
      ],
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
    });
  }

  /**
   * Guild icon upload
   */
  async uploadGuildIcon(buffer: Buffer, guildId: string): Promise<UploadResult> {
    return this.uploadFile(buffer, {
      folder: 'beacon/guilds',
      resource_type: 'image',
      transformation: [
        { width: 512, height: 512, crop: 'fill' },
        { quality: 'auto', fetch_format: 'auto' }
      ],
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
    });
  }

  /**
   * Delete file from Cloudinary
   */
  async deleteFile(publicId: string, resourceType: string = 'image'): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (error) {
      console.error('[UploadService] Delete failed:', error);
    }
  }
}

export const fileUploadService = new FileUploadService();
