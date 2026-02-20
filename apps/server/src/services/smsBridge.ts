import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import pako from 'pako'

/**
 * Beacon SMS Bridge - Standalone High-Performance Node Service
 * Designed for ClawCloud OS direct execution.
 * Handles Zero-Data JSON-over-SMS protocol (Sovereignty Level 3).
 */

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
})

app.use(cors())
app.use(express.json({ limit: '50mb' }))

const PORT = process.env.BRIDGE_PORT || 3005
const SOVEREIGNTY_LEVEL = Number(process.env.SOVEREIGNTY_LEVEL) || 3

// Extreme Payload Compression (Sovereignty Level 3)
function compress(data: any): string {
    const json = JSON.stringify(data)
    const compressed = pako.deflate(json)
    return Buffer.from(compressed).toString('base64')
}

function decompress(encoded: string): any {
    const binary = Buffer.from(encoded, 'base64')
    const decompressed = pako.inflate(binary, { to: 'string' })
    return JSON.parse(decompressed)
}

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'operational', bridge: 'beacon-sms-bridge', sovereignty: SOVEREIGNTY_LEVEL })
})

// Simulated SMS Inbound
app.post('/sms/inbound', (req, res) => {
    const { from, body } = req.body
    console.log(`[SMS] Received from ${from}: ${body.length} chars`)

    try {
        const payload = decompress(body)
        console.log(`[SMS] Decompressed:`, payload)

        // Broadcast to connected web clients
        io.emit('bridged_event', { from, payload })
        res.status(200).send('OK')
    } catch (err) {
        console.error(`[SMS] Failed to decompress payload:`, err)
        res.status(400).send('INVALID_FORMAT')
    }
})

io.on('connection', (socket) => {
    console.log(`[Bridge] Client connected: ${socket.id}`)

    socket.on('send_sms', (data) => {
        const { to, payload } = data
        console.log(`[SMS] Outbound to ${to}:`, payload)
        const compressed = compress(payload)
        console.log(`[SMS] Final Payload (${compressed.length} chars): ${compressed}`)

        // In a real scenario, this would call an SMS Gateway (Twilio/Vonage)
        // For ClawCloud Bridge, we emit back for the local logs or gateway hook
        io.emit('sms_outbound_status', { to, payload: compressed, status: 'queued' })
    })

    socket.on('disconnect', () => {
        console.log(`[Bridge] Client disconnected: ${socket.id}`)
    })
})

httpServer.listen(PORT, () => {
    console.log(`\n🚀 Beacon SMS Bridge Running on Port ${PORT}`)
    console.log(`🛡️ Sovereignty Level: ${SOVEREIGNTY_LEVEL}`)
    console.log(`🔗 URL: http://localhost:${PORT}`)
})
