import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { aiManager } from './models/index.js';

export interface VideoModerationResult {
    safe: boolean;
    threats: string[];
    confidence: number;
}

export class VideoProcessor {
    private tempDir: string;

    constructor() {
        this.tempDir = path.join(process.cwd(), 'tmp/video_processing');
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    async processVideo(videoPath: string): Promise<VideoModerationResult> {
        console.log(`[VideoProcessor] Analyzing video: ${videoPath}`);

        const frames = await this.extractFrames(videoPath);
        const threats: Set<string> = new Set();
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

            // Cleanup frame
            fs.unlinkSync(frame);
        }

        return {
            safe: threats.size === 0,
            threats: Array.from(threats),
            confidence: maxConfidence
        };
    }

    private async extractFrames(videoPath: string): Promise<string[]> {
        return new Promise((resolve, reject) => {
            const frames: string[] = [];
            const outputPattern = path.join(this.tempDir, `frame-%d.jpg`);

            ffmpeg(videoPath)
                .screenshots({
                    count: 5, // Extract 5 frames for analysis
                    folder: this.tempDir,
                    filename: 'frame-%d.jpg'
                })
                .on('end', () => {
                    // Collect generated file paths
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
