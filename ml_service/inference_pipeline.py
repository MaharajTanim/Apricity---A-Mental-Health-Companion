"""
Apricity Inference Pipeline
Standalone script with preprocessing functions extracted from notebook
Loads models once at startup and provides inference functions
"""

import os
import json
import sys
import logging
from typing import Dict, List, Tuple, Optional
from pathlib import Path

import torch
import numpy as np
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    AutoModelForSeq2SeqLM
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global variables for models and tokenizers
emotion_model = None
emotion_tokenizer = None
generation_model = None
generation_tokenizer = None
label_names = []
device = None

# Configuration from environment
MODEL_PATH = os.getenv("MODEL_PATH", "SamLowe/roberta-base-go_emotions")
GENERATION_MODEL_PATH = os.getenv("GENERATION_MODEL_PATH", "google/flan-t5-base")
MAX_LENGTH = int(os.getenv("MAX_LENGTH", "192"))
MAX_NEW_TOKENS = int(os.getenv("MAX_NEW_TOKENS", "160"))
NUM_BEAMS = int(os.getenv("NUM_BEAMS", "4"))
TEMPERATURE = float(os.getenv("TEMPERATURE", "0.7"))
TOP_P = float(os.getenv("TOP_P", "0.92"))
THRESHOLD = float(os.getenv("THRESHOLD", "0.5"))

# Safety keywords
SELF_HARM_KEYWORDS = [
    "suicide", "kill myself", "end my life", "harm myself", "self harm", "self-harm",
    "overdose", "no reason to live", "goodbye forever", "want to die"
]


def initialize_device():
    """
    Detect and initialize device (GPU/CPU)
    Returns: torch.device
    """
    if torch.cuda.is_available():
        device = torch.device("cuda")
        logger.info(f"CUDA available. Using GPU: {torch.cuda.get_device_name(0)}")
        logger.info(f"GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")
    else:
        device = torch.device("cpu")
        logger.info("CUDA not available. Using CPU")
    
    return device


def load_models():
    """
    Load emotion detection and response generation models at startup
    This should be called once when the application starts
    """
    global emotion_model, emotion_tokenizer, generation_model, generation_tokenizer
    global label_names, device
    
    logger.info("=" * 60)
    logger.info("Initializing Apricity Inference Pipeline")
    logger.info("=" * 60)
    
    # Initialize device
    device = initialize_device()
    
    try:
        # Load emotion detection model (DeBERTa)
        logger.info(f"Loading emotion model from: {MODEL_PATH}")
        emotion_tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH, use_fast=True)
        emotion_model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
        emotion_model.to(device)
        emotion_model.eval()
        logger.info("✓ Emotion detection model loaded successfully")
        
        # Load label names
        labels_path = os.path.join(MODEL_PATH, "labels.json")
        if os.path.exists(labels_path):
            with open(labels_path, 'r') as f:
                label_map = json.load(f)
                label_names = [label_map[str(i)] for i in range(len(label_map))]
            logger.info(f"✓ Loaded {len(label_names)} emotion labels")
        else:
            logger.warning(f"labels.json not found at {labels_path}, using model config")
            label_names = list(emotion_model.config.id2label.values())
        
        # Load generation model (FLAN-T5)
        logger.info(f"Loading generation model: {GENERATION_MODEL_PATH}")
        generation_tokenizer = AutoTokenizer.from_pretrained(GENERATION_MODEL_PATH)
        generation_model = AutoModelForSeq2SeqLM.from_pretrained(GENERATION_MODEL_PATH)
        generation_model.to(device)
        generation_model.eval()
        logger.info("✓ Response generation model loaded successfully")
        
        logger.info("=" * 60)
        logger.info("All models loaded successfully!")
        logger.info(f"Device: {device}")
        logger.info(f"Emotion labels: {len(label_names)}")
        logger.info("=" * 60)
        
        return True
        
    except Exception as e:
        logger.error(f"Failed to load models: {str(e)}", exc_info=True)
        return False


def clean_text(text: str) -> str:
    """
    Clean and preprocess input text
    
    Args:
        text: Raw input text
        
    Returns:
        Cleaned text string
    """
    if not text:
        return ""
    
    # Strip whitespace
    text = text.strip()
    
    # Remove excessive whitespace
    text = " ".join(text.split())
    
    # Truncate to reasonable length (10000 chars)
    if len(text) > 10000:
        text = text[:10000]
        logger.warning(f"Text truncated to 10000 characters")
    
    return text


def tokenize(text: str, max_length: int = None) -> Dict:
    """
    Tokenize text for emotion detection model
    
    Args:
        text: Cleaned input text
        max_length: Maximum sequence length (default: MAX_LENGTH from config)
        
    Returns:
        Dictionary with input_ids, attention_mask tensors
    """
    if max_length is None:
        max_length = MAX_LENGTH
    
    if emotion_tokenizer is None:
        raise RuntimeError("Tokenizer not loaded. Call load_models() first.")
    
    # Tokenize with truncation and padding
    inputs = emotion_tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        max_length=max_length,
        padding=True
    )
    
    # Move to device
    inputs = {k: v.to(device) for k, v in inputs.items()}
    
    return inputs


