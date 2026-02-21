# Beacon Server Cleanup Script

Write-Host "🧹 Cleaning up Beacon Server..." -ForegroundColor Cyan

# Remove unnecessary folders
$foldersToRemove = @(
    "apps\server\native",
    "apps\server\tests",
    "deploy"
)

foreach ($folder in $foldersToRemove) {
    $path = Join-Path $PSScriptRoot "..\$folder"
    if (Test-Path $path) {
        Write-Host "Removing $folder..." -ForegroundColor Yellow
        Remove-Item -Path $path -Recurse -Force
    }
}

# Remove unnecessary files
$filesToRemove = @(
    "apps\server\Dockerfile.optimized",
    "Dockerfile.railway",
    "Dockerfile.clawcloud"
)

foreach ($file in $filesToRemove) {
    $path = Join-Path $PSScriptRoot "..\$file"
    if (Test-Path $path) {
        Write-Host "Removing $file..." -ForegroundColor Yellow
        Remove-Item -Path $path -Force
    }
}

Write-Host "✅ Cleanup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. cd apps\server"
Write-Host "2. npm install"
Write-Host "3. npx prisma generate"
Write-Host "4. npm run dev"
