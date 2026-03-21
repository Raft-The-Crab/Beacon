import express, { Response } from 'express'
import multer from 'multer'
import { authenticate, AuthRequest } from '../middleware/auth'
import { prisma } from '../db'
import { priorityQueue } from '../services/priorityQueue'
import { fileUploadService } from '../services/upload'
import rateLimit from 'express-rate-limit'

const router = express.Router()

// Strict upload rate limiting to save storage/bandwidth
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 30, // Limit each IP to 30 uploads per window
  message: { error: 'Upload rate limit exceeded. Please wait 15 minutes.' }
})

const upload = multer({
  storage: multer.memoryStorage()
})

/**
 * Upload a file — QUEUED processing.
 */
router.post('/upload', authenticate as any, uploadLimiter, async (req: AuthRequest, res: Response) => {
  upload.single('file')(req, res, async (err: any) => {
    if (err) return res.status(400).json({ error: 'Multer error: ' + err.message })
    const file = req.file as Express.Multer.File
    if (!file) return res.status(400).json({ error: 'No file provided' })

    const userId = req.user?.id || 'unknown'
    const fileSizeMB = file.size / 1024 / 1024

    // Dynamic Limits: Check Beacon+ status
    let maxLimitMB = 10
    try {
      if (prisma) {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { isBeaconPlus: true } })
        if (user?.isBeaconPlus) maxLimitMB = 500
      }
    } catch (e) {
      console.error('Failed to check Beacon+ status for upload limit:', e)
    }

    if (fileSizeMB > maxLimitMB) {
      return res.status(413).json({ error: `File too large. Your limit is ${maxLimitMB}MB.` })
    }

    // Small files: upload immediately (fast path)
    if (fileSizeMB < 5) {
      try {
        const result = await fileUploadService.uploadFile(file.buffer, {
          folder: 'beacon_uploads',
          resource_type: 'auto'
        })
        return res.json(result)
      } catch (err) {
        console.error('[Media] Upload failed:', err)
        return res.status(500).json({ error: 'Upload failed' })
      }
    }

    // Large files: queue for background processing (slow lane)
    const jobId = priorityQueue.enqueue('media_upload', {
      buffer: file.buffer.toString('base64'),
      userId,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size
    })

    res.status(202).json({
      accepted: true,
      jobId,
      message: 'File queued for processing. Check status at /api/media/status/:jobId',
      estimatedSize: `${fileSizeMB.toFixed(1)} MB`
    })
  })
})

/**
 * Check upload job status
 */
router.get('/status/:jobId', authenticate, async (req: AuthRequest, res: Response) => {
  const stats = priorityQueue.getStats()
  res.json({
    jobId: req.params.jobId,
    queueLength: stats.slowPending,
    processing: stats.slowProcessing,
  })
})

/**
 * Get queue stats (admin/debug)
 */
router.get('/queue-stats', authenticate, (_req: AuthRequest, res: Response) => {
  res.json(priorityQueue.getStats())
})

// Register the media upload handler with the priority queue
priorityQueue.register('media_upload', async (job) => {
  const { buffer: base64Buffer, userId, mimeType } = job.data
  const fileBuffer = Buffer.from(base64Buffer, 'base64')

  console.log(`[Queue:Media] Processing upload for ${userId} (${(fileBuffer.length / 1024 / 1024).toFixed(1)} MB, ${mimeType})`)

  const result = await fileUploadService.uploadFile(fileBuffer, {
    folder: 'beacon_uploads',
    resource_type: 'auto'
  })
  console.log(`[Queue:Media] ✅ Upload complete: ${result.public_id}`)
  return result
})

export default router
