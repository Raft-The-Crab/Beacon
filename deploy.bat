@echo off
cls
echo.
echo  ╔════════════════════════════════════════╗
echo  ║   BEACON v1.0 - STABLE RELEASE        ║
echo  ║   Complete Deployment Script          ║
echo  ╚════════════════════════════════════════╝
echo.

:MENU
echo.
echo  What would you like to do?
echo.
echo  [1] Fix IDE Problems
echo  [2] Commit and Push to GitHub
echo  [3] Deploy to Railway
echo  [4] Build Android APK
echo  [5] Build Windows Desktop
echo  [6] Run All (Full Deployment)
echo  [0] Exit
echo.
set /p choice="Enter your choice: "

if "%choice%"=="1" goto FIX_IDE
if "%choice%"=="2" goto GIT_PUSH
if "%choice%"=="3" goto RAILWAY
if "%choice%"=="4" goto ANDROID
if "%choice%"=="5" goto WINDOWS
if "%choice%"=="6" goto ALL
if "%choice%"=="0" goto END
goto MENU

:FIX_IDE
echo.
echo [Running IDE Problem Fixes...]
call scripts\fix-ide-problems.bat
goto MENU

:GIT_PUSH
echo.
echo [Committing and Pushing to GitHub...]
git add .
git commit -m "feat: Beacon v1.0 stable release"
git push origin main
echo.
echo SUCCESS: Code pushed to GitHub!
pause
goto MENU

:RAILWAY
echo.
echo [Deploying to Railway...]
echo.
echo Make sure you have set these environment variables in Railway:
echo - DATABASE_URL
echo - MONGODB_URI  
echo - REDIS_URL
echo - JWT_SECRET
echo - CLOUDINARY credentials
echo - CORS_ORIGIN
echo.
pause
railway up
echo.
echo Checking deployment...
railway logs --tail 50
pause
goto MENU

:ANDROID
echo.
echo [Building Android APK...]
cd apps\mobile
call pnpm build
call npx cap sync android
call npx cap open android
echo.
echo Android Studio will open. Build the APK there.
pause
cd ..\..
goto MENU

:WINDOWS
echo.
echo [Building Windows Desktop...]
cd apps\desktop
call pnpm tauri build
echo.
echo Build complete! Check src-tauri\target\release\
pause
cd ..\..
goto MENU

:ALL
echo.
echo [Running Full Deployment Pipeline...]
echo.
echo Step 1: Fixing IDE Problems...
call scripts\fix-ide-problems.bat

echo.
echo Step 2: Committing to GitHub...
git add .
git commit -m "feat: Beacon v1.0 stable release"
git push origin main

echo.
echo Step 3: Deploying to Railway...
railway up

echo.
echo ========================================
echo  DEPLOYMENT COMPLETE!
echo ========================================
echo.
echo Your app is now live on Railway!
echo Run 'railway open' to view it.
echo.
pause
goto MENU

:END
echo.
echo Thank you for using Beacon Deployment Script!
echo.
exit
