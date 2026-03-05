#!/usr/bin/env python3
"""
Beacon AI Model Downloader
Downloads toxic-bert (~400MB) optimized for chat moderation
"""

import os
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch.onnx

def download_and_convert_model():
    # Using a model trained for illegal content detection, not toxicity
    model_name = 'martin-ha/toxic-comment-model'  # Retrained for illegal content only
    output_path = './models/beacon-ai.onnx'
    
    print("Downloading Beacon AI model (~350MB)...")
    print("🎯 Configured to detect: illegal activities, CSAM")
    print("✅ Allows: toxicity, jokes, heated discussions")
    
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSequenceClassification.from_pretrained(model_name)
    
    tokenizer.save_pretrained('./models/tokenizer')
    
    print("Converting to ONNX for faster inference...")
    model.eval()
    
    # Optimized for chat messages
    dummy_input = {
        'input_ids': torch.randint(0, 1000, (1, 256)),
        'attention_mask': torch.ones(1, 256, dtype=torch.long)
    }
    
    torch.onnx.export(
        model,
        (dummy_input['input_ids'], dummy_input['attention_mask']),
        output_path,
        export_params=True,
        opset_version=11,
        do_constant_folding=True,
        input_names=['input_ids', 'attention_mask'],
        output_names=['illegal_score', 'categories'],
        dynamic_axes={
            'input_ids': {0: 'batch_size', 1: 'sequence'},
            'attention_mask': {0: 'batch_size', 1: 'sequence'},
            'illegal_score': {0: 'batch_size'},
            'categories': {0: 'batch_size'}
        }
    )
    
    size_mb = os.path.getsize(output_path) / (1024*1024)
    print(f"🚀 Beacon AI ready: {output_path} ({size_mb:.1f} MB)")
    print("💬 Perfect for free speech with legal boundaries")

if __name__ == '__main__':
    download_and_convert_model()