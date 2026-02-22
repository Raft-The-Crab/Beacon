FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./

# Install dependencies (only production for smaller image)
RUN npm install

# Copy source and prisma
COPY prisma ./prisma
COPY src ./src
COPY ai ./ai
COPY tsconfig.json ./
COPY server-*.js ./

# Generate Prisma client
RUN npx prisma generate

# Build
RUN npm run build

EXPOSE 8080

CMD ["node", "server-railway.js"]
