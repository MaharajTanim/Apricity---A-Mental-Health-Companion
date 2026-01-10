"""
Apricity ML Service - Emotion Detection and Response Generation
FastAPI server for DeBERTa emotion classification and FLAN-T5 response generation
"""

import os
import json
import logging
from typing import Optional, List, Dict
from contextlib import asynccontextmanager

import torch
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
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

# Global model variables
emotion_model = None
emotion_tokenizer = None
generation_model = None
generation_tokenizer = None
label_names = []
device = None

# Configuration
MODEL_PATH = os.getenv("MODEL_PATH", os.getenv("EMOTION_MODEL_PATH", "microsoft/deberta-v3-base"))
GENERATION_MODEL_NAME = os.getenv("GENERATION_MODEL_NAME", "google/flan-t5-base")
MAX_LENGTH = int(os.getenv("MAX_LENGTH", "192"))
MAX_NEW_TOKENS = int(os.getenv("MAX_NEW_TOKENS", "160"))
NUM_BEAMS = int(os.getenv("NUM_BEAMS", "4"))
TEMPERATURE = float(os.getenv("TEMPERATURE", "0.7"))
TOP_P = float(os.getenv("TOP_P", "0.92"))

# Safety keywords for crisis detection
SELF_HARM_KEYWORDS = [
    "suicide", "kill myself", "end my life", "harm myself", "self harm", "self-harm",
    "overdose", "no reason to live", "goodbye forever", "want to die"
]

CRISIS_BANNER = (
    "⚠️ If you're in immediate danger or thinking about harming yourself, "
    "please contact local emergency services right now and reach out to someone you trust. "
    "You deserve help and you're not alone. "
    "National Suicide Prevention Lifeline: 988"
)


# Pydantic Models
class EmotionRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000, description="User input text")
    
    class Config:
        json_schema_extra = {
            "example": {
                "text": "I'm feeling really anxious about my upcoming presentation"
            }
        }


class EmotionResponse(BaseModel):
    emotions: str = Field(..., description="Comma-separated detected emotions")
    confidence: float = Field(..., description="Model confidence score (F1-Micro proxy)")
    all_emotions: List[str] = Field(..., description="List of all detected emotions")


class SupportRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000, description="User input text")
    emotions: Optional[str] = Field(None, description="Detected emotions (optional)")
    user_name: Optional[str] = Field(None, description="User's name for personalization")
    
    class Config:
        json_schema_extra = {
            "example": {
                "text": "I'm feeling really anxious about my upcoming presentation",
                "emotions": "anxiety, nervousness",
                "user_name": "Alex"
            }
        }


class SupportResponse(BaseModel):
    response: str = Field(..., description="Generated supportive response")
    has_crisis_warning: bool = Field(..., description="Whether crisis message was included")


class FullPipelineRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000, description="User input text")
    user_name: Optional[str] = Field(None, description="User's name for personalization")
    
    class Config:
        json_schema_extra = {
            "example": {
                "text": "I'm feeling really anxious about my upcoming presentation",
                "user_name": "Alex"
            }
        }


class FullPipelineResponse(BaseModel):
    emotions: str = Field(..., description="Comma-separated detected emotions")
    confidence: float = Field(..., description="Model confidence score")
    response: str = Field(..., description="Generated supportive response")
    has_crisis_warning: bool = Field(..., description="Whether crisis message was included")


class PredictRequest(BaseModel):
    """Request model for /predict endpoint (backend integration)"""
    userId: str = Field(..., description="User ID")
    diaryId: str = Field(..., description="Diary entry ID")
    text: str = Field(..., min_length=1, max_length=10000, description="Diary text content")
    
    class Config:
        json_schema_extra = {
            "example": {
                "userId": "507f191e810c19729de860ea",
                "diaryId": "507f1f77bcf86cd799439011",
                "text": "Today was really challenging. I felt overwhelmed at work and couldn't focus."
            }
        }


