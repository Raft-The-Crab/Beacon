#!/bin/bash
set -e

echo "🚂 Deploying to Railway (512MB RAM)..."

# Build with production optimizations
export NODE_ENV=production
export NODE_OPTIONS="--max-old-space-size=384"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production --ignore-scripts

# Build server
echo "🔨 Building server..."
cd apps/server
npm run build

# Prune dev dependencies
echo "🧹 Pruning dev dependencies..."
npm prune --production

# Start server with memory limits
echo "🚀 Starting server..."
node --max-old-space-size=384 --expose-gc dist/src/index.js
