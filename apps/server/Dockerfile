# --- Stage 1: Build ---
FROM node:20-alpine AS builder

WORKDIR /app
RUN apk add --no-cache openssl g++ make python3

# Copy workspace manifests first for better layer reuse.
COPY package*.json ./
COPY packages/types/package.json ./packages/types/
COPY packages/sdk/package.json ./packages/sdk/
COPY apps/server/package.json ./apps/server/

# Copy workspace source.
COPY packages/types ./packages/types
COPY packages/sdk ./packages/sdk
COPY apps/server ./apps/server

RUN npm install

WORKDIR /app/packages/types
RUN npm run build

WORKDIR /app/packages/sdk
RUN npm run build

WORKDIR /app/apps/server
RUN npm run build

# --- Stage 2: Runtime ---
FROM node:20-alpine

WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/types ./packages/types
COPY --from=builder /app/packages/sdk ./packages/sdk
COPY --from=builder /app/apps/server ./apps/server

WORKDIR /app/apps/server
EXPOSE 8080

CMD ["node", "server-railway.js"]
