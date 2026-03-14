# Beacon Deployment Tutorial

This is the actual deployment order for Beacon using the stack you already have.

## What You Already Have

- Railway can host the Node backend.
- Cloudflare Pages can host the web frontend.
- PostgreSQL already exists externally.
- MongoDB already exists externally.
- Redis already exists externally.
- Cloudinary already exists.
- Cloudflare R2 support already exists in the codebase.

That means Railway only needs to run the server. It does not need to host your database or Redis.

## Correct Order

1. Deploy the backend to Railway first.
2. Confirm the Railway backend URL works.
3. Deploy the frontend to Cloudflare Pages using the Railway URL.
4. If Railway becomes too small later, deploy the same backend with Docker using `Dockerfile.clawcloud`.

## Part 1: Railway Backend

### Railway Build Settings

The repo is already configured for Railway with these files:

- `railway.json`
- `nixpacks.toml`

Railway should deploy from the repo root.

### Railway Variables To Add

Use the existing backend values from `apps/server/.env.production` for the secret and private variables.

Required backend variables:

```env
NODE_ENV=production
JWT_SECRET=<use the current value from apps/server/.env.production>
DATABASE_URL=<use the current value from apps/server/.env.production>
MONGO_URI=<use the current value from apps/server/.env.production>
REDIS_URL=<use the current value from apps/server/.env.production>
CORS_ORIGIN=https://your-project.pages.dev
```

Recommended backend variables if uploads are used:

```env
CLOUDINARY_CLOUD_NAME=dvbag0oy5
CLOUDINARY_API_KEY=<use the current value from apps/server/.env.production>
CLOUDINARY_API_SECRET=<use the current value from apps/server/.env.production>
```

Optional backend variables only if you actually use these features:

```env
MONGO_URI_SECONDARY=<use current secondary Mongo URI if you have one>
SWIPL_PATH=swipl
SOVEREIGNTY_LEVEL=3
BCRYPT_ROUNDS=10
KLIPY_API_KEY=<use your current key if enabled>
BEACON_PUBLIC_KEY=<use your current value if interaction signing is enabled>
AI_MODERATION_ENDPOINT=<set if AI moderation is enabled>
AI_MODERATION_MODEL=llama3
AI_API_KEY=<set if AI moderation is enabled>
REQUEST_LOG_NOISY_PATHS=/info,/options,/friends
REQUEST_LOG_THROTTLE_MS=15000
REQUEST_LOG_SAMPLE_RATE=1
REQUEST_LOG_SUCCESS=true
```

Usually you do not need to set these manually on Railway:

```env
PORT=8080
RAILWAY_PUBLIC_DOMAIN=<auto>
RAILWAY_STATIC_URL=<auto>
```

### Deploy Steps

1. Open Railway.
2. Create a project from the Beacon GitHub repo.
3. Deploy from the repo root.
4. Add the backend variables above.
5. Redeploy.
6. Generate a public domain in Railway.

When it works, you should have a URL like:

```txt
https://your-railway-domain.up.railway.app
```

Health checks to test:

```txt
https://your-railway-domain.up.railway.app/health
https://your-railway-domain.up.railway.app/api/health
```

## Part 2: Cloudflare Pages Frontend

After Railway is live, deploy the frontend.

### Cloudflare Pages Build Settings

```txt
Build command: cd apps/web && npm install && npm run build
Build output directory: apps/web/dist
Root directory: leave blank
```

### Cloudflare Pages Variables

Use these values in Cloudflare Pages Production environment:

```env
VITE_API_URL=https://your-railway-domain.up.railway.app/api
VITE_BACKEND_URL=https://your-railway-domain.up.railway.app
VITE_WS_URL=wss://your-railway-domain.up.railway.app/gateway
VITE_GATEWAY_URL=wss://your-railway-domain.up.railway.app
```

These current public frontend values can also be carried over if you want the same behavior as your current setup:

```env
VITE_CLOUDINARY_CLOUD_NAME=dvbag0oy5
VITE_CLOUDINARY_UPLOAD_PRESET=beacon_uploads
VITE_SUPABASE_URL=https://db.cikitgsftvtpnjdiigxf.supabase.co
VITE_ENABLE_VOICE=true
VITE_ENABLE_VIDEO=true
VITE_ENABLE_BOTS=true
VITE_ENABLE_DEVELOPER_MODE=true
VITE_ENV=production
VITE_APP_VERSION=1.0.0
VITE_ENABLE_ANALYTICS=false
VITE_DEBUG_MODE=false
```

Optional frontend public API keys if you want those features:

