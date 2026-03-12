// Beacon AI System: ClawCloud Connection
// Railway runs main server, ClawCloud handles AI processing
import { ModerationResult } from '../src/services/moderation';
import axios from 'axios';
import { getProfile } from '../src/utils/autoTune';

interface AIRequest {
  id: string;
  content: string;
  type: 'text' | 'image' | 'video';
  context?: any;
  timestamp: number;
  userId?: string;
}

interface AIResponse {
  illegal_score: number;
  categories: string[];
  confidence: number;
  is_joke: boolean;
}

class ClawCloudAI {
  private clawCloudUrl: string;
  private apiKey: string;

  constructor() {
    this.clawCloudUrl = process.env.CLAWCLOUD_AI_URL || 'https://your-clawcloud-ai.run.app';
    this.apiKey = process.env.CLAWCLOUD_API_KEY || 'your-api-key';
  }

  async analyze(content: string, type: 'text' | 'image' | 'video' = 'text'): Promise<AIResponse> {
    try {
      const response = await axios.post(`${this.clawCloudUrl}/analyze`, {
        content,
        type
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: type === 'text' ? 5000 : 15000
      });

      return response.data;
    } catch (error) {
      console.error('[ClawCloud AI] Error:', error);
      // Fallback response
      return {
        illegal_score: 0.1,
        categories: [],
        confidence: 0.1,
        is_joke: false
      };
    }
  }