class PredictResponse(BaseModel):
    """Response model for /predict endpoint (backend integration)"""
    diaryId: str
    userId: str
    top_label: str = Field(..., description="Primary detected emotion")
    scores: Dict[str, float] = Field(..., description="Emotion scores for all labels")
    summary_suggestion: str = Field(..., description="Generated supportive response")
    confidence: float = Field(..., description="Confidence of top emotion")
    all_detected: List[str] = Field(..., description="List of all detected emotions")
    
    class Config:
        json_schema_extra = {
            "example": {
                "diaryId": "507f1f77bcf86cd799439011",
                "userId": "507f191e810c19729de860ea",
                "top_label": "sadness",
                "scores": {
                    "sadness": 0.85,
                    "disappointment": 0.42,
                    "neutral": 0.15
                },
                "summary_suggestion": "I understand you're feeling sad right now...",
                "confidence": 0.85,
                "all_detected": ["sadness", "disappointment"]
            }
        }


# Lifecycle management
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load models on startup, cleanup on shutdown"""
    global emotion_model, emotion_tokenizer, generation_model, generation_tokenizer, label_names, device
    
    logger.info("Starting ML Service...")
    
    # Determine device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Using device: {device}")
    
    try:
        # Load emotion detection model
        logger.info(f"Loading emotion model from {MODEL_PATH}")
        emotion_tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
        emotion_model = AutoModelForSequenceClassification.from_pretrained(
            MODEL_PATH
        ).to(device)
        emotion_model.eval()
        
        # Load label names
        labels_path = os.path.join(MODEL_PATH, "labels.json")
        with open(labels_path, 'r') as f:
            label_map = json.load(f)
            label_names = [label_map[str(i)] for i in range(len(label_map))]
        logger.info(f"Loaded {len(label_names)} emotion labels")
        
        # Load generation model
        logger.info(f"Loading generation model: {GENERATION_MODEL_NAME}")
        generation_tokenizer = AutoTokenizer.from_pretrained(GENERATION_MODEL_NAME)
        generation_model = AutoModelForSeq2SeqLM.from_pretrained(
            GENERATION_MODEL_NAME
        ).to(device)
        generation_model.eval()
        
        logger.info("All models loaded successfully!")
        
    except Exception as e:
        logger.error(f"Error loading models: {e}")
        raise
    
    yield
    
    # Cleanup
    logger.info("Shutting down ML Service...")


# Initialize FastAPI app
app = FastAPI(
    title="Apricity ML Service",
    description="Emotion detection and CBT-style response generation for mental health support",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Helper Functions
def detect_emotions(text: str) -> tuple[str, float, List[str]]:
    """
    Detect emotions using multi-label DeBERTa classifier
    Returns: (comma_separated_emotions, confidence_score, list_of_emotions)
    """
    try:
        inputs = emotion_tokenizer(
            text, 
            return_tensors="pt", 
            truncation=True, 
            max_length=MAX_LENGTH
        ).to(device)
        
        with torch.no_grad():
            logits = emotion_model(**inputs).logits
        
        # Multi-label prediction
        sigmoid = torch.sigmoid(logits)
        predictions = (sigmoid > 0.5).int().squeeze().cpu().numpy()
        
        # Get detected emotions
        detected = [label_names[i] for i, pred in enumerate(predictions) if pred == 1]
        
        # Fallback to highest logit if no emotions detected
        if not detected:
            max_index = torch.argmax(logits, dim=1).item()
            detected = [label_names[max_index]]
        
        emotions_str = ", ".join(detected)
        confidence = float(sigmoid.max().item())
        
        return emotions_str, confidence, detected
        
    except Exception as e:
        logger.error(f"Error in emotion detection: {e}")
        raise


def needs_crisis_message(text: str) -> bool:
    """Check if text contains self-harm indicators"""
    text_lower = text.lower()
    return any(keyword in text_lower for keyword in SELF_HARM_KEYWORDS)


def craft_prompt(user_text: str, emotion_str: str, user_name: Optional[str] = None) -> str:
    """Build CBT-informed prompt for response generation"""
    who = f"{user_name}, " if user_name else "friend"
    
    prompt = f"""
