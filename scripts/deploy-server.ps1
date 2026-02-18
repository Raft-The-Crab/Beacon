#!/usr/bin/env pwsh
# Beacon Server Deployment Script
# Deploys backend to Railway with automatic migrations

param(
    [Parameter()]
    [ValidateSet('development', 'production')]
    [string]$Environment = 'production',
    
    [Parameter()]
    [switch]$SkipMigrations,
    
    [Parameter()]
    [switch]$Force
)

$ErrorActionPreference = 'Stop'

Write-Host "🚀 Beacon Server Deployment" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan

# Check prerequisites
Write-Host "`n📋 Checking prerequisites..." -ForegroundColor Yellow

if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "git not found. Install Git first."
    exit 1
}

# Verify Railway CLI (optional but recommended)
$hasRailway = Get-Command railway -ErrorAction SilentlyContinue
if (!$hasRailway) {
    Write-Host "⚠️  Railway CLI not found. Install for easier deployments:" -ForegroundColor Yellow
    Write-Host "   npm install -g @railway/cli" -ForegroundColor Gray
}

# Check git status
Write-Host "`n📊 Checking git status..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot/.."

$gitStatus = git status --porcelain
if ($gitStatus -and !$Force) {
    Write-Host "⚠️  You have uncommitted changes:" -ForegroundColor Yellow
    Write-Host $gitStatus -ForegroundColor Gray
    $continue = Read-Host "`nContinue deployment? (y/N)"
    if ($continue -ne 'y') {
        Write-Host "Deployment cancelled." -ForegroundColor Red
        exit 0
    }
}

# Run Prisma migrations
if (!$SkipMigrations) {
    Write-Host "`n🔄 Running database migrations..." -ForegroundColor Yellow
    Set-Location "$PSScriptRoot/../apps/server"
    
    $env:NODE_ENV = $Environment
    npx prisma migrate deploy
    
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Migration failed, but continuing deployment..."
    } else {
        Write-Host "✅ Migrations completed" -ForegroundColor Green
    }
    
    Set-Location "$PSScriptRoot/.."
}

# Deploy to Railway
Write-Host "`n🚂 Deploying to Railway..." -ForegroundColor Yellow

if ($hasRailway) {
    Set-Location "$PSScriptRoot/../apps/server"
    railway up --environment $Environment
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Railway deployment failed"
        exit 1
    }
} else {
    Write-Host "📤 Pushing to GitHub (Railway auto-deploy)..." -ForegroundColor Cyan
    git push origin main
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Git push failed"
        exit 1
    }
    
    Write-Host "`n⏳ Railway will auto-deploy from GitHub..." -ForegroundColor Yellow
    Write-Host "   Monitor: https://railway.app/dashboard" -ForegroundColor Gray
}

Set-Location "$PSScriptRoot/.."

# Show deployment info
Write-Host "`n✅ Deployment initiated!" -ForegroundColor Green
Write-Host "`n📊 Deployment Details:" -ForegroundColor Cyan
Write-Host "   Environment: $Environment" -ForegroundColor White
Write-Host "   Backend URL: https://beacon-production.up.railway.app" -ForegroundColor White
Write-Host "   Dashboard: https://railway.app/project/<your-project-id>" -ForegroundColor Gray

Write-Host "`n🔍 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Verify deployment in Railway dashboard" -ForegroundColor White
Write-Host "   2. Check logs: railway logs" -ForegroundColor White
Write-Host "   3. Test API: curl https://beacon-production.up.railway.app/health" -ForegroundColor White

Write-Host "`n🎉 Deployment complete!" -ForegroundColor Green
