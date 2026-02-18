#!/usr/bin/env pwsh
# Beacon Android APK Build Script - Android 11+ (API 30+)
# Builds release APK and AAB (Android App Bundle)

param(
    [Parameter()]
    [ValidateSet('apk', 'bundle', 'both')]
    [string]$Target = 'both',
    
    [Parameter()]
    [switch]$Clean,
    
    [Parameter()]
    [switch]$SkipWebBuild
)

$ErrorActionPreference = 'Stop'

Write-Host "🤖 Beacon Android Build Script" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan

# Check prerequisites
Write-Host "`n📋 Checking prerequisites..." -ForegroundColor Yellow

if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm not found. Install Node.js first."
    exit 1
}

if (!(Test-Path "$PSScriptRoot/../apps/mobile/android")) {
    Write-Error "Android project not found. Run 'npx cap add android' first."
    exit 1
}

# Verify Java/Gradle
$androidPath = "$PSScriptRoot/../apps/mobile/android"
if (!(Test-Path "$androidPath/gradlew.bat")) {
    Write-Error "Gradle wrapper not found in Android project."
    exit 1
}

# Clean old builds
if ($Clean) {
    Write-Host "`n🧹 Cleaning old builds..." -ForegroundColor Yellow
    Set-Location "$androidPath"
    & .\gradlew.bat clean
    Set-Location "$PSScriptRoot/.."
}

# Build web frontend
if (!$SkipWebBuild) {
    Write-Host "`n🔨 Building web frontend..." -ForegroundColor Yellow
    Set-Location "$PSScriptRoot/../apps/web"
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Web build failed"
        exit 1
    }
    Set-Location "$PSScriptRoot/.."
}

# Sync Capacitor
Write-Host "`n🔄 Syncing Capacitor..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot/../apps/mobile"
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Error "Capacitor sync failed"
    exit 1
}

# Build Android
Write-Host "`n🔨 Building Android application..." -ForegroundColor Yellow
Set-Location "$androidPath"

switch ($Target) {
    'apk' {
        Write-Host "Building release APK..." -ForegroundColor Cyan
        & .\gradlew.bat assembleRelease
    }
    'bundle' {
        Write-Host "Building release AAB (App Bundle)..." -ForegroundColor Cyan
        & .\gradlew.bat bundleRelease
    }
    'both' {
        Write-Host "Building APK + AAB..." -ForegroundColor Cyan
        & .\gradlew.bat assembleRelease bundleRelease
    }
}

if ($LASTEXITCODE -ne 0) {
    Write-Error "Android build failed"
    exit 1
}

Set-Location "$PSScriptRoot/.."

# Show results
Write-Host "`n✅ Build completed successfully!" -ForegroundColor Green
Write-Host "`n📦 Build artifacts location:" -ForegroundColor Cyan

$apkPath = "$PSScriptRoot/../apps/mobile/android/app/build/outputs"
if (Test-Path "$apkPath/apk/release") {
    Write-Host "`n📱 APK Files:" -ForegroundColor Cyan
    Get-ChildItem -Path "$apkPath/apk/release" -Filter *.apk | ForEach-Object {
        $sizeMB = [math]::Round($_.Length / 1MB, 2)
        Write-Host "   $($_.Name): $sizeMB MB" -ForegroundColor White
        Write-Host "   Location: $($_.FullName)" -ForegroundColor Gray
    }
}

if (Test-Path "$apkPath/bundle/release") {
    Write-Host "`n📦 AAB Files:" -ForegroundColor Cyan
    Get-ChildItem -Path "$apkPath/bundle/release" -Filter *.aab | ForEach-Object {
        $sizeMB = [math]::Round($_.Length / 1MB, 2)
        Write-Host "   $($_.Name): $sizeMB MB" -ForegroundColor White
        Write-Host "   Location: $($_.FullName)" -ForegroundColor Gray
    }
}

Write-Host "`n🎉 Ready for deployment!" -ForegroundColor Green
Write-Host "APK: Direct distribution or GitHub Releases" -ForegroundColor Yellow
Write-Host "AAB: Google Play Console upload" -ForegroundColor Yellow

Write-Host "`n⚠️  Note: For production, sign with keystore:" -ForegroundColor Yellow
Write-Host "   .\gradlew.bat assembleRelease -Pandroid.injected.signing.store.file=<keystore_path>" -ForegroundColor Gray
