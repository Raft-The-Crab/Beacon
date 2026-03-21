// No imports needed here if only augmenting Request with a simple object
export {};
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
            };
        }
    }
}
