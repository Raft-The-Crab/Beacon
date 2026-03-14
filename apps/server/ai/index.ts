// Beacon AI System: ClawCloud Connection
// Handles audio/URL extraction via the ClawCloud service.
// Content moderation has been moved to the SWI-Prolog rules engine.
import axios from 'axios';

class ClawCloudAI {
  private clawCloudUrl: string;
  private apiKey: string;

  constructor() {
    this.clawCloudUrl = process.env.CLAWCLOUD_AI_URL || '';
    this.apiKey = process.env.CLAWCLOUD_API_KEY || '';
  }

  async extractAudio(url: string): Promise<{ success: boolean; url?: string; title?: string; error?: string }> {
    if (!this.clawCloudUrl) {
      return { success: false, error: 'CLAWCLOUD_AI_URL not configured' };
    }
    try {
      const response = await axios.post(`${this.clawCloudUrl}/extract`, { url }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 20000
      });
      return response.data;
    } catch (error) {
      console.error('[ClawCloud AI] Extraction error:', error);
      return { success: false, error: 'Extraction service unavailable' };
    }
  }
}

const clawCloudAI = new ClawCloudAI();

export const aiSystem = {
  extractAudio: (url: string) => clawCloudAI.extractAudio(url)
};

