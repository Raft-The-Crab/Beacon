#!/bin/bash

echo "🚀 Setting up Beacon Server..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Navigate to server directory
cd "$(dirname "$0")/../apps/server" || exit 1

echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

echo -e "${YELLOW}🔧 Generating Prisma client...${NC}"
npx prisma generate

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Prisma generation failed (this is OK if DATABASE_URL is not set)${NC}"
fi

echo -e "${YELLOW}🏗️  Building TypeScript...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Copy .env.example to .env and fill in your credentials"
echo "2. Run 'npm run dev' to start development server"
echo "3. Run 'npm start' to start production server"
echo ""
echo -e "${GREEN}Deployment:${NC}"
echo "- Railway: Use Dockerfile.railway"
echo "- ClawCloud: Use Dockerfile.clawcloud"
echo "- See DEPLOYMENT.md for detailed instructions"
