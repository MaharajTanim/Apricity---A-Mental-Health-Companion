# Apricity Inference Pipeline

Standalone Python script extracted from the BERT + FLAN-T5 training notebook, providing reusable functions for emotion detection and response generation.

## Features

- ✅ **Modular Functions**: `clean_text()`, `tokenize()`, `infer()`, `generate_response()`, `full_pipeline()`
- ✅ **Single Model Loading**: Models loaded once at startup (not per request)
- ✅ **GPU/CPU Detection**: Automatically detects and uses CUDA if available
- ✅ **Environment Configuration**: All settings via environment variables
- ✅ **JSON Output**: Save predictions to JSON files
- ✅ **Batch Processing**: Process multiple texts efficiently
- ✅ **CLI Interface**: Use as command-line tool
- ✅ **Crisis Detection**: Automatic detection of self-harm keywords

## Installation

```bash
# Ensure you're in the ml_service directory
cd ml_service

# Install dependencies (if not already installed)
pip install -r requirements.txt
```

## Configuration

Set environment variables or use defaults:

```bash
# Model paths
export MODEL_PATH="./models/apricity-emotion-bert/best"
export GENERATION_MODEL_PATH="google/flan-t5-base"

# Inference parameters
export MAX_LENGTH=192
export MAX_NEW_TOKENS=160
export NUM_BEAMS=4
export TEMPERATURE=0.7
export TOP_P=0.92
export THRESHOLD=0.5  # Multi-label detection threshold
```

## Usage

### 1. As a Python Module

```python
from inference_pipeline import (
    load_models,
    clean_text,
    tokenize,
    infer,
    generate_response,
    full_pipeline,
    save_predictions_json
)

# Load models once at startup
load_models()

# Clean text
text = "I'm feeling really anxious about my presentation tomorrow."
cleaned = clean_text(text)

# Detect emotions only
emotion_results = infer(cleaned)
print(f"Top emotion: {emotion_results['top_label']}")
print(f"Confidence: {emotion_results['confidence']:.3f}")
print(f"All emotions: {emotion_results['all_emotions']}")

# Full pipeline (emotion + response)
result = full_pipeline(text, user_name="Alex")
print(result['final_response'])

# Save to JSON
save_predictions_json(result, "prediction.json")
```

### 2. Command Line Interface

**Single text inference:**

```bash
python inference_pipeline.py \
  --text "I feel overwhelmed with everything going on" \
  --user-name "Alex" \
  --output result.json
```

**Emotion detection only:**

```bash
python inference_pipeline.py \
  --text "Today was a great day!" \
  --emotion-only \
  --output emotions.json
```

**Batch processing from file:**

```bash
# Create input file (one text per line)
cat > texts.txt << EOF
I'm feeling anxious about tomorrow.
Today was amazing! Everything went well.
I feel so overwhelmed and don't know what to do.
EOF

# Process all texts
python inference_pipeline.py \
  --input-file texts.txt \
  --output batch_results.json
```

## Function Reference

### `load_models()`

Load emotion detection and response generation models at startup.

- **Returns**: `bool` - True if successful
- **Must be called once before using other functions**

### `clean_text(text: str) -> str`

Clean and preprocess input text.

- Strips whitespace
- Removes excessive spaces
- Truncates to 10000 characters
- **Args**: `text` - Raw input text
- **Returns**: Cleaned text string

### `tokenize(text: str, max_length: int = 192) -> Dict`

Tokenize text for emotion detection model.

- **Args**:
  - `text` - Cleaned input text
  - `max_length` - Maximum sequence length
- **Returns**: Dictionary with `input_ids` and `attention_mask` tensors

### `infer(text: str, threshold: float = 0.5) -> Dict`

Run emotion detection inference on text.

- **Args**:
  - `text` - Input text (automatically cleaned and tokenized)
  - `threshold` - Multi-label detection threshold
- **Returns**: Dictionary containing:
  ```python
  {
    "top_label": "anxiety",           # Primary emotion
    "confidence": 0.78,               # Confidence score
    "all_emotions": ["anxiety", ...], # All detected emotions
    "scores": {                       # All emotion scores
      "joy": 0.12,
      "sadness": 0.65,
      ...
    },
    "raw_logits": [...],              # Raw model outputs
    "raw_probs": [...]                # Sigmoid probabilities
  }
  ```

### `generate_response(text, emotions, user_name=None, ...) -> str`

Generate supportive CBT-style response.

