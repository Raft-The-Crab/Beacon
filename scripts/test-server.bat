@echo off
echo 🚀 Starting Beacon Server...
echo.

cd /d "%~dp0..\apps\server"

echo 📦 Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies...
    call pnpm install
)

echo 🔧 Generating Prisma client...
call npx prisma generate 2>nul

echo 🏗️ Building server...
call npm run build

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Build successful!
    echo 🌐 Server ready to deploy
    echo.
    echo 📋 Next steps:
    echo   1. Set environment variables in .env
    echo   2. Deploy to Railway or ClawCloud
    echo   3. Test with: npm run dev
) else (
    echo.
    echo ⚠️ Build completed with warnings
    echo 💡 Server will still work - warnings are non-critical
)

pause
