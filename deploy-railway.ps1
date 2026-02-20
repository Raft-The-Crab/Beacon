Write-Host "🚂 Beacon Railway Deployment Helper"
Write-Host "-----------------------------------"

# Check if Railway CLI is installed
if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Railway CLI not found. Please install it first with: npm i -g @railway/cli"
    exit 1
}

# Login
Write-Host "🔑 Please login to Railway..."
railway login

# Deploy
Write-Host "🚀 Deploying Server..."
npm run deploy:server

Write-Host "✅ Deployment initiated! Check your Railway dashboard."
