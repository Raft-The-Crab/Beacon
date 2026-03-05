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
echo "  - AI Model: 600MB"
echo "  - Media Processing: 200MB" 
echo "  - Redis Cache: 140MB"
echo "  - Total: 940MB/1GB"

# Start the main AI service
python clawcloud_service.py