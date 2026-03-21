import { v2 as cloudinary } from 'cloudinary';
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function clearCloudinary() {
  try {
    const result = await cloudinary.api.delete_resources_by_prefix('beacon/');
    console.log('Cloudinary clear result:', result);
  } catch(e) {
    console.error('Cloudinary delete error:', e);
  }
}

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || 'https://ce5094f80c8353520bdc4ec96628e6c5.r2.cloudflarestorage.com',
  credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

async function clearR2() {
  try {
    const bucket = process.env.R2_BUCKET_NAME || 'beaconstorage';
    const listCmd = new ListObjectsV2Command({ Bucket: bucket });
    const { Contents } = await s3Client.send(listCmd);

    if (!Contents || Contents.length === 0) {
      console.log('R2 bucket is already empty');
      return;
    }

    const deleteCmd = new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: { Objects: Contents.map(c => ({ Key: c.Key })) }
    });
    await s3Client.send(deleteCmd);
    console.log(`R2 cleared ${Contents.length} items`);
  } catch (e) {
    console.error('R2 delete error:', e);
  }
}

async function run() {
  console.log('Starting bucket purge...');
  await clearCloudinary();
  await clearR2();
  console.log('Done.');
}

run();