  async fineTune(trainingData: Array<{ input: string; output: any }>) {
    try {
      const response = await axios.post(`${this.clawCloudUrl}/fine-tune`, {
        training_data: trainingData
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      return response.data.success;
    } catch (error) {
      console.error('[ClawCloud AI] Fine-tune error:', error);
      return false;
    }
  }

  async extractAudio(url: string): Promise<{ success: boolean; url?: string; title?: string; error?: string }> {
    try {
      const response = await axios.post(`${this.clawCloudUrl}/extract`, {
        url
      }, {
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

class UserTracker {
  private warnings = new Map<string, { count: number; lastWarning: number }>();

  addWarning(userId: string): boolean {
    const now = Date.now();
    const user = this.warnings.get(userId) || { count: 0, lastWarning: 0 };

    if (now - user.lastWarning > 86400000) {
      user.count = 0;
    }

    user.count++;
    user.lastWarning = now;
    this.warnings.set(userId, user);

    return user.count >= 3;
  }

  getWarningCount(userId: string): number {
    return this.warnings.get(userId)?.count || 0;
  }
}

class LocalDecisionEngine {
  private userTracker = new UserTracker();

  private contains(content: string, keywords: string[]): boolean {
    const lower = content.toLowerCase();
    return keywords.some(k => lower.includes(k));
  }

  async makeDecision(aiResponse: AIResponse, context: any, userId?: string, content?: string): Promise<ModerationResult> {
    const warningCount = userId ? this.userTracker.getWarningCount(userId) : 0;
    const msg = content || '';

    let severity: ModerationResult['severity'] = 'safe';
    let action: ModerationResult['action'] = 'none';
    let reason = 'Content allowed';
    let approved = true;

    // 1. Critical Blocks (CSAM, Illegal, Doxxing)
    const isCSAM = aiResponse.categories.includes('csam') || this.contains(msg, ['child sexual', 'minor meet', 'underage explicit']);
    const isIllegal = aiResponse.categories.includes('illegal') || this.contains(msg, ['sell drugs', 'buy cocaine', 'how to make bomb']);
    const isDoxxing = this.contains(msg, ['ssn', 'social security', 'lives at']);

    if ((isCSAM || isIllegal || isDoxxing) && !aiResponse.is_joke) {
      if (aiResponse.confidence > 0.7 || isCSAM) {
        action = 'immediate_ban_and_ip_ban';
        severity = 'critical';
        reason = isCSAM ? 'CSAM detected' : isIllegal ? 'Illegal activity detected' : 'Doxxing attempt';
        approved = false;
      }
    } 
    // 2. Jokes & Dark Humor (Allowed but warned if extreme)
    else if (aiResponse.is_joke || this.contains(msg, ['lol', 'jk', 'lmao', '😂'])) {
      if (aiResponse.illegal_score > 0.9 && warningCount >= 2) {
        action = 'immediate_ban_and_ip_ban';
        severity = 'critical';
        reason = 'Repeated inappropriate jokes after warnings';
        approved = false;
      } else if (aiResponse.illegal_score > 0.8) {
        action = 'warning';
        severity = 'medium';
        reason = 'Inappropriate joke - warning issued';
        approved = true;
      }
    }
    // 3. Flagging (Toxicity, NSFW)
    else if (aiResponse.illegal_score > 0.6) {
      action = 'account_risk_flag';
      severity = 'high';
      reason = 'Content flagged for manual review';
      approved = false;
    }

    // Track warnings
    if (action === 'warning' && userId) {
      const shouldBlock = this.userTracker.addWarning(userId);
      if (shouldBlock) {
        action = 'immediate_ban_and_ip_ban';
        severity = 'critical';
        reason = 'Repeated violations after warnings';
        approved = false;
      }
    }

    return {
      severity,
      reason,
      action: action as any,
      description: reason,
      approved,
      priorOffenses: warningCount,
      score: aiResponse.illegal_score,
      flags: aiResponse.categories
    } as ModerationResult;
  }
}

class ModerationQueue {
  private queue: AIRequest[] = [];
  private processing = false;
  private maxConcurrent: number;
  private activeJobs = 0;
  private readonly maxRssMB: number;

  constructor(private ai: ClawCloudAI, private decisionEngine: LocalDecisionEngine) {
    const profile = getProfile();
    this.maxConcurrent = profile.aiConcurrency;
    this.maxRssMB = profile.rssBackpressureMB;
  }

  async add(request: AIRequest): Promise<ModerationResult> {
    // Memory-based backpressure: reject if approaching OOM
    const rssMB = process.memoryUsage().rss / 1024 / 1024;
    if (rssMB > this.maxRssMB) {
      console.warn(`[ModerationQueue] RSS ${Math.round(rssMB)} MB > ${this.maxRssMB} MB, using TS fallback`);
      return {
        severity: 'safe',
        reason: 'memory_pressure_fallback',
        action: 'none',
        description: 'Memory pressure — using safe fallback',
        approved: true,
        priorOffenses: 0,
        score: 0,
        flags: []
      } as ModerationResult;
    }
    return new Promise((resolve, reject) => {
      this.queue.push({ ...request, resolve, reject } as any);
      this.process();
    });
  }

  private async process() {
    if (this.processing || this.activeJobs >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    this.activeJobs++;

    const request = this.queue.shift()!;

    try {
      // Step 1: ClawCloud AI Analysis
      const aiResponse = await this.ai.analyze(request.content, request.type);

      // Step 2: Local Decision Making
      const decision = await this.decisionEngine.makeDecision(aiResponse, request.context, request.userId, request.content);

      // Step 3: Return to App
      (request as any).resolve(decision);
    } catch (error) {
      (request as any).reject(error);
    } finally {
      this.activeJobs--;
      this.processing = false;
      setImmediate(() => this.process());
    }
  }
}

const clawCloudAI = new ClawCloudAI();
const decisionEngine = new LocalDecisionEngine();
const moderationQueue = new ModerationQueue(clawCloudAI, decisionEngine);

export const aiSystem = {
  checkContent: async (content: string, type: 'text' | 'image' | 'video' = 'text', context?: any, userId?: string): Promise<ModerationResult> => {
    const request: AIRequest = {
      id: Math.random().toString(36),
      content,
      type,
      context,
      userId,
      timestamp: Date.now()
    };
    return moderationQueue.add(request);
  },

  fineTune: (trainingData: Array<{ input: string; output: any }>) => {
    return clawCloudAI.fineTune(trainingData);
  },

  extractAudio: (url: string) => {
    return clawCloudAI.extractAudio(url);
  }
};

console.log('[Beacon AI] Connected to ClawCloud AI service');

