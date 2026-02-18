#!/usr/bin/env bash
set -euo pipefail

# Simple deploy script for ClawCloud Run
# Assumes `gcloud` (or ClawCloud Run compatible CLI) is installed and authenticated, and the project is set.

SERVICE_NAME="beacon-server"
REGION="us-central1"
IMAGE="gcr.io/$(gcloud config get-value project)/${SERVICE_NAME}:$(date +%s)"

echo "Building Docker image ${IMAGE}..."
docker build -t "${IMAGE}" -f ./apps/server/Dockerfile ./apps/server

echo "Pushing image..."
docker push "${IMAGE}"

echo "Deploying to Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --port 8080

echo "Deployment complete. Service URL:" 
gcloud run services describe "${SERVICE_NAME}" --region "${REGION}" --format="value(status.url)"
