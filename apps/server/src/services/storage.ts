import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const providedEndpoint = process.env.R2_ENDPOINT_URL || 'https://ce5094f80c8353520bdc4ec96628e6c5.r2.cloudflarestorage.com/beaconstorage';
const parsedEndpoint = (() => {
    try {
        return new URL(providedEndpoint);
    } catch {
        return null;
    }
})();

const accountId = process.env.R2_ACCOUNT_ID || parsedEndpoint?.hostname.split('.')[0] || '';
const accessKeyId = process.env.R2_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';
const bucketFromEndpoint = parsedEndpoint?.pathname?.replace(/^\/+/, '').split('/')[0] || '';
const bucketName = process.env.R2_BUCKET_NAME || bucketFromEndpoint || 'beaconstorage';
const endpoint = process.env.R2_ENDPOINT || (parsedEndpoint ? `${parsedEndpoint.protocol}//${parsedEndpoint.host}` : `https://${accountId}.r2.cloudflarestorage.com`);
const publicUrl = process.env.R2_PUBLIC_URL || `${endpoint}/${bucketName}`;

const r2Configured = Boolean(accessKeyId && secretAccessKey && endpoint && bucketName);

const s3Client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
        accessKeyId,
        secretAccessKey,
    },
});

export class StorageService {
    static isConfigured(): boolean {
        return r2Configured;
    }

    /**
     * Uploads a file buffer to Cloudflare R2 via AWS SDK.
     */
    static async uploadFile(buffer: Buffer, filename: string, mimeType?: string): Promise<string> {
        if (!r2Configured) {
            throw new Error('R2 storage is not configured');
        }

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
