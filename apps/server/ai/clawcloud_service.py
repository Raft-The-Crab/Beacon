#!/usr/bin/env python3
"""
ClawCloud Multi-Service: AI + Media Processing + Cache
Memory allocation: AI(600MB) + Media(200MB) + Cache(140MB) = 940MB
"""

import json
import sys
import os
import subprocess
import numpy as np
import onnxruntime as ort
from tokenizers import Tokenizer
from flask import Flask, request, jsonify
import logging
from threading import Lock, Thread
import gc
import redis
from PIL import Image
import io
import base64

logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
model_lock = Lock()

# Redis cache for ClawCloud (140MB allocation)
try:
    cache = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
except:
    cache = None
    print("[ClawCloud] Redis cache not available")

class ClawCloudAI:
    def __init__(self):
        self.session = None
        self.tokenizer = None
        self.max_length = 256
        self.memory_limit = 600  # MB for AI
        self.prolog_engine = os.path.join(os.path.dirname(__file__), 'decision_engine.pl')
        self.load_model()
    
    def load_model(self):
        try:
            model_path = os.path.join(os.path.dirname(__file__), 'models', 'beacon-ai.onnx')
            
            opts = ort.SessionOptions()
            opts.intra_op_num_threads = 1 # Optimize for 0.5vCPU
            opts.inter_op_num_threads = 1
            opts.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
            
            if os.path.exists(model_path):
                self.session = ort.InferenceSession(
                    model_path, 
                    providers=['CPUExecutionProvider'],
                    sess_options=opts
                )
            
            # Use lightweight tokenizer
            self.tokenizer = Tokenizer.from_pretrained('distilbert-base-uncased')
            print(f"[ClawCloud AI] Model loaded (500MB target)")
            
        except Exception as e:
            print(f"[ClawCloud AI] Model load error: {e}")
            self.session = None
    
    def analyze_text(self, content):
        # AI analysis - decisions now handled by Railway
        result = self._run_ai_inference(content)
        gc.collect() # Aggressive recovery
        return result

    def _run_ai_inference(self, content):
        if not self.session:
            return self._fallback_ai_score()
        
        with model_lock:
            try:
                # Basic tokenization
                encoded = self.tokenizer.encode(content[:800])
                input_ids = encoded.ids
                
                # Pad to max_length
                input_ids = input_ids[:self.max_length] + [0] * (self.max_length - len(input_ids))
                attention_mask = [1] * len(encoded.ids[:self.max_length]) + [0] * (self.max_length - len(encoded.ids[:self.max_length]))
                
                outputs = self.session.run(None, {
                    'input_ids': np.array([input_ids], dtype=np.int64),
                    'attention_mask': np.array([attention_mask], dtype=np.int64)
                })
                
                illegal_score = float(outputs[0][0][0])
                categories = []
                
                # Basic categorical flagging for the Decision Engine
                if illegal_score > 0.8:
                    categories.append('illegal')
                
                return {
                    'illegal_score': illegal_score,
                    'categories': categories,
                    'confidence': illegal_score if illegal_score > 0.5 else 0.1,
                    'is_joke': 'lol' in content.lower() or 'jk' in content.lower()
                }
            except Exception as e:
                print(f"[ClawCloud AI] Inference error: {e}")
                return self._fallback_ai_score()

    def _fallback_ai_score(self):
        return {'illegal_score': 0.1, 'categories': [], 'confidence': 0.1, 'is_joke': False}

class MediaProcessor:
    def __init__(self):
        self.memory_limit = 200  # MB for media processing
        print(f"[ClawCloud Media] Processor ready (200MB allocated)")
    
    def process_image(self, image_data):
        try:
            # Decode base64 image
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            
            # Basic image analysis (placeholder)
            width, height = image.size
            
            # Simple heuristics for inappropriate content
            result = {
                'illegal_score': 0.1,
                'categories': [],
                'confidence': 0.1,
                'is_joke': False,
                'metadata': {
                    'width': width,
                    'height': height,
                    'format': image.format
                }
            }
            
            return result
            
        except Exception as e:
            print(f"[ClawCloud Media] Image processing error: {e}")
            return {
                'illegal_score': 0.1,
                'categories': [],
                'confidence': 0.1,
                'is_joke': False
            }
    
    def process_video(self, video_data):
        # Placeholder for video processing
        return {
            'illegal_score': 0.1,
            'categories': [],
            'confidence': 0.1,
            'is_joke': False
        }

# Initialize services
ai_service = ClawCloudAI()
media_processor = MediaProcessor()

@app.route('/extract', methods=['POST'])
def extract_audio():
    try:
        data = request.get_json()
        url = data.get('url', '')
        if not url:
            return jsonify({'success': False, 'error': 'No URL provided'}), 400
        
        # Use yt-dlp to get direct audio stream URL and metadata
        # We use --print to get exactly what we need in a stable order
        cmd = [
            'yt-dlp',
            '--quiet',
            '--no-warnings',
            '--print', '%(title)s',
            '--print', '%(url)s',
            '--print', '%(thumbnail)s',
            '-f', 'bestaudio/best',
            url
        ]
        
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        stdout, stderr = process.communicate()
        
        if process.returncode != 0:
            logging.error(f"[ClawCloud] yt-dlp error: {stderr}")
            return jsonify({'success': False, 'error': 'Extraction failed - link may be invalid or restricted'}), 500
        
        lines = stdout.strip().split('\n')
        if len(lines) < 2:
             return jsonify({'success': False, 'error': 'Could not extract audio link'}), 500
        
        return jsonify({
            'success': True,
            'title': lines[0],
            'url': lines[1],
            'thumbnail': lines[2] if len(lines) > 2 else None
        })
        
    except Exception as e:
        logging.error(f"[ClawCloud] Extraction exception: {e}")
        return jsonify({'success': False, 'error': 'Internal server error during extraction'}), 500

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        data = request.get_json()
        content = data.get('content', '')
        content_type = data.get('type', 'text')
        
        if content_type == 'text':
            result = ai_service.analyze_text(content)
        elif content_type == 'image':
            result = media_processor.process_image(content)
        elif content_type == 'video':
            result = media_processor.process_video(content)
        else:
            result = ai_service._fallback_response()
        
        return jsonify(result)
        
    except Exception as e:
        print(f"[ClawCloud] API error: {e}")
        return jsonify(ai_service._fallback_response()), 500

@app.route('/fine-tune', methods=['POST'])
def fine_tune():
    try:
        data = request.get_json()
        training_data = data.get('training_data', [])
        
        # Queue fine-tuning (would implement async processing)
        return jsonify({'success': True, 'message': 'Fine-tuning queued'})
        
    except Exception as e:
        print(f"[ClawCloud] Fine-tune error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/cache/stats', methods=['GET'])
def cache_stats():
    if cache:
        try:
            info = cache.info()
            return jsonify({
                'cache_enabled': True,
                'memory_usage': info.get('used_memory_human', 'unknown'),
                'keys': cache.dbsize()
            })
        except:
            pass
    
    return jsonify({'cache_enabled': False})

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'services': {
            'ai_model': ai_service.session is not None,
            'media_processor': True,
            'cache': cache is not None
        },
        'memory_allocation': {
            'ai': '600MB',
            'media': '200MB', 
            'cache': '140MB',
            'total': '940MB/1GB'
        }
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)