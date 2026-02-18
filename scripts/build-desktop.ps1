#!/usr/bin/env pwsh
# Beacon Desktop Build Script - Windows 10/11 x64
# This script builds production-ready MSI and NSIS installers

param(
    [Parameter()]
    [ValidateSet('msi', 'nsis', 'all')]
    [string]$Target = 'all',
    
    [Parameter()]
    [switch]$Clean,
    
    [Parameter()]
    [switch]$SkipWebBuild
)

$ErrorActionPreference = 'Stop'

Write-Host "🚀 Beacon Desktop Build Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Check prerequisites
Write-Host "`n📋 Checking prerequisites..." -ForegroundColor Yellow

if (!(Get-Command cargo -ErrorAction SilentlyContinue)) {
    Write-Error "Rust/Cargo not found. Install from https://rustup.rs/"
    exit 1
}

if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm not found. Install Node.js first."
    exit 1
}

# Clean old builds
if ($Clean) {
    Write-Host "`n🧹 Cleaning old builds..." -ForegroundColor Yellow
    Set-Location "$PSScriptRoot/apps/desktop"
    cargo clean --manifest-path src-tauri/Cargo.toml
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue src-tauri/target
    Set-Location "$PSScriptRoot"
}

# Build web frontend
if (!$SkipWebBuild) {
    Write-Host "`n🔨 Building web frontend..." -ForegroundColor Yellow
    Set-Location "$PSScriptRoot/apps/web"
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Web build failed"
        exit 1
    }
    Set-Location "$PSScriptRoot"
}

# Build Tauri desktop app
Write-Host "`n🔨 Building Tauri desktop application..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot/apps/desktop"

switch ($Target) {
    'msi' {
        Write-Host "Building MSI installer..." -ForegroundColor Cyan
        npm run build:msi
    }
    'nsis' {
        Write-Host "Building NSIS installer..." -ForegroundColor Cyan
        npm run build:nsis
    }
    'all' {
        Write-Host "Building all installers (MSI + NSIS)..." -ForegroundColor Cyan
        npm run build:all
    }
}

if ($LASTEXITCODE -ne 0) {
    Write-Error "Desktop build failed"
    exit 1
}

Set-Location "$PSScriptRoot"

# Show results
Write-Host "`n✅ Build completed successfully!" -ForegroundColor Green
Write-Host "`n📦 Build artifacts location:" -ForegroundColor Cyan
Write-Host "   $PSScriptRoot\apps\desktop\src-tauri\target\release\bundle\" -ForegroundColor White

# Calculate file sizes
$bundlePath = "$PSScriptRoot/apps/desktop/src-tauri/target/release/bundle"
if (Test-Path $bundlePath) {
    Write-Host "`n📊 Package sizes:" -ForegroundColor Cyan
    Get-ChildItem -Path $bundlePath -Recurse -File -Include *.msi,*.exe | ForEach-Object {
        $sizeMB = [math]::Round($_.Length / 1MB, 2)
        Write-Host "   $($_.Name): $sizeMB MB" -ForegroundColor White
    }
}

Write-Host "`n🎉 Ready for deployment!" -ForegroundColor Green
Write-Host "Upload to: https://github.com/Raft-The-Crab/Beacon/releases" -ForegroundColor Yellow
