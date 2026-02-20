FROM node:20-alpine

WORKDIR /usr/src/app

# Copy ALL files at once to break cache
COPY apps/server ./

RUN npm install && npm run build && npm prune --production

EXPOSE 8080

CMD ["node", "dist/index.js"]
