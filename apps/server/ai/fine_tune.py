#!/usr/bin/env python3
"""
Beacon AI Fine-Tuning Script
Lightweight fine-tuning for content moderation models
"""

import json
import sys
import torch
import numpy as np
from transformers import AutoTokenizer, AutoModelForSequenceClassification, Trainer, TrainingArguments
from torch.utils.data import Dataset
import onnx
import torch.onnx

class ModerationDataset(Dataset):
    def __init__(self, data, tokenizer, max_length=512):
        self.data = data
        self.tokenizer = tokenizer
        self.max_length = max_length
    
    def __len__(self):
        return len(self.data)
    
    def __getitem__(self, idx):
        item = self.data[idx]
        encoding = self.tokenizer(
            item['input'],
            truncation=True,
            padding='max_length',
            max_length=self.max_length,
            return_tensors='pt'
        )
        
        return {
            'input_ids': encoding['input_ids'].flatten(),
            'attention_mask': encoding['attention_mask'].flatten(),
            'labels': torch.tensor(item['output']['toxicity'], dtype=torch.float)
        }

def fine_tune_model(training_data_path, model_output_path):
    # Load training data
    with open(training_data_path, 'r') as f:
        training_data = json.load(f)
    
    # Initialize model and tokenizer
    model_name = 'distilbert-base-uncased'
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSequenceClassification.from_pretrained(
        model_name, 
        num_labels=1,
        problem_type="regression"
    )
    
    # Create dataset
    dataset = ModerationDataset(training_data, tokenizer)
    
    # Training arguments
    training_args = TrainingArguments(
        output_dir='./fine_tuned_model',
        num_train_epochs=3,
        per_device_train_batch_size=8,
        warmup_steps=100,
        weight_decay=0.01,
        logging_dir='./logs',
        save_steps=500,
        eval_steps=500,
        logging_steps=100,
        load_best_model_at_end=True,
    )
    
    # Create trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=dataset,
        tokenizer=tokenizer,
    )
    
    # Fine-tune
    trainer.train()
    
    # Export to ONNX
    model.eval()
    dummy_input = {
        'input_ids': torch.randint(0, 1000, (1, 512)),
        'attention_mask': torch.ones(1, 512)
    }
    
    torch.onnx.export(
        model,
        (dummy_input['input_ids'], dummy_input['attention_mask']),
        model_output_path,
        export_params=True,
        opset_version=11,
        do_constant_folding=True,
        input_names=['input_ids', 'attention_mask'],
        output_names=['toxicity', 'sentiment', 'categories'],
        dynamic_axes={
            'input_ids': {0: 'batch_size'},
            'attention_mask': {0: 'batch_size'},
            'toxicity': {0: 'batch_size'},
            'sentiment': {0: 'batch_size'},
            'categories': {0: 'batch_size'}
        }
    )
    
    print(f"Model fine-tuned and exported to {model_output_path}")

def main():
    if len(sys.argv) != 3:
        print("Usage: python fine_tune.py <training_data.json> <output_model.onnx>")
        sys.exit(1)
    
    training_data_path = sys.argv[1]
    model_output_path = sys.argv[2]
    
    fine_tune_model(training_data_path, model_output_path)

if __name__ == '__main__':
    main()