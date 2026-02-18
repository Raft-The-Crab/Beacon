import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export class StorageService {
    /**
     * Uploads a file buffer to storage.
     * Currently supports local storage.
     */
    static async uploadFile(buffer: Buffer, filename: string): Promise<string> {
        const ext = path.extname(filename);
        const id = uuidv4();
        const storedFilename = `${id}${ext}`;
        const filePath = path.join(UPLOAD_DIR, storedFilename);

        await fs.promises.writeFile(filePath, buffer);

        // Return the public URL path (assumes /uploads is served statically)
        return `/uploads/${storedFilename}`;
    }

    /**
     * Deletes a file from storage.
     */
    static async deleteFile(fileUrl: string): Promise<boolean> {
        try {
            const filename = path.basename(fileUrl);
            const filePath = path.join(UPLOAD_DIR, filename);

            if (fs.existsSync(filePath)) {
                await fs.promises.unlink(filePath);
                return true;
            }
            return false;
        } catch (error) {
            console.error('StorageService: Failed to delete file', error);
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
