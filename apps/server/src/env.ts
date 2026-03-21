import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Environment Initialization
const nodeEnv = process.env.NODE_ENV || 'development';
const inferredServerRoot = process.cwd().endsWith(path.join('apps', 'server'))
    ? process.cwd()
    : path.resolve(process.cwd(), 'apps', 'server');

const baseEnvPath = path.join(inferredServerRoot, '.env');
if (fs.existsSync(baseEnvPath)) {
    dotenv.config({ path: baseEnvPath });
}

const envModePath = path.join(inferredServerRoot, `.env.${nodeEnv}`);
if (fs.existsSync(envModePath)) {
    dotenv.config({ path: envModePath, override: false });
}

export { nodeEnv, inferredServerRoot };
