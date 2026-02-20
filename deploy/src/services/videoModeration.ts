import { moderationService } from './moderation';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class VideoModerationService {
  private tempDir: string;

  constructor() {
    this.tempDir = path.join(process.cwd(), 'tmp/videos');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async moderateVideoUrl(url: string, userId: string): Promise<any> {
    const videoPath = path.join(this.tempDir, `${uuidv4()}.mp4`);

    try {
      console.log(`[VideoModeration] Downloading video for review: ${url}`);
      // Download video
      const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
      });

      const writer = fs.createWriteStream(videoPath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      // Run moderation
      const result = await moderationService.checkVideo(videoPath, userId);

      // Cleanup
      if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);

      return result;
    } catch (error) {
      console.error(`[VideoModeration] Error moderating video:`, error);
      if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
      throw error;
    }
  }
}

export const videoModerationService = new VideoModerationService();
