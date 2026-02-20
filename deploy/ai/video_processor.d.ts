export interface VideoModerationResult {
    safe: boolean;
    threats: string[];
    confidence: number;
}
export declare class VideoProcessor {
    private tempDir;
    constructor();
    processVideo(videoPath: string): Promise<VideoModerationResult>;
    private extractFrames;
}
export declare const videoProcessor: VideoProcessor;
//# sourceMappingURL=video_processor.d.ts.map