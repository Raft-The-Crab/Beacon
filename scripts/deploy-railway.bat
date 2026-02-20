@echo off
echo ========================================
echo  BEACON v1.0 - Railway Deployment
echo ========================================
echo.

echo [Step 1] Checking Railway CLI...
where railway >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Railway CLI not found. Installing...
    npm install -g @railway/cli
)

echo.
echo [Step 2] Logging into Railway...
railway whoami
if %ERRORLEVEL% NEQ 0 (
    echo Please login to Railway...
    railway login
)

echo.
echo [Step 3] Linking project...
railway link

echo.
echo [Step 4] Setting environment variables...
echo Please set these variables in Railway dashboard:
echo - DATABASE_URL
echo - MONGODB_URI
echo - REDIS_URL
echo - JWT_SECRET
echo - CLOUDINARY_CLOUD_NAME
echo - CLOUDINARY_API_KEY
echo - CLOUDINARY_API_SECRET
echo - CORS_ORIGIN
echo.
pause

echo.
echo [Step 5] Deploying to Railway...
railway up

echo.
echo [Step 6] Checking deployment status...
railway status

echo.
echo ========================================
echo  Deployment Complete!
echo ========================================
echo.
echo View logs: railway logs
echo Open app: railway open
echo.
pause
