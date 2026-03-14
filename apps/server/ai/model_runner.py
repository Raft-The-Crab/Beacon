#!/usr/bin/env python3
"""
Beacon AI Model Runner - Lightweight ONNX inference for content moderation
Optimized for <834MB total container memory with low concurrency.
"""

import json
import sys
import os
import numpy as np
import onnxruntime as ort
from transformers import AutoTokenizer
import logging

logging.basicConfig(level=logging.ERROR)

class BeaconAI:
    def __init__(self, model_path):
        # Optimized for text-only chat - faster inference
        self.session = ort.InferenceSession(
            model_path, 
            providers=['CPUExecutionProvider'],
            sess_options=self._get_session_options()
        )
        self.tokenizer = AutoTokenizer.from_pretrained('distilbert-base-uncased')
        self.max_length = 192  # Lower sequence length keeps memory stable
        print("READY", flush=True)
    
    def _get_session_options(self):
        opts = ort.SessionOptions()
        opts.intra_op_num_threads = int(os.getenv('ORT_NUM_THREADS', '1'))
        opts.inter_op_num_threads = 1
        opts.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
        return opts
    
    def analyze(self, content):
        # Fast tokenization for chat messages
        inputs = self.tokenizer(
            content[:700],  # Smaller payload keeps tokenization memory lower
            max_length=self.max_length, 
            truncation=True, 
            padding='max_length', 
            return_tensors='np'
        )
        
        # Optimized inference
        outputs = self.session.run(None, {
            'input_ids': inputs['input_ids'].astype(np.int64),
            'attention_mask': inputs['attention_mask'].astype(np.int64)
        })
        
        # Only check for illegal activities and CSAM - everything else is allowed
        illegal_score = float(outputs[0][0][0])
        
        # Detect specific illegal patterns
        categories = []
        if len(outputs) > 1:
            category_scores = outputs[1][0]
            # Only flag actual illegal content, not toxicity/jokes
            if category_scores[0] > 0.8:  # CSAM detection
                categories.append('csam')
            if category_scores[1] > 0.8:  # Illegal activities
                categories.append('illegal')
        
        return {
            'illegal_score': illegal_score,
            'categories': categories,
            'confidence': illegal_score if categories else 0.1
        }

def main():
    if len(sys.argv) != 2:
        sys.exit(1)
    
    model_path = sys.argv[1]
    ai = BeaconAI(model_path)
    
    try:
        for line in sys.stdin:
            data = json.loads(line.strip())
            result = ai.analyze(data['content'])
            print(json.dumps(result), flush=True)
    except KeyboardInterrupt:
        pass
    except Exception as e:
        print(json.dumps({'error': str(e)}), flush=True)

if __name__ == '__main__':
    main()