# --- Stage 1: Build ---
FROM node:20-alpine AS builder

WORKDIR /app
RUN apk add --no-cache openssl g++ make python3

# Copy root configurations
COPY package*.json ./
COPY packages/types/package.json ./packages/types/
COPY apps/server/package.json ./apps/server/

# Copy all source files
COPY packages/types ./packages/types
COPY apps/server ./apps/server

# Install dependencies for the workspace
RUN npm install

# Build shared types
WORKDIR /app/packages/types
RUN npm run build || true

# Generate Prisma and build Server
WORKDIR /app/apps/server
RUN npx prisma generate
RUN npm run build

# --- Stage 2: Production ---
FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache openssl

# We must copy node_modules from builder to avoid having to run `npm install --omit=dev` which breaks workspaces
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/types ./packages/types
COPY --from=builder /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/package*.json ./apps/server/
COPY --from=builder /app/apps/server/prisma ./apps/server/prisma
COPY --from=builder /app/apps/server/server-*.js ./apps/server/

WORKDIR /app/apps/server
RUN npx prisma generate

EXPOSE 8080 8081 8082 4001

CMD ["node", "server-railway.js"]
