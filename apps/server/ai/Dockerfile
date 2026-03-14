# ─────────────────────────────────────────────────────────────────────────────
# Beacon AI Service — ClawCloud
# Python Flask service: media extraction (yt-dlp) + ONNX content analysis
# Target: 0.6 vCPU, 1112 MB RAM — Singapore region (asia-southeast1)
# ─────────────────────────────────────────────────────────────────────────────

FROM python:3.11-slim

WORKDIR /app

# System deps:
#   ffmpeg      — media processing / transcoding
#   redis-server — bundled cache (no external Redis needed)
#   tini        — proper PID 1 signal handling
#   curl        — healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    redis-server \
    tini \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Python deps first (layer cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy service files
COPY clawcloud_service.py .
COPY model_runner.py .
COPY start.sh .
COPY download_model.py .

# Models directory (empty at build time; populated at runtime or pre-baked)
RUN mkdir -p models

RUN chmod +x start.sh

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -sf http://localhost:8080/health || exit 1

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["bash", "start.sh"]
