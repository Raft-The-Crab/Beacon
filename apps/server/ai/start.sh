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
echo "  - AI Model (ONNX): 650MB"
echo "  - Media Processing: 250MB" 
echo "  - Redis Cache: 150MB"
echo "  - Total: 1050MB / 1112MB (Safe Margin)"

# Start the main AI service
python clawcloud_service.py