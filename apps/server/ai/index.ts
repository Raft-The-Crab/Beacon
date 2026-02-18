// AI Moderation with SWI-Prolog integration
import { ModerationResult } from '../src/services/moderation';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url'; // Import fileURLToPath

// Get __dirname equivalent in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the Prolog script
const PROLOG_SCRIPT_PATH = path.join(__dirname, 'moderation.pl');
const SWIPL_PATH = process.env.SWIPL_PATH || 'swipl'; // Assumes swipl is in PATH or specified

class PrologModerator {
  private prologProcess: ChildProcessWithoutNullStreams | null = null;
  private responseBuffer: string = '';
  private resolver: ((result: ModerationResult) => void) | null = null;
  private rejecter: ((error: Error) => void) | null = null;

  constructor() {
    this.initPrologProcess();
  }

  private initPrologProcess() {
    if (this.prologProcess && !this.prologProcess.killed) {
      this.prologProcess.kill(); // Ensure only one process is running
    }

    this.prologProcess = spawn(SWIPL_PATH, ['-q', '-l', PROLOG_SCRIPT_PATH, '-g', 'run_moderation_loop']);

    this.prologProcess.stdout.on('data', (data: Buffer) => {
      this.responseBuffer += data.toString();
      // Look for a complete JSON object (assuming one per line from Prolog writeln)
      const lines = this.responseBuffer.split('\n');
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim();
        if (line) {
          try {
            const result: ModerationResult = JSON.parse(line);
            if (this.resolver) {
              this.resolver(result);
              this.resolver = null;
              this.rejecter = null;
            }
          } catch (error) {
            console.error('[AI Moderation] Failed to parse Prolog output:', error);
            if (this.rejecter) {
              this.rejecter(new Error('Failed to parse Prolog moderation result'));
              this.resolver = null;
              this.rejecter = null;
            }
          }
        }
      }
      this.responseBuffer = lines[lines.length - 1]; // Keep the last incomplete line
    });

    this.prologProcess.stderr.on('data', (data: Buffer) => {
      console.error('[AI Moderation] Prolog stderr:', data.toString());
      if (this.rejecter) {
        this.rejecter(new Error(`Prolog process error: ${data.toString()}`));
        this.resolver = null;
        this.rejecter = null;
      }
    });

    this.prologProcess.on('close', (code: number) => {
      console.warn(`[AI Moderation] Prolog process exited with code ${code}`);
      // Attempt to restart if it was an unexpected exit
      if (code !== 0 && this.resolver) {
        if (this.rejecter) {
            this.rejecter(new Error(`Prolog process exited unexpectedly with code ${code}`));
        }
      }
      // Re-initialize for future requests
      setTimeout(() => this.initPrologProcess(), 1000); // Debounce restart
    });

    this.prologProcess.on('error', (err: Error) => {
      console.error('[AI Moderation] Failed to start Prolog process:', err);
      if (this.rejecter) {
        this.rejecter(new Error(`Failed to start Prolog process: ${err.message}`));
        this.resolver = null;
        this.rejecter = null;
      }
      // Re-initialize for future requests
      setTimeout(() => this.initPrologProcess(), 1000); // Debounce restart
    });

    console.log('[AI Moderation] SWI-Prolog process initialized.');
  }

  public async checkContent(content: string, type: 'text' | 'image' = 'text', context?: any): Promise<ModerationResult> {
    if (!this.prologProcess || this.prologProcess.killed) {
        console.warn('[AI Moderation] Prolog process not running, re-initializing and retrying...');
        this.initPrologProcess();
        // Wait a short moment for the process to start, then retry
        await new Promise(resolve => setTimeout(resolve, 500));
        if (!this.prologProcess || this.prologProcess.killed) {
            throw new Error('Prolog process failed to restart.');
        }
    }

    return new Promise((resolve, reject) => {
      this.resolver = resolve;
      this.rejecter = reject;

      const payload = JSON.stringify({ content, type, context });
      this.prologProcess?.stdin.write(payload + '\n');
    });
  }
}

const moderator = new PrologModerator();

export const aiModeration = {
  checkContent: (content: string, type: 'text' | 'image' = 'text', context?: any) => {
    return moderator.checkContent(content, type, context);
  },
};

// Ensure the Prolog process is killed when Node.js process exits
process.on('exit', () => {
  if (moderator['prologProcess']) {
    moderator['prologProcess'].kill();
  }
});

process.on('SIGINT', () => {
    if (moderator['prologProcess']) {
        moderator['prologProcess'].kill();
    }
    process.exit(0);
});

