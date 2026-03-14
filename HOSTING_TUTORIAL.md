# Beacon Hosting Tutorial (Railway + ClawCloud, Singapore)

This guide is prefilled from the current repository environment files so you can deploy directly.

## 1) Target Architecture

- Railway: lightweight API + gateway basics
- ClawCloud Server: heavier API/gateway workloads and Prolog moderation
- ClawCloud AI: ONNX moderation + media extraction (memory target ~834 MB)

All services should be set to Singapore (`asia-southeast1`).

## 2) Railway Service Setup

Create one Railway service for `apps/server`.

Build command:

```bash
cd apps/server && npm run build
```

Start command:

```bash
cd apps/server && npm run start:railway
```

Region:

- `asia-southeast1` (Singapore)

### Railway Environment Variables (paste exactly)

```env
NODE_ENV=production
PORT=8080
GATEWAY_PORT=4001

DATABASE_URL=postgresql://postgres:Alixisjacob12345*@db.cikitgsftvtpnjdiigxf.supabase.co:5432/postgres?schema=public
MONGO_URI=mongodb+srv://Beacon:Alixisjacob12345*@cluster0.t2pcffo.mongodb.net/?retryWrites=true&w=majority

REDIS_URL_PRIVATE=redis://default:dlkngb7h@beacon-redis-redis.ns-hh1bxkxc.svc:6379
REDIS_URL_PUBLIC=redis://default:dlkngb7h@dbprovider.ap-southeast-1.clawcloudrun.com:34053
REDIS_URL=redis://localhost:6379

CLOUDINARY_CLOUD_NAME=dvbag0oy5
CLOUDINARY_API_KEY=182285414774756
CLOUDINARY_API_SECRET=UKrMYaaeWJPaQwNs7YQn_3yeLt0

R2_ENDPOINT_URL=https://ce5094f80c8353520bdc4ec96628e6c5.r2.cloudflarestorage.com/beaconstorage
R2_ENDPOINT=https://ce5094f80c8353520bdc4ec96628e6c5.r2.cloudflarestorage.com
R2_ACCOUNT_ID=ce5094f80c8353520bdc4ec96628e6c5
R2_BUCKET_NAME=beaconstorage
R2_PUBLIC_URL=https://ce5094f80c8353520bdc4ec96628e6c5.r2.cloudflarestorage.com/beaconstorage
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=

JWT_SECRET=FHlfKguI131LBYB7nEBc4nXdF2rOQeBz+cIOF9zpGxcmb6LIM7bCDqJljRESpe9kr9AcslAVunDjFgUlsLl2hA==
CORS_ORIGIN=https://beacon.qzz.io,https://www.beacon.qzz.io,https://api.beacon.qzz.io

SWIPL_PATH=swipl
API_HOST=https://api.beacon.qzz.io
GATEWAY_HOST=wss://gateway.beacon.qzz.io
MODERATION_API=https://mod.beacon.qzz.io
MEDIA_API=https://media.beacon.qzz.io

SOVEREIGNTY_LEVEL=3
SMS_BRIDGE_ENABLED=true

CLAWCLOUD_AI_URL=
CLAWCLOUD_API_KEY=

ENABLE_MODERATION=true
ENABLE_BOT_SYSTEM=false
ENABLE_IMAGE_MODERATION=false
ENABLE_TEXT_AI_MODERATION=true
AUTO_TUNE_PROFILE=railway-api
ENABLE_WS_SERVER=false
```

## 3) ClawCloud Main Server Deployment

Use image:

- `ghcr.io/raft-the-crab/beacon-server:latest`

For private GHCR image in ClawCloud:

- Image Registry: `ghcr.io`
- Username: your GitHub username
- Password: GitHub PAT with `read:packages`

For public GHCR image:

- Choose Public Image and only fill image name.

### ClawCloud Main Server Env

