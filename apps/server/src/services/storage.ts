import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const accountId = process.env.R2_ACCOUNT_ID || 'dummy-account-id';
const accessKeyId = process.env.R2_ACCESS_KEY_ID || 'dummy-access-key';
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || 'dummy-secret-key';
const bucketName = process.env.R2_BUCKET_NAME || 'beacon-storage';
const publicUrl = process.env.R2_PUBLIC_URL || `https://pub-${accountId}.r2.dev`;

const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId,
        secretAccessKey,
    },
});

export class StorageService {
    /**
     * Uploads a file buffer to Cloudflare R2 via AWS SDK.
     */
    static async uploadFile(buffer: Buffer, filename: string, mimeType?: string): Promise<string> {
        const ext = path.extname(filename);
        const id = uuidv4();
        const storedFilename = `${id}${ext}`;

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: storedFilename,
            Body: buffer,
            ContentType: mimeType || 'application/octet-stream',
        });

        await s3Client.send(command);

        // Return the public URL for the newly uploaded file
        return `${publicUrl}/${storedFilename}`;
    }

    /**
     * Deletes a file from Cloudflare R2.
     */
    static async deleteFile(fileUrl: string): Promise<boolean> {
        try {
            const filename = path.basename(fileUrl);
            const command = new DeleteObjectCommand({
                Bucket: bucketName,
                Key: filename,
            });

            await s3Client.send(command);
            return true;
        } catch (error) {
            console.error('StorageService: Failed to delete file from R2', error);
            return false;
        }
    }

    /**
     * Validates file size and type
     */
    static validateFile(file: Express.Multer.File, maxSizeMB: number = 5): boolean {
        const sizeInMB = file.size / (1024 * 1024);
        if (sizeInMB > maxSizeMB) return false;

        // Allow images only for now
        if (!file.mimetype.startsWith('image/')) return false;

        return true;
    }
}
