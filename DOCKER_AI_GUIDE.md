# Beacon AI Docker Orchestration

This guide explains how to deploy the high-IQ AI services (Prolog + Video/Image models) in a Docker container on your virtual machine.

## 1. Directory Structure
```
ai/
├── Dockerfile
├── moderation.pl
├── models/
└── video_processor.ts
```

## 2. Dockerfile
```dockerfile
FROM node:20-slim

# Install SWI-Prolog
RUN apt-get update && apt-get install -y swi-prolog ffmpeg python3 python3-pip

WORKDIR /app
COPY . .
RUN npm install
CMD ["npm", "run", "start:ai"]
```

## 3. Deployment Logic
The main Beacon server on Railway connects to this Docker instance via Redis or a direct API.
- **Port**: 8081
- **Discovery**: Set `AI_API_URL` in Railway .env to point to your Claw Cloud IP.

## 4. SMS Bridge Integration
The `SMSBridge` runs on the host OS of Claw Cloud to have direct hardware/serial access if needed, communicating with the main app via Redis pub/sub.
