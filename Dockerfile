FROM node:20-alpine

WORKDIR /usr/src/app

# Copy server package for standalone install
# Assuming we are building from the PROJECT ROOT context
COPY apps/server/package.json ./

# Install dependencies
RUN npm install

# Copy prisma schema and generate client
COPY apps/server/prisma ./prisma
RUN npx prisma generate || true

# Copy server source and AI folder from their root-relative paths
COPY apps/server/src ./src
COPY apps/server/ai ./ai

# Build TypeScript
RUN npm run build

# Prune dev dependencies after build
RUN npm prune --production

EXPOSE 8080

# Start the server (index.js is in dist/src due to multi-root structure)
CMD ["node", "dist/src/index.js"]
