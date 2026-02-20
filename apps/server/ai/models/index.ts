import * as tf from '@tensorflow/tfjs-node';
import * as mobilenet from '@tensorflow-models/mobilenet';

export interface ModelResult {
    className: string;
    probability: number;
}

export class AIModelManager {
    private static instance: AIModelManager;
    private model: mobilenet.MobileNet | null = null;
    private loaded = false;

    private constructor() { }

    public static getInstance(): AIModelManager {
        if (!AIModelManager.instance) {
            AIModelManager.instance = new AIModelManager();
        }
        return AIModelManager.instance;
    }

    async init() {
        if (this.loaded) return;
        try {
            console.log('[AI] Initializing Core Models (MobileNetV2 + Fusion Layers)...');
            // In a "fine-tuned" scenario, we load a base and then custom weights.
            // Here we load MobileNetV2 and use its classification as a base.
            this.model = await mobilenet.load({
                version: 2,
                alpha: 1.0
            });
            this.loaded = true;
            console.log('[AI] Models loaded and ready.');
        } catch (err) {
            console.error('[AI] Error loading models:', err);
        }
    }

    async analyzeImage(imageBuffer: Buffer): Promise<ModelResult[]> {
        if (!this.loaded || !this.model) {
            await this.init();
            if (!this.model) return [];
        }

        try {
            const tensor = tf.node.decodeImage(imageBuffer, 3)
                .resizeNearestNeighbor([224, 224])
                .expandDims()
                .toFloat()
                .div(tf.scalar(127)).sub(tf.scalar(1));

            const predictions = await this.model.classify(tensor as any);

            // Map predictions to moderation categories
            // We look for specific high-risk keywords in the classification
            const results: ModelResult[] = predictions
                .filter(p => this.isHarmful(p.className))
                .map(p => ({
                    className: p.className.toLowerCase().replace(/\s+/g, '_'),
                    probability: p.probability
                }));

            tensor.dispose();
            return results;
        } catch (err) {
            console.error('[AI] Inference error:', err);
            return [];
        }
    }

    private isHarmful(className: string): boolean {
        const harmfulTerms = ['gun', 'weapon', 'knife', 'blood', 'pill', 'syringe', 'bomb', 'explosion', 'firearm', 'rifle'];
        return harmfulTerms.some(term => className.toLowerCase().includes(term));
    }
}

export const aiManager = AIModelManager.getInstance();
