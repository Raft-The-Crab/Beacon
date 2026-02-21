# ☁️ ClawCloud Deployment Guide

## Prerequisites
- Docker installed locally
- ClawCloud account
- Container registry (Docker Hub, GitHub Container Registry, or ClawCloud Registry)
- All database services running

## Step-by-Step Deployment

### 1. Build Docker Image

```bash
cd apps/server

# Build the image
docker build -f Dockerfile.clawcloud -t beacon-server:latest .

# Test locally (optional)
docker run -p 8080:8080 --env-file .env beacon-server:latest
```

### 2. Tag and Push to Registry

#### Option A: Docker Hub
```bash
# Login
docker login

# Tag
docker tag beacon-server:latest yourusername/beacon-server:latest

# Push
docker push yourusername/beacon-server:latest
```

#### Option B: GitHub Container Registry
```bash
# Login
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Tag
docker tag beacon-server:latest ghcr.io/raft-the-crab/beacon-server:latest

# Push
docker push ghcr.io/raft-the-crab/beacon-server:latest
```

### 3. Deploy to ClawCloud

#### Via ClawCloud CLI

```bash
# Install CLI
npm install -g @clawcloud/cli

# Login
clawcloud login

# Deploy
clawcloud deploy \
  --image yourusername/beacon-server:latest \
  --name beacon-api \
  --port 8080 \
  --env-file .env.production
```

#### Via ClawCloud Dashboard

1. Go to https://clawcloud.io/dashboard
2. Click "New Deployment"
3. Select "Container Image"
4. Enter image: `yourusername/beacon-server:latest`
5. Set port: `8080`
6. Add environment variables (see below)
7. Click "Deploy"

### 4. Configure Environment Variables

Add these in ClawCloud dashboard or CLI:

```env
DATABASE_URL=postgresql://postgres:Alixisjacob12345*@db.cikitgsftvtpnjdiigxf.supabase.co:5432/postgres
MONGO_URI=mongodb+srv://Beacon:Alixisjacob12345*@cluster0.t2pcffo.mongodb.net/
REDIS_URL=redis://default:Wh7HUP8L8HeCkfh84fsHwdkkgnskerhp@redis-12216.c51.ap-southeast-2-1.ec2.cloud.redislabs.com:12216
CLOUDINARY_CLOUD_NAME=dvbag0oy5
CLOUDINARY_API_KEY=182285414774756
CLOUDINARY_API_SECRET=UKrMYaaeWJPaQwNs7YQn_3yeLt0
JWT_SECRET=your-random-secret-key
PORT=8080
NODE_ENV=production
CORS_ORIGIN=https://your-frontend.com
```

### 5. Configure Networking

```bash
# Expose service
clawcloud expose beacon-api --port 8080

# Get URL
clawcloud info beacon-api
```

Your API will be available at: `https://beacon-api.clawcloud.io`

### 6. Verify Deployment

```bash
# Health check
curl https://beacon-api.clawcloud.io/health

# Check logs
clawcloud logs beacon-api --follow
```

## Advanced Configuration

### Auto-Scaling

```yaml
# clawcloud.yaml
name: beacon-api
image: yourusername/beacon-server:latest
port: 8080
scaling:
  min: 1
  max: 5
  cpu: 70
  memory: 80
resources:
  cpu: 1000m
  memory: 512Mi
healthCheck:
  path: /health
  interval: 30s
  timeout: 5s
```

Deploy with config:
```bash
clawcloud deploy -f clawcloud.yaml
```

### Load Balancing

ClawCloud automatically load balances across instances:

```bash
# Scale to 3 instances
clawcloud scale beacon-api --replicas 3
```

### Custom Domain

```bash
# Add custom domain
clawcloud domain add api.beacon.app --service beacon-api

# Get DNS records
clawcloud domain info api.beacon.app
```

Add to your DNS:
```
CNAME api.beacon.app -> beacon-api.clawcloud.io
```

### SSL/TLS

ClawCloud automatically provisions SSL certificates via Let's Encrypt.

## Monitoring

### View Logs

```bash
# Real-time logs
clawcloud logs beacon-api --follow

# Last 100 lines
clawcloud logs beacon-api --tail 100

# Filter by level
clawcloud logs beacon-api --level error
```

### Metrics

```bash
# CPU and memory usage
clawcloud metrics beacon-api

# Request metrics
clawcloud metrics beacon-api --type requests
```

### Alerts

Set up alerts in dashboard:
1. Go to Monitoring → Alerts
2. Create alert rule:
   - CPU > 80% for 5 minutes
   - Memory > 90% for 5 minutes
   - Error rate > 5% for 1 minute
3. Set notification channel (email, Slack, Discord)

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/deploy-clawcloud.yml
name: Deploy to ClawCloud

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: |
          cd apps/server
          docker build -f Dockerfile.clawcloud -t beacon-server .
      
      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker tag beacon-server ${{ secrets.DOCKER_USERNAME }}/beacon-server:latest
          docker push ${{ secrets.DOCKER_USERNAME }}/beacon-server:latest
      
      - name: Deploy to ClawCloud
        run: |
          npm install -g @clawcloud/cli
          clawcloud login --token ${{ secrets.CLAWCLOUD_TOKEN }}
          clawcloud deploy --image ${{ secrets.DOCKER_USERNAME }}/beacon-server:latest
```

## Troubleshooting

### Image Pull Errors
```bash
# Make image public on Docker Hub
docker hub repository set-visibility yourusername/beacon-server public

# Or use ClawCloud registry
clawcloud registry login
docker tag beacon-server clawcloud.io/yourusername/beacon-server
docker push clawcloud.io/yourusername/beacon-server
```

### Database Connection Issues
```bash
# Test connection from ClawCloud
clawcloud exec beacon-api -- curl https://db.cikitgsftvtpnjdiigxf.supabase.co

# Check firewall rules
# Whitelist ClawCloud IPs in database settings
```

### Out of Memory
```bash
# Increase memory limit
clawcloud update beacon-api --memory 1Gi

# Or in clawcloud.yaml
resources:
  memory: 1Gi
```

### High CPU Usage
```bash
# Scale horizontally
clawcloud scale beacon-api --replicas 3

# Or increase CPU
clawcloud update beacon-api --cpu 2000m
```

## Cost Estimation

ClawCloud pricing (approximate):
- **Compute:** $0.05/hour per 1 CPU + 512MB RAM
- **Storage:** $0.10/GB/month
- **Bandwidth:** $0.10/GB
- **Load Balancer:** $10/month

**Estimated monthly cost:** $30-50 for small-medium traffic

## Rollback

```bash
# List deployments
clawcloud deployments beacon-api

# Rollback to previous
clawcloud rollback beacon-api --revision 2
```

## Backup & Disaster Recovery

```bash
# Export configuration
clawcloud export beacon-api > beacon-backup.yaml

# Restore from backup
clawcloud deploy -f beacon-backup.yaml
```

## Support

- ClawCloud Docs: https://docs.clawcloud.io
- ClawCloud Support: support@clawcloud.io
- Community Forum: https://community.clawcloud.io

---

**Status:** ✅ Ready to deploy
**Estimated Setup Time:** 15-20 minutes
**Difficulty:** Medium
