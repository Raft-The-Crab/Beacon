@echo off
REM Build ClawCloud AI Docker Image Locally for Windows

echo Building Beacon ClawCloud AI Service...

REM Set variables
set PROJECT_ID=your-gcp-project-id
set IMAGE_NAME=beacon-ai-multi
set TAG=latest
set REGION=us-central1

REM Navigate to AI directory
cd /d "%~dp0"

echo Building Docker image...
docker build -f Dockerfile.clawcloud -t gcr.io/%PROJECT_ID%/%IMAGE_NAME%:%TAG% .

if %ERRORLEVEL% NEQ 0 (
    echo Docker build failed
    exit /b 1
)

echo Docker image built successfully

REM Configure Docker for GCR
echo Configuring Docker for Google Container Registry...
gcloud auth configure-docker

REM Push to GCR
echo Pushing image to GCR...
docker push gcr.io/%PROJECT_ID%/%IMAGE_NAME%:%TAG%

if %ERRORLEVEL% NEQ 0 (
    echo Docker push failed
    exit /b 1
)

echo Image pushed to GCR

REM Deploy to Cloud Run
echo Deploying to Cloud Run...
gcloud run deploy %IMAGE_NAME% ^
  --image gcr.io/%PROJECT_ID%/%IMAGE_NAME%:%TAG% ^
  --platform managed ^
  --region %REGION% ^
  --memory 1Gi ^
  --cpu 0.5 ^
  --max-instances 2 ^
  --allow-unauthenticated ^
  --port 8080

if %ERRORLEVEL% NEQ 0 (
    echo Cloud Run deployment failed
    exit /b 1
)

echo Deployment complete!
echo.
echo ClawCloud AI Service is live!
echo Get the service URL with: gcloud run services describe %IMAGE_NAME% --region %REGION% --format "value(status.url)"

pause