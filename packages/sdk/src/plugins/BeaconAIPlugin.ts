import { Client, BeaconPlugin } from '../client';
import { Message } from '../structures/Message';

export interface BeaconAIPluginOptions {
  /** Function to resolve AI responses */
  aiModelResolver: (prompt: string, context: string[]) => Promise<string>;
  /** The persona the AI should adopt */
  persona?: string;
  /** Whether to automatically check incoming messages against the moderation endpoint */
  enableModeration?: boolean;
}

export class BeaconAIPlugin implements BeaconPlugin {
  public name = 'BeaconAIPlugin';
  public memoryMap = new Map<string, string[]>();
  
  private client!: Client;
  private aiModelResolver: (prompt: string, context: string[]) => Promise<string>;
  private persona: string;
  private enableModeration: boolean;

  constructor(options: BeaconAIPluginOptions) {
    this.aiModelResolver = options.aiModelResolver;
    this.persona = options.persona || "A helpful, friendly AI assistant.";
    this.enableModeration = options.enableModeration ?? false;
  }

  public onInstall(client: Client): void {
    this.client = client;
    
    // AI Chat/Persona Listener
    client.on('messageCreate', this.handleAIMessage.bind(this));

    // Optional Auto-Moderation Middleware
    if (this.enableModeration) {
      client.middleware.use(async (event, payload, next) => {
        // Only moderate actual user messages
        if (event === 'messageCreate' && payload.content && payload.author && !payload.author.bot) {
           try {
             // Use the client's internal REST manager to call the API
             const response = await client.rest.request('POST', '/moderation/check', {
               content: payload.content,
               channelId: payload.channel_id
             });
             
             // If the backend marks this as blocked/deleted, stop the event propagation
             if (response.action === 'block' || response.action === 'delete') {
                 return; // Short-circuit
             }
           } catch {
             // Fail open: ignore moderation errors to not break chat pipeline
           }
        }
        await next();
      });
    }
  }

  private async handleAIMessage(msg: Message): Promise<void> {
    if (!this.client.user || msg.author.id === this.client.user?.id) return;
    
    // Only respond to mentions or direct messages
    const isMentioned = msg.mentions?.some(id => id === this.client.user?.id);
    const isDM = !msg.guildId;
    
    if (isMentioned || isDM) {
      // Remove the bot mention from the query
      const cleanContent = msg.content.replace(`<@${this.client.user.id}>`, '').trim();
      const threadId = msg.channelId;
      
      const history = this.memoryMap.get(threadId) || [];
      history.push(`User: ${cleanContent}`);
      if (history.length > 20) history.shift();
      
      try {
        const systemContext = `System Persona: ${this.persona}`;
        const response = await this.aiModelResolver(cleanContent, [systemContext, ...history]);
        
        history.push(`Assistant: ${response}`);
        this.memoryMap.set(threadId, history);
        
        await this.client.sendMessage(msg.channelId, {
          content: response,
          reply_to: msg.id
        });
      } catch (err) {
        console.error('[BeaconAIPlugin] Resolution failed:', err);
      }
    }
  }
}
