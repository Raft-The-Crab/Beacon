#!/bin/bash

# Build ClawCloud AI Docker Image Locally
# Since ClawCloud can't connect to GitHub, we build and push from local

echo "🚀 Building Beacon ClawCloud AI Service..."

# Set variables
PROJECT_ID="your-gcp-project-id"
IMAGE_NAME="beacon-ai-multi"
TAG="latest"
REGION="us-central1"

# Navigate to AI directory
cd "$(dirname "$0")"

echo "📦 Building Docker image..."
docker build -f Dockerfile.clawcloud -t gcr.io/${PROJECT_ID}/${IMAGE_NAME}:${TAG} .

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed"
    exit 1
fi

echo "✅ Docker image built successfully"

# Configure Docker for GCR
echo "🔐 Configuring Docker for Google Container Registry..."
gcloud auth configure-docker

# Push to GCR
echo "📤 Pushing image to GCR..."
docker push gcr.io/${PROJECT_ID}/${IMAGE_NAME}:${TAG}

if [ $? -ne 0 ]; then
    echo "❌ Docker push failed"
    exit 1
fi

echo "✅ Image pushed to GCR"

# Deploy to Cloud Run
echo "🌐 Deploying to Cloud Run..."
gcloud run deploy ${IMAGE_NAME} \
  --image gcr.io/${PROJECT_ID}/${IMAGE_NAME}:${TAG} \
  --platform managed \
  --region ${REGION} \
  --memory 1Gi \
  --cpu 0.5 \
  --max-instances 2 \
  --allow-unauthenticated \
  --port 8080

if [ $? -ne 0 ]; then
    echo "❌ Cloud Run deployment failed"
    exit 1
fi

echo "✅ Deployment complete!"
echo ""
echo "🎉 ClawCloud AI Service is live!"
echo "Get the service URL with: gcloud run services describe ${IMAGE_NAME} --region ${REGION} --format 'value(status.url)'"