- **Args**:
  - `text` - Original user text
  - `emotions` - List of detected emotions
  - `user_name` - Optional user name for personalization
  - `max_new_tokens`, `num_beams`, `temperature`, `top_p` - Generation parameters
- **Returns**: Generated supportive response text

### `full_pipeline(text, user_name=None, include_crisis_check=True) -> Dict`

Complete pipeline: emotion detection + response generation.

- **Args**:
  - `text` - Input text
  - `user_name` - Optional user name
  - `include_crisis_check` - Check for crisis keywords
- **Returns**: Dictionary with all results including crisis detection

### `save_predictions_json(results: Dict, output_path: str)`

Save prediction results to JSON file.

- **Args**:
  - `results` - Results dictionary from inference
  - `output_path` - Path to save JSON file

### `batch_infer(texts: List[str], output_path: str = None) -> List[Dict]`

Run inference on multiple texts.

- **Args**:
  - `texts` - List of input texts
  - `output_path` - Optional path to save results
- **Returns**: List of result dictionaries

### `check_crisis_keywords(text: str) -> bool`

Check if text contains crisis/self-harm keywords.

- **Args**: `text` - Input text to check
- **Returns**: True if crisis keywords detected

## Output Format

### Emotion Detection Output

```json
{
  "top_label": "anxiety",
  "confidence": 0.78,
  "all_emotions": ["anxiety", "nervousness", "fear"],
  "scores": {
    "admiration": 0.02,
    "amusement": 0.01,
    "anger": 0.05,
    "annoyance": 0.12,
    "anxiety": 0.78,
    "nervousness": 0.54,
    "fear": 0.42,
    ...
  }
}
```

### Full Pipeline Output

```json
{
  "input_text": "I'm feeling really anxious about...",
  "cleaned_text": "I'm feeling really anxious about...",
  "emotion_results": {
    "top_label": "anxiety",
    "confidence": 0.78,
    "all_emotions": ["anxiety", "nervousness"],
    "scores": {...}
  },
  "generated_response": "I understand you're feeling anxious...",
  "crisis_detected": false,
  "final_response": "I understand you're feeling anxious..."
}
```

## Performance

- **Cold start**: 2-3 seconds (model loading)
- **Inference**: ~100-500ms per text
- **GPU**: 10x faster than CPU
- **Memory**: ~2GB for models

## Device Detection

The script automatically detects and uses the best available device:

```python
# Automatically uses CUDA if available
device = initialize_device()

# Logs device information:
# "CUDA available. Using GPU: Tesla T4"
# "GPU Memory: 15.00 GB"
# OR
# "CUDA not available. Using CPU"
```

## Error Handling

All functions include comprehensive error handling:

```python
try:
    result = infer("my text")
except RuntimeError as e:
    # Model not loaded
    print(f"Error: {e}")
except ValueError as e:
    # Invalid input (e.g., empty text)
    print(f"Error: {e}")
```

## Integration Examples

### FastAPI Integration

```python
from fastapi import FastAPI
from inference_pipeline import load_models, full_pipeline

app = FastAPI()

@app.on_event("startup")
async def startup():
    load_models()

@app.post("/analyze")
async def analyze(text: str):
    result = full_pipeline(text)
    return result
```

### Flask Integration

```python
from flask import Flask, request, jsonify
from inference_pipeline import load_models, infer

app = Flask(__name__)

# Load models before first request
with app.app_context():
    load_models()

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    result = infer(data["text"])
    return jsonify(result)
```

### Batch Processing Script

```python
import pandas as pd
from inference_pipeline import load_models, batch_infer

# Load models once
load_models()

# Read CSV
df = pd.read_csv("diary_entries.csv")

# Process all texts
results = batch_infer(df["content"].tolist(), "predictions.json")

# Add results to dataframe
df["top_emotion"] = [r["emotion_results"]["top_label"] for r in results]
df["confidence"] = [r["emotion_results"]["confidence"] for r in results]
df.to_csv("diary_entries_analyzed.csv", index=False)
```

## Troubleshooting

**Models not loading:**

```bash
# Check MODEL_PATH exists
ls -la ./models/apricity-emotion-bert/best/

# Verify labels.json exists
cat ./models/apricity-emotion-bert/best/labels.json
```

**CUDA out of memory:**

```bash
# Use CPU instead
export CUDA_VISIBLE_DEVICES=""
python inference_pipeline.py --text "..."
```

**Import errors:**

```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

## Related Files

- `predict_server.py` - FastAPI server using this pipeline
- `test_service.py` - Automated tests for the service
- `requirements.txt` - Python dependencies