def infer(text: str, threshold: float = None) -> Dict:
    """
    Run inference on text to detect emotions
    
    Args:
        text: Input text (will be cleaned and tokenized)
        threshold: Threshold for multi-label prediction (default: THRESHOLD from config)
        
    Returns:
        Dictionary containing:
            - top_label: Primary detected emotion
            - confidence: Confidence score of top emotion
            - all_emotions: List of all detected emotions above threshold
            - scores: Dictionary mapping emotion names to scores
            - raw_logits: Raw model output (numpy array)
            - raw_probs: Sigmoid probabilities (numpy array)
    """
    if threshold is None:
        threshold = THRESHOLD
    
    if emotion_model is None:
        raise RuntimeError("Model not loaded. Call load_models() first.")
    
    # Step 1: Clean text
    cleaned_text = clean_text(text)
    
    if not cleaned_text:
        raise ValueError("Empty text after cleaning")
    
    # Step 2: Tokenize
    inputs = tokenize(cleaned_text)
    
    # Step 3: Run inference
    emotion_model.eval()
    with torch.no_grad():
        outputs = emotion_model(**inputs)
        logits = outputs.logits
    
    # Step 4: Convert logits to probabilities
    sigmoid = torch.sigmoid(logits)
    probs = sigmoid.squeeze().cpu().numpy()
    
    # Step 5: Multi-label prediction (threshold at 0.5 or custom)
    predictions = (sigmoid > threshold).int().squeeze().cpu().numpy()
    
    # Step 6: Get detected emotions
    if len(predictions.shape) == 0:  # Single prediction
        predictions = predictions.reshape(1)
    
    detected_emotions = [
        label_names[i] for i, pred in enumerate(predictions) if pred == 1
    ]
    
    # Step 7: Get top emotion (highest score)
    top_idx = np.argmax(probs)
    top_label = label_names[top_idx]
    confidence = float(probs[top_idx])
    
    # Fallback: if no emotions detected above threshold, use top emotion
    if not detected_emotions:
        detected_emotions = [top_label]
    
    # Step 8: Create scores dictionary
    scores = {label_names[i]: float(probs[i]) for i in range(len(label_names))}
    
    return {
        "top_label": top_label,
        "confidence": confidence,
        "all_emotions": detected_emotions,
        "scores": scores,
        "raw_logits": logits.squeeze().cpu().numpy().tolist(),
        "raw_probs": probs.tolist()
    }


def generate_response(
    text: str,
    emotions: List[str],
    user_name: Optional[str] = None,
    max_new_tokens: int = None,
    num_beams: int = None,
    temperature: float = None,
    top_p: float = None
) -> str:
    """
    Generate supportive CBT-style response based on text and detected emotions
    
    Args:
        text: Original user text
        emotions: List of detected emotions
        user_name: Optional user name for personalization
        max_new_tokens: Maximum tokens to generate
        num_beams: Number of beams for beam search
        temperature: Sampling temperature
        top_p: Top-p sampling parameter
        
    Returns:
        Generated supportive response text
    """
    if generation_model is None:
        raise RuntimeError("Generation model not loaded. Call load_models() first.")
    
    # Use config defaults if not specified
    if max_new_tokens is None:
        max_new_tokens = MAX_NEW_TOKENS
    if num_beams is None:
        num_beams = NUM_BEAMS
    if temperature is None:
        temperature = TEMPERATURE
    if top_p is None:
        top_p = TOP_P
    
    # Create emotion string
    emotion_str = ", ".join(emotions)
    
    # Build prompt
    who = f"{user_name}, " if user_name else "friend"
    
    prompt = f"""
You are Apricity, a warm, non-judgmental mental health companion using CBT techniques.
Detected emotions: {emotion_str}.
User text: "{text[:500]}"

Task: Write a concise, supportive reply addressing the user as {who}. The reply must contain these three structured sections:
1) **Validation (1 sentence):** Acknowledge the user's feelings, mentioning the primary detected emotions.
2) **Cognitive Reframing (1-2 sentences):** Gently identify a possible thinking pattern and offer a balanced alternative perspective.
3) **Actionable Step (1 sentence):** Suggest one practical, small CBT-style coping mechanism.

Keep the total reply concise (80–140 words). Ensure safety advice for self-harm is mentioned if needed.

Reply:
"""
    
    # Tokenize prompt
    inputs = generation_tokenizer(prompt, return_tensors="pt").to(device)
    
    # Generate response
    with torch.no_grad():
        outputs = generation_model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            num_beams=num_beams,
            do_sample=False,  # Disable sampling with beam search
            top_p=top_p,
            temperature=temperature
        )
    
    response = generation_tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    return response.strip()


