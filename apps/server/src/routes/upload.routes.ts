import { Router, Response } from 'express'
import multer from 'multer'
import { authenticate, AuthRequest } from '../middleware/auth'
import { fileUploadService } from '../services/upload'

const router = Router()
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
})

// POST /api/upload — General file upload
router.post('/', authenticate as any, upload.single('file'), (async (req: any, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' })
        }

        const userId = req.user?.id
        if (!userId) return res.status(401).json({ error: 'Unauthorized' })
        const folder = req.body.folder || 'beacon/uploads'

        const result = await fileUploadService.uploadFile(req.file.buffer, {
            folder,
            resource_type: 'auto'
        })

        res.json(result)
    } catch (error) {
        console.error('[UPLOAD]', error)
        res.status(500).json({ error: 'Upload failed', details: error instanceof Error ? error.message : String(error) })
    }
}) as any)

// POST /api/upload/avatar — Avatar upload with face-crop
router.post('/avatar', authenticate as any, upload.single('file'), (async (req: any, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' })
        }

        const userId = req.user?.id
        if (!userId) return res.status(401).json({ error: 'Unauthorized' })
        const result = await fileUploadService.uploadAvatar(req.file.buffer, userId)

        res.json(result)
    } catch (error) {
        console.error('[UPLOAD_AVATAR]', error)
        res.status(500).json({ error: 'Avatar upload failed' })
    }
}) as any)

export default router
