FROM node:18-alpine

WORKDIR /usr/src/app

# Install dependencies
COPY package.json package-lock.json* ./
COPY tsconfig.json ./
RUN npm ci --production || npm install --production

# Copy source
COPY . .

# Build
RUN npm run build || true

EXPOSE 8080

CMD ["node", "dist/index.js"]
