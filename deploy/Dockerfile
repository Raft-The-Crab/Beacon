FROM node:20-alpine

WORKDIR /usr/src/app

# Copy package config
COPY package.json ./

# Install dependencies (using --no-audit to speed up)
RUN npm install --no-audit

# Copy prisma schema
COPY prisma ./prisma

# Generate Prisma Client (Force failure if it fails so we see logs)
RUN npm run prisma:generate

# Copy source and AI folder
COPY src ./src
COPY ai ./ai
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build

# Prune dev dependencies
RUN npm prune --production

EXPOSE 8080

# Use npm start to ensure it uses the package.json script
CMD ["npm", "start"]
