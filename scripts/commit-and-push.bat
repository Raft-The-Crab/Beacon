@echo off
echo ========================================
echo  BEACON v1.0 - Git Commit and Push
echo ========================================
echo.

echo [1/5] Adding all files...
git add .

echo.
echo [2/5] Committing changes...
git commit -m "feat: Beacon v1.0 stable release - minimalistic design, Railway ready, app icons, fixed configs"

echo.
echo [3/5] Checking remote...
git remote -v

echo.
echo [4/5] Pushing to GitHub...
git push origin main

echo.
echo [5/5] Verifying push...
git log --oneline -1

echo.
echo ========================================
echo  SUCCESS! Code pushed to GitHub
echo ========================================
echo.
echo Next steps:
echo 1. Deploy to Railway: railway up
echo 2. Check deployment: railway logs
echo 3. Visit your app: railway open
echo.
pause
