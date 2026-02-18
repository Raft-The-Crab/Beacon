/**
 * Beacon AI Moderation Service
 * Integrates SWI-Prolog rule-based engine with Node.js API
 * Philosophy: Allow freedom, block actual harm
 */

interface ModerationResult {
  threat_level: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
  evidence: string[];
  action: 'none' | 'log_only' | 'warn_and_log' | 'auto_delete_and_mute' | 'auto_ban';
  confidence: number;
  context_score?: number;
}

interface ContextAnalysis {
  message_count: number;
  threat_score: number;
  patterns: string[];
  recommendation: string;
}

class ModerationService {
  private prologProcess: any = null;
  private messageCache: Map<string, string[]> = new Map();

  async initialize() {
    console.log('[Moderation] Service initialized');
  }

  /**
   * Analyze a single message using rule-based engine
   */
  async checkContent(
    content: string,
    userId: string = 'unknown',
    channelId: string = 'unknown'
  ): Promise<ModerationResult> {
    // Add to context cache for multi-message analysis
    if (!this.messageCache.has(channelId)) {
      this.messageCache.set(channelId, []);
    }
    const channelMessages = this.messageCache.get(channelId)!;
    channelMessages.push(content);
    if (channelMessages.length > 50) channelMessages.shift();

    const result = this.analyzeMessage(content);

    // Log violations
    if (result.threat_level !== 'safe') {
      await this.logViolation(userId, channelId, content, result);
    }

    return result;
  }

  /**
   * Analyze message context (multi-message patterns)
   */
  async analyzeContext(
    channelId: string,
    _userId: string
  ): Promise<ContextAnalysis> {
    const messages = this.messageCache.get(channelId) || [];
    
    if (messages.length < 5) {
      return {
        message_count: messages.length,
        threat_score: 0,
        patterns: [],
        recommendation: 'none'
      };
    }

    const patterns: string[] = [];
    let threatScore = 0;

    // Pattern: Repeated selling indicators
    const sellingCount = messages.filter(m => 
      /\\b(sell|selling|buy|vendor|shop|dm me|telegram)\\b/i.test(m)
    ).length;
    if (sellingCount >= 3) {
      patterns.push('repeated_selling');
      threatScore += 30;
    }

    // Pattern: Escalating aggression
    const aggressionWords = messages.map(m => 
      (m.match(/\\b(kill|attack|bomb|shoot|destroy|death)\\b/gi) || []).length
    );
    if (this.isEscalating(aggressionWords)) {
      patterns.push('escalating_aggression');
      threatScore += 40;
    }

    let recommendation = 'none';
    if (threatScore >= 70) recommendation = 'immediate_review';
    else if (threatScore >= 40) recommendation = 'monitor';

    return {
      message_count: messages.length,
      threat_score: threatScore,
      patterns,
      recommendation
    };
  }

  /**
   * Core analysis logic
   */
  private analyzeMessage(message: string): ModerationResult {
    const reasons: string[] = [];
    const evidence: string[] = [];

    // CRITICAL: CSAM
    const csamPatterns = [
      /(cp|cheese pizza).*(trade|sell|buy|want|looking)/i,
      /(pedo|paedo).*(discord|telegram|wickr)/i,
      /(young|teen|child).*(nude|naked|porn).*(sell|buy|trade)/i
    ];
    for (const pattern of csamPatterns) {
      const match = message.match(pattern);
      if (match) {
        reasons.push('csam');
        evidence.push(match[0]);
        return {
          threat_level: 'critical',
          reasons,
          evidence,
          action: 'auto_ban',
          confidence: 99
        };
      }
    }

    // HIGH: Drug selling (actual, not jokes)
    const drugSellingPatterns = [
      /(sell|selling|dealing).*(meth|heroin|fentanyl|cocaine).*(dm|telegram|contact)/i,
      /(vendor|plug).*(price|\\$).*(oz|gram|kilo)/i
    ];
    const hasHumorMarker = /(jk|joking|lmao|lol|haha|kidding|sarcasm|meme|imagine|hypothetically|in minecraft)/i.test(message);
    
    if (!hasHumorMarker) {
      for (const pattern of drugSellingPatterns) {
        const match = message.match(pattern);
        if (match) {
          reasons.push('drug_selling');
          evidence.push(match[0]);
          return {
            threat_level: 'high',
            reasons,
            evidence,
            action: 'auto_delete_and_mute',
            confidence: 90
          };
        }
      }

      // HIGH: Violence planning
      const violencePatterns = [
        /(shoot|bomb|attack).*(school|mall|church).*(tomorrow|planning)/i,
        /(kill|murder).*(address|location).*(soon|tonight)/i
      ];
      for (const pattern of violencePatterns) {
        const match = message.match(pattern);
        if (match) {
          reasons.push('violence_planning');
          evidence.push(match[0]);
          return {
            threat_level: 'critical',
            reasons,
            evidence,
            action: 'auto_ban',
            confidence: 95
          };
        }
      }
    }

    // Everything else is safe (swearing, jokes, etc.)
    return {
      threat_level: 'safe',
      reasons: [],
      evidence: [],
      action: 'none',
      confidence: 0
    };
  }

  private isEscalating(scores: (number | undefined)[]): boolean {
    const validScores = scores.filter((s): s is number => typeof s === 'number');
    if (validScores.length < 3) return false;
    let increases = 0;
    for (let i = 1; i < validScores.length; i++) {
      const current = validScores[i];
      const prev = validScores[i - 1];
      if (typeof current === 'number' && typeof prev === 'number' && current > prev) {
         increases++;
      }
    }
    return increases / (validScores.length - 1) > 0.6;
  }

  private async logViolation(
    userId: string,
    channelId: string,
    message: string,
    result: ModerationResult
  ) {
    const log = {
      timestamp: new Date().toISOString(),
      userId,
      channelId,
      message: message.substring(0, 500),
      threat_level: result.threat_level,
      reasons: result.reasons,
      action: result.action,
      confidence: result.confidence
    };

    console.log('[Moderation] Violation logged:', log);
  }

  async shutdown() {
    if (this.prologProcess) {
      this.prologProcess.kill();
    }
  }
}

export const moderationService = new ModerationService();
export type { ModerationResult, ContextAnalysis };