You are Apricity, a warm, non-judgmental mental health companion using CBT techniques.
Detected emotions: {emotion_str}.
User text: "{user_text}"

Task: Write a concise, supportive reply addressing the user as {who}. The reply must contain these three structured sections:
1) **Validation (1 sentence):** Acknowledge the user's feelings, mentioning the primary detected emotions.
2) **Cognitive Reframing (1-2 sentences):** Gently identify a possible thinking pattern and offer a balanced alternative perspective.
3) **Actionable Step (1 sentence):** Suggest one practical, small CBT-style coping mechanism.

Keep the total reply concise (80–140 words). Ensure safety advice for self-harm is mentioned if needed.

Reply:
"""
    return prompt.strip()


def generate_support_response(
    user_text: str, 
    emotion_str: str, 
    user_name: Optional[str] = None
) -> str:
    """Generate supportive response using FLAN-T5"""
    try:
        prompt = craft_prompt(user_text, emotion_str, user_name)
        inputs = generation_tokenizer(prompt, return_tensors="pt").to(device)
        
        with torch.no_grad():
            outputs = generation_model.generate(
                **inputs,
                max_new_tokens=MAX_NEW_TOKENS,
                num_beams=NUM_BEAMS,
                do_sample=False,
                top_p=TOP_P,
                temperature=TEMPERATURE
            )
        
        response = generation_tokenizer.decode(outputs[0], skip_special_tokens=True)
        return response
        
    except Exception as e:
        logger.error(f"Error in response generation: {e}")
        raise


def get_emotion_scores_dict(text: str) -> tuple[Dict[str, float], str, float, List[str]]:
    """
    Get detailed emotion scores for all labels (for /predict endpoint)
    Returns: (scores_dict, top_label, confidence, all_detected_list)
    """
    try:
        inputs = emotion_tokenizer(
            text, 
            return_tensors="pt", 
            truncation=True, 
            max_length=MAX_LENGTH
        ).to(device)
        
        with torch.no_grad():
            logits = emotion_model(**inputs).logits
        
        # Get probabilities for all emotions
        sigmoid = torch.sigmoid(logits)
        probs = sigmoid.squeeze().cpu().numpy()
        
        # Create scores dictionary for all emotions
        scores_dict = {label_names[i]: float(probs[i]) for i in range(len(label_names))}
        
        # Multi-label prediction (threshold at 0.5)
        predictions = (sigmoid > 0.5).int().squeeze().cpu().numpy()
        detected = [label_names[i] for i, pred in enumerate(predictions) if pred == 1]
        
        # Get top emotion (highest score)
        max_index = torch.argmax(logits, dim=1).item()
        top_label = label_names[max_index]
        confidence = float(probs[max_index])
        
        # Fallback if no emotions detected above threshold
        if not detected:
            detected = [top_label]
        
        return scores_dict, top_label, confidence, detected
        
    except Exception as e:
        logger.error(f"Error in emotion score calculation: {e}")
        raise


# API Endpoints
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Apricity ML Service",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": {
            "health": "/health",
            "predict": "/predict",
            "detect_emotion": "/api/v1/detect-emotion",
            "generate_support": "/api/v1/generate-support",
            "full_pipeline": "/api/v1/chat"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    models_loaded = all([
        emotion_model is not None,
        emotion_tokenizer is not None,
        generation_model is not None,
        generation_tokenizer is not None
    ])
    
    return {
        "status": "healthy" if models_loaded else "unhealthy",
        "models_loaded": models_loaded,
        "device": str(device),
        "emotion_labels_count": len(label_names)
    }


@app.post("/predict", response_model=PredictResponse)
async def predict_endpoint(request: PredictRequest):
    """
    Main prediction endpoint for backend integration
    Analyzes diary text and returns emotion scores with supportive response
    """
    try:
        logger.info(f"Processing prediction for diary {request.diaryId}, user {request.userId}")
        logger.info(f"Text length: {len(request.text)} characters")
        
        # Get detailed emotion scores
        scores_dict, top_label, confidence, all_detected = get_emotion_scores_dict(request.text)
        
        logger.info(f"Top emotion: {top_label} (confidence: {confidence:.3f})")
        logger.info(f"All detected emotions: {', '.join(all_detected)}")
        
        # Generate supportive response
        emotions_str = ", ".join(all_detected)
        summary_suggestion = generate_support_response(
            request.text,
            emotions_str,
            user_name=None  # Could be extracted from userId if needed
        )
        
        # Check for crisis indicators
        if needs_crisis_message(request.text):
            summary_suggestion = f"{CRISIS_BANNER}\n\n{summary_suggestion}"
            logger.warning(f"Crisis keywords detected in diary {request.diaryId}")
        
        logger.info(f"Successfully processed prediction for diary {request.diaryId}")
        
        return PredictResponse(
            diaryId=request.diaryId,
            userId=request.userId,
            top_label=top_label,
            scores=scores_dict,
            summary_suggestion=summary_suggestion,
            confidence=confidence,
            all_detected=all_detected
        )
        
    except Exception as e:
        logger.error(f"Error in /predict endpoint: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing prediction: {str(e)}"
        )


@app.post("/api/v1/detect-emotion", response_model=EmotionResponse)
async def detect_emotion_endpoint(request: EmotionRequest):
    """Detect emotions in user text"""
    try:
        emotions_str, confidence, all_emotions = detect_emotions(request.text)
        
        return EmotionResponse(
            emotions=emotions_str,
            confidence=confidence,
            all_emotions=all_emotions
        )
        
    except Exception as e:
        logger.error(f"Error in detect-emotion endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error detecting emotions: {str(e)}"
        )


@app.post("/api/v1/generate-support", response_model=SupportResponse)
async def generate_support_endpoint(request: SupportRequest):
    """Generate supportive response"""
    try:
        # Detect emotions if not provided
        emotions = request.emotions
        if not emotions:
            emotions, _, _ = detect_emotions(request.text)
        
        # Check for crisis indicators
        has_crisis = needs_crisis_message(request.text)
        
        # Generate response
        support_text = generate_support_response(
            request.text,
            emotions,
            request.user_name
        )
        
        # Add crisis banner if needed
        if has_crisis:
            support_text = f"{CRISIS_BANNER}\n\n{support_text}"
        
        return SupportResponse(
            response=support_text,
            has_crisis_warning=has_crisis
        )
        
    except Exception as e:
        logger.error(f"Error in generate-support endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating support: {str(e)}"
        )


@app.post("/api/v1/chat", response_model=FullPipelineResponse)
async def full_pipeline_endpoint(request: FullPipelineRequest):
    """
    Complete pipeline: emotion detection + response generation
    This is the main endpoint for the chat interface
    """
    try:
        # Detect emotions
        emotions_str, confidence, _ = detect_emotions(request.text)
        
        # Check for crisis indicators
        has_crisis = needs_crisis_message(request.text)
        
        # Generate response
        support_text = generate_support_response(
            request.text,
            emotions_str,
            request.user_name
        )
        
        # Add crisis banner if needed
        if has_crisis:
            support_text = f"{CRISIS_BANNER}\n\n{support_text}"
        
        return FullPipelineResponse(
            emotions=emotions_str,
            confidence=confidence,
            response=support_text,
            has_crisis_warning=has_crisis
        )
        
    except Exception as e:
        logger.error(f"Error in full pipeline: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing request: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    
    uvicorn.run(
        "predict_server:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )
