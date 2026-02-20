export interface ModelResult {
    className: string;
    probability: number;
}
export declare class AIModelManager {
    private static instance;
    private model;
    private loaded;
    private constructor();
    static getInstance(): AIModelManager;
    init(): Promise<void>;
    analyzeImage(imageBuffer: Buffer): Promise<ModelResult[]>;
    private isHarmful;
}
export declare const aiManager: AIModelManager;
//# sourceMappingURL=index.d.ts.map