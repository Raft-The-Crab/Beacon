import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { aiManager } from './models/index.js';
export class VideoProcessor {
    tempDir;
    constructor() {
        this.tempDir = path.join(process.cwd(), 'tmp/video_processing');
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }
    async processVideo(videoPath) {
        console.log(`[VideoProcessor] Analyzing video: ${videoPath}`);
        const frames = await this.extractFrames(videoPath);
        const threats = new Set();
        let maxConfidence = 0;
        for (const frame of frames) {
            const frameBuffer = fs.readFileSync(frame);
            const results = await aiManager.analyzeImage(frameBuffer);
            for (const res of results) {
                threats.add(res.className);
                if (res.probability > maxConfidence) {
                    maxConfidence = res.probability;
                }
            }
            fs.unlinkSync(frame);
        }
        return {
            safe: threats.size === 0,
            threats: Array.from(threats),
            confidence: maxConfidence
        };
    }
    async extractFrames(videoPath) {
        return new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .screenshots({
                count: 5,
                folder: this.tempDir,
                filename: 'frame-%d.jpg'
            })
                .on('end', () => {
                const files = fs.readdirSync(this.tempDir)
                    .filter(f => f.startsWith('frame-'))
                    .map(f => path.join(this.tempDir, f));
                resolve(files);
            })
                .on('error', reject);
        });
    }
}
export const videoProcessor = new VideoProcessor();
//# sourceMappingURL=video_processor.js.map