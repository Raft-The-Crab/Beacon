import { Client, ClientOptions } from './client';
import { RawMessage } from './structures/Message';

export interface AIClientOptions extends ClientOptions {
  aiModelResolver: (prompt: string, context: string[]) => Promise<string>;
  persona?: string;
}

export class AIClient extends Client {
  private aiModelResolver: (prompt: string, context: string[]) => Promise<string>;
  public persona: string;
  private memoryMap: Map<string, string[]> = new Map();

  constructor(options: AIClientOptions) {
    super(options);
    this.aiModelResolver = options.aiModelResolver;
    this.persona = options.persona || "A helpful, friendly AI assistant.";

    this.on('messageCreate', this.handleAIMessage.bind(this));
  }

  private async handleAIMessage(msg: RawMessage) {
    if (!this.user || msg.author?.id === this.user.id) return;

    // Only respond to mentions or direct messages
    const isMentioned = msg.mentions?.some(u => u.id === this.user!.id);
    const isDM = !('guild_id' in msg) || !(msg as any).guild_id;

    if (isMentioned || isDM) {
      const cleanContent = msg.content.replace(`<@${this.user.id}>`, '').trim();
      const threadId = msg.channel_id;

      // Load ephemeral memory context
      const history = this.memoryMap.get(threadId) || [];
      history.push(`User: ${cleanContent}`);

      if (history.length > 20) history.shift(); // Keep last 20 messages

      try {
        // Prepend persona and resolve via user's provided function
        const systemContext = `System Persona: ${this.persona}`;
        const response = await this.aiModelResolver(cleanContent, [systemContext, ...history]);

        history.push(`Assistant: ${response}`);
        this.memoryMap.set(threadId, history);

        // Send back out via Beacon
        await this.sendMessage(msg.channel_id, {
          content: response,
          reply_to: msg.id
        });
      } catch (err) {
        console.error('[AIClient] Resolution failed:', err);
      }
    }
  }
}
