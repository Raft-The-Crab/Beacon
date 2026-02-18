#!/usr/bin/env bash
# Beacon Production Setup Script
# Use this on Claw Cloud Run or Railway (Nixpacks usually handles this, but this is a backup)

set -e

echo "🔧 Setting up Beacon Production Environment..."

# 1. Install Workspace Dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# 2. Build Shared Packages
echo "🏗️ Building shared packages..."
pnpm --filter "@beacon/types" build
pnpm --filter "@beacon/api-client" build

# 3. Database Preparation
echo "🗄️ Preparing database..."
cd apps/server
npx prisma generate
npx prisma migrate deploy

# 4. Build Server
echo "🚀 Building server..."
npm run build

echo "✅ Setup Complete. Run 'npm start' in apps/server to begin."
