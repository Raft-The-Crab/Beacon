FROM node:20-alpine

WORKDIR /usr/src/app

COPY apps/server/package.json apps/server/package-lock.json* ./
COPY apps/server/tsconfig.json ./

RUN npm install

COPY apps/server/prisma ./prisma
RUN npx prisma generate || true

COPY apps/server/src ./src
COPY apps/server/ai ./ai

RUN npm run build

RUN npm prune --production

EXPOSE 8080

CMD ["node", "dist/index.js"]
