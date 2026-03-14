#!/usr/bin/env python3
"""
Beacon AI ClawCloud Service
Flask HTTP API for audio/media extraction and optional content analysis.
Designed for ClawCloud: 0.6 vCPU, 1112 MB RAM, Singapore region.
"""

import os
import json
import subprocess
import hashlib
import logging
from urllib.parse import urlparse

import redis
from flask import Flask, request, jsonify

logging.basicConfig(level=logging.INFO, format='[%(levelname)s] %(message)s')
log = logging.getLogger(__name__)

app = Flask(__name__)

# ── Redis ──────────────────────────────────────────────────────────────────────
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')
_redis = None
try:
    _redis = redis.from_url(REDIS_URL, decode_responses=True, socket_connect_timeout=5)
    _redis.ping()
    log.info('Redis connected')
except Exception as e:
    log.warning(f'Redis unavailable, caching disabled: {e}')
    _redis = None


def _cache_get(key: str):
    if _redis is None:
        return None
    try:
        return _redis.get(key)
    except Exception:
        return None


def _cache_set(key: str, value: str, ttl: int = 1800):
    if _redis is None:
        return
    try:
        _redis.set(key, value, ex=ttl)
    except Exception:
        pass


# ── Optional ONNX model ────────────────────────────────────────────────────────
_ai = None
try:
    from model_runner import BeaconAI
    model_path = os.getenv('MODEL_PATH', './models/moderation.onnx')
    if os.path.exists(model_path):
        _ai = BeaconAI(model_path)
        log.info(f'AI model loaded: {model_path}')
    else:
        log.info('No ONNX model found — AI moderation disabled (safe fallback)')
except Exception as e:
    log.warning(f'AI model unavailable: {e}')


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.get('/health')
def health():
    return jsonify({
        'status': 'ok',
        'service': 'beacon-ai',
        'ai_model': _ai is not None,
        'redis': _redis is not None,
    })


@app.post('/extract')
def extract():
    """Extract a direct audio URL from a public media page (YouTube, SoundCloud, etc.)."""
    data = request.get_json(silent=True) or {}
    url = (data.get('url') or '').strip()

    if not url:
        return jsonify({'success': False, 'error': 'url is required'}), 400

    # SSRF guard — only allow http/https
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ('http', 'https'):
            return jsonify({'success': False, 'error': 'Invalid URL scheme'}), 400
        if not parsed.netloc:
            return jsonify({'success': False, 'error': 'Invalid URL'}), 400
    except Exception:
        return jsonify({'success': False, 'error': 'Invalid URL'}), 400

    cache_key = f'extract:{hashlib.sha256(url.encode()).hexdigest()}'
    cached = _cache_get(cache_key)
    if cached:
        return jsonify(json.loads(cached))

    try:
        result = subprocess.run(
            ['yt-dlp', '--no-playlist', '-j', '--no-warnings', '--socket-timeout', '10', url],
            capture_output=True, text=True, timeout=25
        )
        if result.returncode != 0:
            return jsonify({'success': False, 'error': 'Extraction failed', 'details': result.stderr[:300]})

        info = json.loads(result.stdout)
        formats = info.get('formats', [])

        # Prefer audio-only format
        audio_url = None
        for fmt in reversed(formats):
            if fmt.get('acodec', 'none') != 'none' and fmt.get('vcodec', 'none') == 'none':
                audio_url = fmt.get('url')
                break
        if not audio_url:
            audio_url = info.get('url')

        response = {
            'success': True,
            'url': audio_url,
            'title': info.get('title', ''),
            'duration': info.get('duration'),
            'thumbnail': info.get('thumbnail'),
        }
        _cache_set(cache_key, json.dumps(response))
        return jsonify(response)

    except subprocess.TimeoutExpired:
        return jsonify({'success': False, 'error': 'Extraction timed out'})
    except Exception as e:
        log.error(f'Extraction error: {e}')
        return jsonify({'success': False, 'error': 'Internal error'})


@app.post('/analyze')
def analyze():
    """Run lightweight ONNX content analysis (falls back gracefully if model absent)."""
    if _ai is None:
        return jsonify({'available': False, 'illegal_score': 0.0, 'categories': [], 'confidence': 0.0})

    data = request.get_json(silent=True) or {}
    content = (data.get('content') or '')[:2000]
    if not content:
        return jsonify({'success': False, 'error': 'content is required'}), 400

    try:
        result = _ai.analyze(content)
        result['available'] = True
        return jsonify(result)
    except Exception as e:
        log.error(f'Analysis error: {e}')
        return jsonify({'available': False, 'illegal_score': 0.0, 'categories': [], 'confidence': 0.0})


if __name__ == '__main__':
    port = int(os.getenv('PORT', 8080))
    log.info(f'Beacon AI service starting on :{port}')
    app.run(host='0.0.0.0', port=port, threaded=True)