```env
VITE_GIPHY_API_KEY=<use the current value from apps/web/.env.local if you want it>
VITE_TENOR_API_KEY=<set only if you want Tenor>
VITE_KLIPY_API_KEY=<use the current value from apps/web/.env.local if you want it>
```

### Final Railway CORS Update

After Cloudflare Pages gives you the final site URL, go back to Railway and set:

```env
CORS_ORIGIN=https://your-project.pages.dev
```

If you later add a custom domain, set both origins comma-separated.

Example:

```env
CORS_ORIGIN=https://your-project.pages.dev,https://chat.yourdomain.com
```

## Part 3: Docker Or Bigger Host Later

If Railway starts restarting from memory pressure, move the same backend to Docker.

Use:

```bash
docker build -f Dockerfile.clawcloud -t beacon-server:latest .
```

For private repo builds:

```bash
docker build -f Dockerfile.clawcloud --build-arg GITHUB_TOKEN=YOUR_TOKEN -t beacon-server:latest .
```

The Docker host should use the same backend env set as Railway, plus these if needed:

```env
PORT=8080
CLAWCLOUD_PUBLIC_URL=https://your-docker-host-domain
CLAWCLOUD_URL=https://your-docker-host-domain
WS_PORT=4001
```

## Current Env Source Map

Use this so you know where each value currently lives.

### Backend private values

Source file:

- `apps/server/.env.production`

Values pulled from there:

- `DATABASE_URL`
- `MONGO_URI`
- `REDIS_URL`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `JWT_SECRET`
- `NODE_ENV`
- `SWIPL_PATH`
- `SOVEREIGNTY_LEVEL`

### Frontend public values

Source files:

- `apps/web/.env.production`
- `apps/web/.env.local`

Current public values already present:

```env
VITE_CLOUDINARY_CLOUD_NAME=dvbag0oy5
VITE_CLOUDINARY_UPLOAD_PRESET=beacon_uploads
VITE_SUPABASE_URL=https://db.cikitgsftvtpnjdiigxf.supabase.co
VITE_ENABLE_VOICE=true
VITE_ENABLE_VIDEO=true
VITE_ENABLE_BOTS=true
VITE_ENABLE_DEVELOPER_MODE=true
VITE_ENV=production
VITE_APP_VERSION=1.0.0
VITE_ENABLE_ANALYTICS=false
VITE_DEBUG_MODE=false
```

Current API endpoint values from the existing production web env:

```env
VITE_API_URL=https://api.beacon.qzz.io
VITE_BACKEND_URL=https://api.beacon.qzz.io
VITE_GATEWAY_URL=wss://gateway.beacon.qzz.io
VITE_MODERATION_API=https://mod.beacon.qzz.io
VITE_MEDIA_API=https://media.beacon.qzz.io
```

Replace those with your new Railway domain if Railway becomes the live backend.

## Short Version

### Put this in Railway

```env
NODE_ENV=production
JWT_SECRET=<copy from apps/server/.env.production>
DATABASE_URL=<copy from apps/server/.env.production>
MONGO_URI=<copy from apps/server/.env.production>
REDIS_URL=<copy from apps/server/.env.production>
CORS_ORIGIN=https://your-project.pages.dev
CLOUDINARY_CLOUD_NAME=dvbag0oy5
CLOUDINARY_API_KEY=<copy from apps/server/.env.production>
CLOUDINARY_API_SECRET=<copy from apps/server/.env.production>
```

### Put this in Cloudflare Pages

```env
VITE_API_URL=https://your-railway-domain.up.railway.app/api
VITE_BACKEND_URL=https://your-railway-domain.up.railway.app
VITE_WS_URL=wss://your-railway-domain.up.railway.app/gateway
VITE_GATEWAY_URL=wss://your-railway-domain.up.railway.app
VITE_CLOUDINARY_CLOUD_NAME=dvbag0oy5
VITE_CLOUDINARY_UPLOAD_PRESET=beacon_uploads
VITE_SUPABASE_URL=https://db.cikitgsftvtpnjdiigxf.supabase.co
VITE_ENABLE_VOICE=true
VITE_ENABLE_VIDEO=true
VITE_ENABLE_BOTS=true
VITE_ENABLE_DEVELOPER_MODE=true
VITE_ENV=production
VITE_APP_VERSION=1.0.0
VITE_ENABLE_ANALYTICS=false
VITE_DEBUG_MODE=false
```

## Important Security Note

This tutorial does not embed your live private secrets into markdown on purpose.

- Keep private secrets in hosting dashboards.
- Do not commit database passwords, Redis passwords, Cloudinary secrets, or JWT secrets into docs.
- Rotate any secrets that were previously committed to the repository.