#!/bin/bash

# ClawCloud Multi-Service Startup
# Runs Redis + AI Service with memory limits

echo "[ClawCloud] Starting multi-service container..."

# Start Redis with memory limit (140MB)
redis-server --maxmemory 140mb --maxmemory-policy allkeys-lru --daemonize yes --port 6379

# Wait for Redis to start
sleep 2

# Verify Redis is running
redis-cli ping

echo "[ClawCloud] Services starting with memory allocation:"
echo "  - AI Model (ONNX): 420MB"
echo "  - Media Processing: 210MB"
echo "  - Redis Cache: 120MB"
echo "  - Runtime overhead: 84MB"
echo "  - Total target: 834MB / 1112MB"

export OMP_NUM_THREADS=1
export ORT_NUM_THREADS=1
export BEACON_AI_TARGET_MB=834
export BEACON_AI_MAX_CONCURRENCY=1

# Start the main AI service
python clawcloud_service.py