# Beacon Hosting Tutorial (Railway + ClawCloud, Singapore)

This is the copy-paste deployment file with full env blocks.

Important:
- Do not wrap values in quotes in Railway/ClawCloud UI.
- Paste exactly as `KEY=value`.
- Redeploy after saving variables.
- Moderation uses the small ONNX model (`MODEL_PATH=./models/moderation.onnx`). LLM bot fields are optional and can stay blank.

## 1) Target Architecture

- Railway: lightweight API mode
- ClawCloud Main: full server mode
- ClawCloud AI: ONNX + media extraction mode (target 834 MB)

Use Singapore region (`asia-southeast1`) for all services.

## 2) Railway Service

Build command:

```bash
cd apps/server && npm run build
```

Start command:

```bash
cd apps/server && npm run start:railway
```

Railway env (full block, paste all):

```env
NODE_ENV=production
PORT=8080
WS_PORT=4001
GATEWAY_PORT=4001

DATABASE_URL=postgresql://postgres.cikitgsftvtpnjdiigxf:Alixisjacob12345*@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres
MONGO_URI=mongodb+srv://Beacon:Alixisjacob12345*@cluster0.t2pcffo.mongodb.net/?retryWrites=true&w=majority
MONGO_URI_SECONDARY=mongodb+srv://Beacon-1:Alixisjacob12345*@bytebot.thcrueg.mongodb.net/?retryWrites=true&w=majority

REDIS_URL_PRIVATE=
REDIS_URL_PUBLIC=redis://default:dlkngb7h@dbprovider.ap-southeast-1.clawcloudrun.com:34053
REDIS_URL=redis://localhost:6379
REDIS_FORCE_ENABLE=false

CLOUDINARY_CLOUD_NAME=dvbag0oy5
CLOUDINARY_API_KEY=182285414774756
CLOUDINARY_API_SECRET=UKrMYaaeWJPaQwNs7YQn_3yeLt0
CLOUDINARY_URL_SECONDARY=cloudinary://759797579854911:UuNfNRUZJBqrfmcRF3xQzve7pa4@dxtk9nhjl

R2_ENDPOINT_URL=https://ce5094f80c8353520bdc4ec96628e6c5.r2.cloudflarestorage.com/beaconstorage
R2_ENDPOINT=https://ce5094f80c8353520bdc4ec96628e6c5.r2.cloudflarestorage.com
R2_ACCOUNT_ID=ce5094f80c8353520bdc4ec96628e6c5
R2_BUCKET_NAME=beaconstorage
R2_PUBLIC_URL=https://ce5094f80c8353520bdc4ec96628e6c5.r2.cloudflarestorage.com/beaconstorage
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BACKUP_ENABLED=true

JWT_SECRET=FHlfKguI131LBYB7nEBc4nXdF2rOQeBz+cIOF9zpGxcmb6LIM7bCDqJljRESpe9kr9AcslAVunDjFgUlsLl2hA==
BEACON_PUBLIC_KEY=f3328ce756626f63456b3e70cf24cfc9a9bf48d68926048d087b37d45543c8d1
BCRYPT_ROUNDS=8

CORS_ORIGIN=https://beacon.qzz.io,https://www.beacon.qzz.io,https://api.beacon.qzz.io,http://localhost:5173,http://127.0.0.1:5173

SWIPL_PATH=swipl
SOVEREIGNTY_LEVEL=3
SMS_BRIDGE_ENABLED=true

API_HOST=https://api.beacon.qzz.io
GATEWAY_HOST=wss://gateway.beacon.qzz.io
MODERATION_API=https://mod.beacon.qzz.io
MEDIA_API=https://media.beacon.qzz.io
BEACON_API_URL=https://api.beacon.qzz.io/api
BEACON_GATEWAY_URL=wss://gateway.beacon.qzz.io
API_URL=https://api.beacon.qzz.io/api
GATEWAY_URL=wss://gateway.beacon.qzz.io

CLAWCLOUD_AI_URL=
CLAWCLOUD_API_KEY=
AI_API_KEY=
AI_ASSISTANT_ENDPOINT=
AI_ASSISTANT_MODEL=
AI_CHAT_ENDPOINT=
AI_CHAT_MODEL=
BEACON_INTELLIGENCE_BOT_APP_ID=

GIPHY_API_KEY=

REQUEST_LOG_NOISY_PATHS=/info,/options,/friends
REQUEST_LOG_THROTTLE_MS=15000
REQUEST_LOG_SAMPLE_RATE=1
REQUEST_LOG_SUCCESS=true

ENABLE_MODERATION=true
ENABLE_TEXT_AI_MODERATION=true
ENABLE_BOT_SYSTEM=false
ENABLE_IMAGE_MODERATION=false
ENABLE_WS_SERVER=false
AUTO_TUNE_PROFILE=railway-api
```

## 3) ClawCloud Main Server

Image:

- `ghcr.io/raft-the-crab/beacon-server:latest`

If private image:

- Registry: `ghcr.io`
- Username: your GitHub username
- Password: GitHub PAT with `read:packages`

ClawCloud Main env (full block, paste all):

