# Quick Start Guide - Apricity Inference Pipeline

## 🚀 Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
cd ml_service
pip install torch transformers numpy
```

### 2. Set Model Path

```bash
# Option A: Use HuggingFace DeBERTa model (recommended)
export MODEL_PATH="microsoft/deberta-v3-base"

# Option B: Use local fine-tuned model
# export MODEL_PATH="./models/apricity-emotion-deberta/best"
```

### 3. Run Examples

```bash
python examples.py
```

## 📝 Quick Examples

### Single Text Analysis

```python
from inference_pipeline import load_models, infer

# Load models once
load_models()

# Analyze text
result = infer("I feel anxious about tomorrow")
print(f"Emotion: {result['top_label']}")
print(f"Confidence: {result['confidence']:.2f}")
```

### With Response Generation

```python
from inference_pipeline import load_models, full_pipeline

load_models()

result = full_pipeline(
    "I'm overwhelmed with work",
    user_name="Alex"
)

print(result['final_response'])
```

### Command Line

```bash
# Analyze single text
python inference_pipeline.py \
  --text "I feel happy today" \
  --output result.json

# Batch process
echo "Text 1" > input.txt
echo "Text 2" >> input.txt
python inference_pipeline.py \
  --input-file input.txt \
  --output batch.json
```

## 🔧 Common Tasks

### Check if Models Loaded

```python
from inference_pipeline import emotion_model, device

if emotion_model is None:
    print("Models not loaded!")
else:
    print(f"Models ready on {device}")
```

### Get All Emotion Scores

```python
result = infer("some text")
for emotion, score in result['scores'].items():
    if score > 0.1:  # Show emotions > 10%
        print(f"{emotion}: {score:.2%}")
```

### Save Results

```python
from inference_pipeline import full_pipeline, save_predictions_json

result = full_pipeline("text")
save_predictions_json(result, "output.json")
```

## 🎯 Use Cases

### 1. Diary Entry Analysis

```python
diary_text = """
Today was really tough. I felt overwhelmed
at work and couldn't focus on anything.
"""

result = full_pipeline(diary_text)
print(f"Emotions: {result['emotion_results']['all_emotions']}")
print(f"Support: {result['final_response']}")
```

### 2. Batch Processing CSV

```python
import pandas as pd
from inference_pipeline import load_models, batch_infer

load_models()

df = pd.read_csv("diary.csv")
results = batch_infer(df["text"].tolist())

df["emotion"] = [r["emotion_results"]["top_label"] for r in results]
df.to_csv("analyzed.csv")
```

### 3. Real-time API

```python
from fastapi import FastAPI
from inference_pipeline import load_models, infer

app = FastAPI()
load_models()  # Load once at startup

@app.post("/analyze")
def analyze(text: str):
    return infer(text)
```

## 🐛 Troubleshooting

### "Model not loaded" error

```python
# Always call load_models() first
from inference_pipeline import load_models
load_models()
```

### GPU not detected

```bash
# Check CUDA
python -c "import torch; print(torch.cuda.is_available())"

# Force CPU
export CUDA_VISIBLE_DEVICES=""
```

### Memory error

```python
# Reduce batch size or use CPU
import torch
torch.cuda.empty_cache()
```

## 📊 Output Format

```json
{
  "top_label": "anxiety",
  "confidence": 0.78,
  "all_emotions": ["anxiety", "nervousness"],
  "scores": {
    "anxiety": 0.78,
    "nervousness": 0.54,
    "joy": 0.12,
    ...
  }
}
```

## ⚡ Performance Tips

1. **Load models once** at application startup
2. **Batch processing** for multiple texts
3. **Use GPU** for 10x speedup
4. **Cache results** for duplicate texts
5. **Async processing** for web apps

## 📚 Next Steps

- Read full docs: `INFERENCE_PIPELINE.md`
- Run examples: `python examples.py`
- Test service: `python test_service.py`
- Start server: `python predict_server.py`

## 🔗 Related Scripts

- `inference_pipeline.py` - Main inference functions
- `predict_server.py` - FastAPI REST API server
- `examples.py` - Usage examples
- `test_service.py` - Service tests