```env
NODE_ENV=production
PORT=8080
GATEWAY_PORT=4001

DATABASE_URL=postgresql://postgres:Alixisjacob12345*@db.cikitgsftvtpnjdiigxf.supabase.co:5432/postgres?schema=public
MONGO_URI=mongodb+srv://Beacon:Alixisjacob12345*@cluster0.t2pcffo.mongodb.net/?retryWrites=true&w=majority

REDIS_URL_PRIVATE=redis://default:dlkngb7h@beacon-redis-redis.ns-hh1bxkxc.svc:6379
REDIS_URL_PUBLIC=redis://default:dlkngb7h@dbprovider.ap-southeast-1.clawcloudrun.com:34053
REDIS_URL=redis://localhost:6379

CLOUDINARY_CLOUD_NAME=dvbag0oy5
CLOUDINARY_API_KEY=182285414774756
CLOUDINARY_API_SECRET=UKrMYaaeWJPaQwNs7YQn_3yeLt0

R2_ENDPOINT_URL=https://ce5094f80c8353520bdc4ec96628e6c5.r2.cloudflarestorage.com/beaconstorage
R2_ENDPOINT=https://ce5094f80c8353520bdc4ec96628e6c5.r2.cloudflarestorage.com
R2_ACCOUNT_ID=ce5094f80c8353520bdc4ec96628e6c5
R2_BUCKET_NAME=beaconstorage
R2_PUBLIC_URL=https://ce5094f80c8353520bdc4ec96628e6c5.r2.cloudflarestorage.com/beaconstorage
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=

JWT_SECRET=FHlfKguI131LBYB7nEBc4nXdF2rOQeBz+cIOF9zpGxcmb6LIM7bCDqJljRESpe9kr9AcslAVunDjFgUlsLl2hA==
CORS_ORIGIN=https://beacon.qzz.io,https://www.beacon.qzz.io,https://api.beacon.qzz.io

SWIPL_PATH=swipl
SOVEREIGNTY_LEVEL=3
SMS_BRIDGE_ENABLED=true

ENABLE_MODERATION=true
ENABLE_BOT_SYSTEM=true
ENABLE_IMAGE_MODERATION=true
ENABLE_TEXT_AI_MODERATION=true
AUTO_TUNE_PROFILE=clawcloud-api
ENABLE_WS_SERVER=true
```

## 4) ClawCloud AI Deployment

Use image:

- `ghcr.io/raft-the-crab/beacon-ai:latest`

Resource target:

- CPU: `0.6`
- RAM: `1112 MB`
- Storage: `4 GB`
- Runtime memory goal: `~834 MB`

### ClawCloud AI Env

```env
PORT=8080
PYTHONUNBUFFERED=1
OMP_NUM_THREADS=1
ORT_NUM_THREADS=1
BEACON_AI_TARGET_MB=834
BEACON_AI_MAX_CONCURRENCY=1
REDIS_URL=redis://localhost:6379
CLAWCLOUD_API_KEY=
MODEL_PATH=./models/moderation.onnx
```

## 5) AI Model Recommendation (small + efficient)

Use a compact ONNX model (quantized) for legal-risk detection only:

- DistilBERT or MiniLM class model
- Quantized ONNX target size: ~120–260 MB
- Sequence length: 192
- Concurrency: 1

This keeps AI below the 834 MB budget and leaves room for media extraction + Redis.

## 6) Domain Notes

Railway usually shows its generated domain (for example `*.up.railway.app`) even when custom domain is attached.

Both are valid and point to the same deployment:

- generated domain: operational default
- custom domain: your branded public endpoint

## 7) Frontend / API Domain Wiring

Use these in web deploy settings:

```env
VITE_API_URL=https://api.beacon.qzz.io/api
VITE_GATEWAY_URL=wss://gateway.beacon.qzz.io
```

## 8) Health Checks

- Railway API: `GET /health`
- ClawCloud Main: `GET /health`
- ClawCloud AI: `GET /health`

Expected AI health response includes:

- `status: ok`
- `ai_model: true/false`
- `redis: true/false`

## 9) Quick Troubleshooting

- OOM on Railway: keep `ENABLE_IMAGE_MODERATION=false`, `ENABLE_BOT_SYSTEM=false`, `AUTO_TUNE_PROFILE=railway-api`
- AI high memory: keep `OMP_NUM_THREADS=1`, `ORT_NUM_THREADS=1`, model sequence length 192
- Private image pull fail on ClawCloud: check PAT has `read:packages`
- Build fails on `beacon-sdk`: ensure server build runs `npm --prefix ../../packages/sdk run build`