```env
NODE_ENV=production
PORT=8080
WS_PORT=4001
GATEWAY_PORT=4001

CORS_ORIGIN=https://beacon.qzz.io,https://www.beacon.qzz.io,https://api.beacon.qzz.io,http://localhost:5173,http://127.0.0.1:5173
DATABASE_URL=postgresql://postgres.cikitgsftvtpnjdiigxf:Alixisjacob12345*@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres
MONGO_URI=mongodb+srv://Beacon:Alixisjacob12345*@cluster0.t2pcffo.mongodb.net/?retryWrites=true&w=majority
MONGO_URI_SECONDARY=mongodb+srv://Beacon-1:Alixisjacob12345*@bytebot.thcrueg.mongodb.net/?retryWrites=true&w=majority

REDIS_URL_PRIVATE=redis://default:dlkngb7h@beacon-redis-redis.ns-hh1bxkxc.svc:6379
REDIS_URL_PUBLIC=redis://default:dlkngb7h@dbprovider.ap-southeast-1.clawcloudrun.com:34053
REDIS_URL=redis://localhost:6379
REDIS_FORCE_ENABLE=true

CLOUDINARY_CLOUD_NAME=dvbag0oy5
CLOUDINARY_API_KEY=182285414774756
CLOUDINARY_API_SECRET=UKrMYaaeWJPaQwNs7YQn_3yeLt0
CLOUDINARY_URL_SECONDARY=cloudinary://759797579854911:UuNfNRUZJBqrfmcRF3xQzve7pa4@dxtk9nhjl

R2_ENDPOINT_URL=https://ce5094f80c8353520bdc4ec96628e6c5.r2.cloudflarestorage.com/beaconstorage
R2_ENDPOINT=https://ce5094f80c8353520bdc4ec96628e6c5.r2.cloudflarestorage.com
R2_ACCOUNT_ID=ce5094f80c8353520bdc4ec96628e6c5
R2_BUCKET_NAME=beaconstorage
R2_PUBLIC_URL=https://ce5094f80c8353520bdc4ec96628e6c5.r2.cloudflarestorage.com/beaconstorage
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BACKUP_ENABLED=true

JWT_SECRET=FHlfKguI131LBYB7nEBc4nXdF2rOQeBz+cIOF9zpGxcmb6LIM7bCDqJljRESpe9kr9AcslAVunDjFgUlsLl2hA==
BEACON_PUBLIC_KEY=f3328ce756626f63456b3e70cf24cfc9a9bf48d68926048d087b37d45543c8d1
BCRYPT_ROUNDS=8

CORS_ORIGIN=https://beacon.qzz.io,https://www.beacon.qzz.io,https://api.beacon.qzz.io

SWIPL_PATH=swipl
SOVEREIGNTY_LEVEL=3
SMS_BRIDGE_ENABLED=true

API_HOST=https://api.beacon.qzz.io
GATEWAY_HOST=wss://gateway.beacon.qzz.io
MODERATION_API=https://mod.beacon.qzz.io
MEDIA_API=https://media.beacon.qzz.io
BEACON_API_URL=https://api.beacon.qzz.io/api
BEACON_GATEWAY_URL=wss://gateway.beacon.qzz.io
API_URL=https://api.beacon.qzz.io/api
GATEWAY_URL=wss://gateway.beacon.qzz.io

CLAWCLOUD_AI_URL=
CLAWCLOUD_API_KEY=
AI_API_KEY=
AI_ASSISTANT_ENDPOINT=
AI_ASSISTANT_MODEL=
AI_CHAT_ENDPOINT=
AI_CHAT_MODEL=
BEACON_INTELLIGENCE_BOT_APP_ID=

GIPHY_API_KEY=

REQUEST_LOG_NOISY_PATHS=/info,/options,/friends
REQUEST_LOG_THROTTLE_MS=15000
REQUEST_LOG_SAMPLE_RATE=1
REQUEST_LOG_SUCCESS=true

ENABLE_MODERATION=true
ENABLE_TEXT_AI_MODERATION=true
ENABLE_BOT_SYSTEM=true
ENABLE_IMAGE_MODERATION=true
ENABLE_WS_SERVER=true
AUTO_TUNE_PROFILE=clawcloud-api
```

## 4) ClawCloud AI Service

Image:

- `ghcr.io/raft-the-crab/beacon-ai:latest`

Resources:

- CPU: `0.6`
- RAM: `1112 MB`
- Storage: `4 GB`
- Runtime target: `~834 MB`

ClawCloud AI env:

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

## 5) Frontend Env

Web deploy env:

```env
VITE_API_URL=https://api.beacon.qzz.io/api
VITE_GATEWAY_URL=wss://gateway.beacon.qzz.io
```

## 6) Railway Issues Checklist (Quick)

If logs show `DATABASE_URL not set` or `localhost:27017`:

1. Ensure no quotes in Railway Variables values.
2. Confirm variables are in the same service + same environment (`production`).
3. Redeploy latest commit after saving variables.
4. Check startup log line `[Railway] Env presence:` to verify keys are true.

If logs show `Redis ... ENOTFOUND ... .svc` on Railway:

1. Set `REDIS_URL_PRIVATE=` (blank) in Railway.
2. Set `REDIS_URL_PUBLIC` to your internet-reachable Redis endpoint.
3. Keep `REDIS_FORCE_ENABLE=false`.
4. Redeploy.

If logs show `Can't reach database server at db.<ref>.supabase.co:5432`:

1. Verify your Supabase project is active and not paused.
2. Confirm Railway region egress to port `5432` is allowed.
3. If direct host remains blocked, switch to Supabase pooler connection string from Supabase dashboard.
4. Redeploy after updating `DATABASE_URL`.

If logs show `keep-alive ... /health (404)`:

1. Latest code now self-pings local `/api/version` in Railway.
2. Redeploy latest `main` so this fix is active.
