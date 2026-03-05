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

  async makeDecision(aiResponse: AIResponse, context: any, userId?: string): Promise<ModerationResult> {
    const warningCount = userId ? this.userTracker.getWarningCount(userId) : 0;

    let severity: ModerationResult['severity'] = 'safe';
    let action: ModerationResult['action'] = 'none';
    let reason = 'Content allowed';
    let approved = true;

    if (aiResponse.categories.includes('csam') && aiResponse.confidence > 0.8) {
      action = 'immediate_ban_and_ip_ban';
      severity = 'critical';
      reason = 'CSAM detected';
      approved = false;
    } else if (aiResponse.categories.includes('illegal') && aiResponse.confidence > 0.8 && !aiResponse.is_joke) {
      action = 'immediate_ban_and_ip_ban';
      severity = 'critical';
      reason = 'Illegal activity detected';
      approved = false;
    } else if (aiResponse.categories.includes('minor_meeting') && aiResponse.confidence > 0.7) {
      action = 'account_risk_flag';
      severity = 'high';
      reason = 'Suspicious minor interaction';
      approved = false;
    } else if ((aiResponse.categories.includes('csam') || aiResponse.categories.includes('illegal')) && aiResponse.is_joke) {
      if (warningCount >= 2) {
        action = 'immediate_ban_and_ip_ban';
        severity = 'critical';
        reason = 'Repeated inappropriate jokes';
        approved = false;
      } else {
        action = 'warning';
        severity = 'medium';
        reason = 'Inappropriate joke - warning issued';
        approved = true;
      }
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
      const decision = await this.decisionEngine.makeDecision(aiResponse, request.context, request.userId);

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
  }
};

console.log('[Beacon AI] Connected to ClawCloud AI service');

