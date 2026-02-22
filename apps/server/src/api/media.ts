import { Router } from 'express'
import multer from 'multer'
import { media as cloudinary } from '../media'
import streamifier from 'streamifier'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()

// Configure Multer (Memory Storage for now, or Disk if large files)
// For 500MB limit, disk storage is safer, but railway ephemeral disk is small.
// Let's use memory with a limit, or pass through.
// Cloudinary supports direct upload but exposing a signed URL is better for large files.
// For simplicity here, we'll accept file and stream it.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB
  }
})

router.post('/upload', authenticate, upload.single('file'), (req: AuthRequest, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file provided' })
    return;
  }

  const stream = cloudinary.uploader.upload_stream(
    {
      resource_type: 'auto', // Detect image/video/raw
      folder: 'beacon_uploads',
      public_id: `${req.user!.id}_${Date.now()}`
    },
    (error, result) => {
      if (error) {
        console.error('Cloudinary upload error:', error)
        res.status(500).json({ error: 'Upload failed' })
        return;
      }
      res.json({
        url: result?.secure_url,
        public_id: result?.public_id,
        format: result?.format,
        width: result?.width,
        height: result?.height,
        resource_type: result?.resource_type
      })
      return;
    }
  )

  streamifier.createReadStream(req.file.buffer).pipe(stream)
})

export default router
