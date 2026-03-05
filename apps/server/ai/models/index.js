import * as tf from '@tensorflow/tfjs-node';
import * as mobilenet from '@tensorflow-models/mobilenet';
export class AIModelManager {
    static instance;
    model = null;
    loaded = false;
    constructor() { }
    static getInstance() {
        if (!AIModelManager.instance) {
            AIModelManager.instance = new AIModelManager();
        }
        return AIModelManager.instance;
    }
    async init() {
        if (this.loaded)
            return;
        try {
            console.log('[AI] Initializing Core Models (MobileNetV2 + Fusion Layers)...');
            this.model = await mobilenet.load({
                version: 2,
                alpha: 1.0
            });
            this.loaded = true;
            console.log('[AI] Models loaded and ready.');
        }
        catch (err) {
            console.error('[AI] Error loading models:', err);
        }
    }
    async analyzeImage(imageBuffer) {
        if (!this.loaded || !this.model) {
            await this.init();
            if (!this.model)
                return [];
        }
        try {
            const tensor = tf.node.decodeImage(imageBuffer, 3)
                .resizeNearestNeighbor([224, 224])
                .expandDims()
                .toFloat()
                .div(tf.scalar(127)).sub(tf.scalar(1));
            const predictions = await this.model.classify(tensor);
            const results = predictions
                .filter(p => this.isHarmful(p.className))
                .map(p => ({
                className: p.className.toLowerCase().replace(/\s+/g, '_'),
                probability: p.probability
            }));
            tensor.dispose();
            return results;
        }
        catch (err) {
            console.error('[AI] Inference error:', err);
            return [];
        }
    }
    isHarmful(className) {
        const harmfulTerms = ['gun', 'weapon', 'knife', 'blood', 'pill', 'syringe', 'bomb', 'explosion', 'firearm', 'rifle'];
        return harmfulTerms.some(term => className.toLowerCase().includes(term));
    }
}
export const aiManager = AIModelManager.getInstance();
//# sourceMappingURL=index.js.map