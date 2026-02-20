@echo off
echo ========================================
echo  BEACON - Fix IDE Problems
echo ========================================
echo.

echo [1/4] Checking TypeScript in Web App...
cd apps\web
call pnpm tsc --noEmit
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: TypeScript errors found in web app
) else (
    echo SUCCESS: No TypeScript errors in web app
)

echo.
echo [2/4] Checking TypeScript in Server...
cd ..\server
call pnpm tsc --noEmit
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: TypeScript errors found in server
) else (
    echo SUCCESS: No TypeScript errors in server
)

echo.
echo [3/4] Running ESLint...
cd ..\..\
call pnpm lint 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Note: Some linting issues found (non-critical)
)

echo.
echo [4/4] Checking build...
cd apps\web
call pnpm build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
) else (
    echo SUCCESS: Build completed
)

echo.
echo ========================================
echo  All checks complete!
echo ========================================
echo.
pause