def check_crisis_keywords(text: str) -> bool:
    """
    Check if text contains crisis/self-harm keywords
    
    Args:
        text: Input text to check
        
    Returns:
        True if crisis keywords detected, False otherwise
    """
    text_lower = text.lower()
    return any(keyword in text_lower for keyword in SELF_HARM_KEYWORDS)


def full_pipeline(
    text: str,
    user_name: Optional[str] = None,
    include_crisis_check: bool = True
) -> Dict:
    """
    Complete inference pipeline: emotion detection + response generation
    
    Args:
        text: Input text
        user_name: Optional user name
        include_crisis_check: Whether to check for crisis keywords
        
    Returns:
        Dictionary containing:
            - input_text: Original text
            - cleaned_text: Cleaned version of text
            - emotion_results: Results from infer()
            - generated_response: Supportive response
            - crisis_detected: Boolean indicating crisis keywords
            - final_response: Response with crisis banner if needed
    """
    # Clean text
    cleaned_text = clean_text(text)
    
    # Detect emotions
    emotion_results = infer(cleaned_text)
    
    # Generate response
    response = generate_response(
        cleaned_text,
        emotion_results["all_emotions"],
        user_name
    )
    
    # Check for crisis
    crisis_detected = False
    final_response = response
    
    if include_crisis_check and check_crisis_keywords(cleaned_text):
        crisis_detected = True
        crisis_banner = (
            "⚠️ If you're in immediate danger or thinking about harming yourself, "
            "please contact local emergency services right now and reach out to someone you trust. "
            "You deserve help and you're not alone. "
            "National Suicide Prevention Lifeline: 988"
        )
        final_response = f"{crisis_banner}\n\n{response}"
    
    return {
        "input_text": text,
        "cleaned_text": cleaned_text,
        "emotion_results": emotion_results,
        "generated_response": response,
        "crisis_detected": crisis_detected,
        "final_response": final_response
    }


def save_predictions_json(results: Dict, output_path: str):
    """
    Save prediction results to JSON file
    
    Args:
        results: Results dictionary from full_pipeline() or infer()
        output_path: Path to save JSON file
    """
    try:
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Predictions saved to: {output_path}")
        
    except Exception as e:
        logger.error(f"Failed to save predictions: {str(e)}", exc_info=True)
        raise


def batch_infer(texts: List[str], output_path: Optional[str] = None) -> List[Dict]:
    """
    Run inference on multiple texts
    
    Args:
        texts: List of input texts
        output_path: Optional path to save results as JSON
        
    Returns:
        List of result dictionaries
    """
    results = []
    
    for i, text in enumerate(texts):
        logger.info(f"Processing text {i+1}/{len(texts)}")
        try:
            result = full_pipeline(text)
            results.append(result)
        except Exception as e:
            logger.error(f"Error processing text {i+1}: {str(e)}")
            results.append({
                "input_text": text,
                "error": str(e)
            })
    
    if output_path:
        save_predictions_json({"predictions": results}, output_path)
    
    return results


# Command-line interface
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Apricity Inference Pipeline - Emotion Detection & Response Generation"
    )
    parser.add_argument(
        "--text",
        type=str,
        help="Input text for inference"
    )
    parser.add_argument(
        "--input-file",
        type=str,
        help="Path to input file (one text per line)"
    )
    parser.add_argument(
        "--output",
        type=str,
        default="predictions.json",
        help="Output JSON file path (default: predictions.json)"
    )
    parser.add_argument(
        "--user-name",
        type=str,
        help="User name for personalized response"
    )
    parser.add_argument(
        "--emotion-only",
        action="store_true",
        help="Only detect emotions, skip response generation"
    )
    
    args = parser.parse_args()
    
    # Load models at startup
    logger.info("Loading models...")
    if not load_models():
        logger.error("Failed to load models. Exiting.")
        sys.exit(1)
    
    # Process input
    if args.text:
        # Single text inference
        logger.info("Running inference on provided text...")
        
        if args.emotion_only:
            result = infer(args.text)
        else:
            result = full_pipeline(args.text, args.user_name)
        
        # Print results
        print("\n" + "=" * 60)
        print("RESULTS")
        print("=" * 60)
        print(json.dumps(result, indent=2))
        
        # Save to file
        save_predictions_json(result, args.output)
        
    elif args.input_file:
        # Batch inference from file
        logger.info(f"Reading texts from: {args.input_file}")
        
        with open(args.input_file, 'r', encoding='utf-8') as f:
            texts = [line.strip() for line in f if line.strip()]
        
        logger.info(f"Processing {len(texts)} texts...")
        results = batch_infer(texts, args.output)
        
        print(f"\nProcessed {len(results)} texts")
        print(f"Results saved to: {args.output}")
        
    else:
        parser.print_help()
        print("\nExample usage:")
        print('  python inference_pipeline.py --text "I feel anxious today"')
        print('  python inference_pipeline.py --input-file texts.txt --output results.json')
