"""
Apricity ML Service - Emotion Detection and Response Generation
FastAPI server for DeBERTa emotion classification and FLAN-T5 response generation

Supports two models:
1. Custom trained DeBERTa-v3-base model (5 Ekman emotions) - when emotion_deberta_model.pth exists
2. Pre-trained RoBERTa GoEmotions model (28 emotions) - fallback
"""

import os
import re
import json
import logging
from typing import Optional, List, Dict
from contextlib import asynccontextmanager

import torch
import emoji
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from transformers import (
    AutoTokenizer,
    AutoModel,
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
use_custom_deberta = False  # Flag to track which model is being used

# Configuration
# Custom DeBERTa model path (trained model file)
CUSTOM_MODEL_PATH = os.getenv("CUSTOM_MODEL_PATH", os.path.join(os.path.dirname(__file__), "..", "new model", "emotion_deberta_model.pth"))
# Fallback to pre-trained RoBERTa model
FALLBACK_MODEL_PATH = os.getenv("FALLBACK_MODEL_PATH", "SamLowe/roberta-base-go_emotions")
DEBERTA_BASE_MODEL = "microsoft/deberta-v3-base"
GENERATION_MODEL_NAME = os.getenv("GENERATION_MODEL_NAME", "google/flan-t5-base")
MAX_LENGTH = int(os.getenv("MAX_LENGTH", "200"))
MAX_NEW_TOKENS = int(os.getenv("MAX_NEW_TOKENS", "160"))
NUM_BEAMS = int(os.getenv("NUM_BEAMS", "4"))
TEMPERATURE = float(os.getenv("TEMPERATURE", "0.7"))
TOP_P = float(os.getenv("TOP_P", "0.92"))

# DeBERTa custom model labels (5 Ekman emotions - trained in notebook)
DEBERTA_LABELS = ["anger", "fear", "joy", "sadness", "surprise"]

# Ekman mapping for converting RoBERTa's 28 emotions to 5 basic emotions
EKMAN_MAPPING = {
    "anger": ["anger", "annoyance", "disapproval"],
    "fear": ["fear", "nervousness"],
    "joy": ["joy", "amusement", "approval", "excitement", "gratitude", "love", "optimism", "relief", "pride", "admiration", "desire", "caring"],
    "sadness": ["sadness", "disappointment", "embarrassment", "grief", "remorse"],
    "surprise": ["surprise", "realization", "confusion", "curiosity"]
}

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

# ============ Text Preprocessing (from notebook) ============

contraction_mapping = {"ain't": "is not", "aren't": "are not","can't": "cannot", "'cause": "because", "could've": "could have", "couldn't": "could not",
                       "didn't": "did not",  "doesn't": "does not", "don't": "do not", "hadn't": "had not", "hasn't": "has not", "haven't": "have not",
                       "he'd": "he would","he'll": "he will", "he's": "he is", "how'd": "how did", "how'd'y": "how do you", "how'll": "how will",
                       "how's": "how is",  "I'd": "I would", "I'd've": "I would have", "I'll": "I will", "I'll've": "I will have","I'm": "I am",
                       "I've": "I have", "i'd": "i would", "i'd've": "i would have", "i'll": "i will",  "i'll've": "i will have","i'm": "i am",
                       "i've": "i have", "isn't": "is not", "it'd": "it would", "it'd've": "it would have", "it'll": "it will", "it'll've": "it will have",
                       "it's": "it is", "let's": "let us", "ma'am": "madam", "mayn't": "may not", "might've": "might have","mightn't": "might not",
                       "mightn't've": "might not have", "must've": "must have", "mustn't": "must not", "mustn't've": "must not have", "needn't": "need not",
                       "needn't've": "need not have","o'clock": "of the clock", "oughtn't": "ought not", "oughtn't've": "ought not have", "shan't": "shall not",
                       "sha'n't": "shall not", "shan't've": "shall not have", "she'd": "she would", "she'd've": "she would have", "she'll": "she will",
                       "she'll've": "she will have", "she's": "she is", "should've": "should have", "shouldn't": "should not", "shouldn't've": "should not have",
                       "so've": "so have","so's": "so as", "this's": "this is","that'd": "that would", "that'd've": "that would have", "that's": "that is",
                       "there'd": "there would", "there'd've": "there would have", "there's": "there is", "here's": "here is","they'd": "they would",
                       "they'd've": "they would have", "they'll": "they will", "they'll've": "they will have", "they're": "they are", "they've": "they have",
                       "to've": "to have", "wasn't": "was not", "we'd": "we would", "we'd've": "we would have", "we'll": "we will", "we'll've": "we will have",
                       "we're": "we are", "we've": "we have", "weren't": "were not", "what'll": "what will", "what'll've": "what will have",
                       "what're": "what are",  "what's": "what is", "what've": "what have", "when's": "when is", "when've": "when have", "where'd": "where did",
                       "where's": "where is", "where've": "where have", "who'll": "who will", "who'll've": "who will have", "who's": "who is",
                       "who've": "who have", "why's": "why is", "why've": "why have", "will've": "will have", "won't": "will not", "won't've": "will not have",
                       "would've": "would have", "wouldn't": "would not", "wouldn't've": "would not have", "y'all": "you all", "y'all'd": "you all would",
                       "y'all'd've": "you all would have","y'all're": "you all are","y'all've": "you all have","you'd": "you would", "you'd've": "you would have",
                       "you'll": "you will", "you'll've": "you will have", "you're": "you are", "you've": "you have", 'u.s':'america', 'e.g':'for example'}

punct = [',', '.', '"', ':', ')', '(', '-', '!', '?', '|', ';', "'", '$', '&', '/', '[', ']', '>', '%', '=', '#', '*', '+', '\\', '•',  '~', '@', '£',
 '·', '_', '{', '}', '©', '^', '®', '`',  '<', '→', '°', '€', '™', '›',  '♥', '←', '×', '§', '″', '′', 'Â', '█', '½', 'à', '…',
 '"', '★', '"', '–', '●', 'â', '►', '−', '¢', '²', '¬', '░', '¶', '↑', '±', '¿', '▾', '═', '¦', '║', '―', '¥', '▓', '—', '‹', '─',
 '▒', '：', '¼', '⊕', '▼', '▪', '†', '■', ''', '▀', '¨', '▄', '♫', '☆', 'é', '¯', '♦', '¤', '▲', 'è', '¸', '¾', 'Ã', '⋅', ''', '∞',
 '∙', '）', '↓', '、', '│', '（', '»', '，', '♪', '╩', '╚', '³', '・', '╦', '╣', '╔', '╗', '▬', '❤', 'ï', 'Ø', '¹', '≤', '‡', '√', ]

punct_mapping = {"'": "'", "₹": "e", "´": "'", "°": "", "€": "e", "™": "tm", "√": " sqrt ", "×": "x", "²": "2", "—": "-", "–": "-", "'": "'", "_": "-",
                 "`": "'", '"': '"', '"': '"', '"': '"', "£": "e", '∞': 'infinity', 'θ': 'theta', '÷': '/', 'α': 'alpha', '•': '.', 'à': 'a', '−': '-',
                 'β': 'beta', '∅': '', '³': '3', 'π': 'pi', '!':' '}

mispell_dict = {'colour': 'color', 'centre': 'center', 'favourite': 'favorite', 'travelling': 'traveling', 'counselling': 'counseling', 'theatre': 'theater',
                'cancelled': 'canceled', 'labour': 'labor', 'organisation': 'organization', 'wwii': 'world war 2', 'citicise': 'criticize', 'youtu ': 'youtube ',
                'Qoura': 'Quora', 'sallary': 'salary', 'Whta': 'What', 'narcisist': 'narcissist', 'howdo': 'how do', 'whatare': 'what are', 'howcan': 'how can',
                'howmuch': 'how much', 'howmany': 'how many', 'whydo': 'why do', 'doI': 'do I', 'theBest': 'the best', 'howdoes': 'how does',
                'mastrubation': 'masturbation', 'mastrubate': 'masturbate', "mastrubating": 'masturbating', 'pennis': 'penis', 'Etherium': 'Ethereum',
                'narcissit': 'narcissist', 'bigdata': 'big data', '2k17': '2017', '2k18': '2018', 'qouta': 'quota', 'exboyfriend': 'ex boyfriend',
                'airhostess': 'air hostess', "whst": 'what', 'watsapp': 'whatsapp', 'demonitisation': 'demonetization', 'demonitization': 'demonetization',
                'demonetisation': 'demonetization'}


def clean_text(text):
    '''Clean emoji, Make text lowercase, remove text in square brackets, remove links, remove punctuation'''
    try:
        text = emoji.demojize(text)
    except:
        pass
    text = re.sub(r'\:(.*?)\:','',text)
    text = str(text).lower()
    text = re.sub('\[.*?\]', '', text)
    text = re.sub('https?://\S+|www\.\S+', '', text)
    text = re.sub('<.*?>+', '', text)
    text = re.sub('[%s]' % re.escape('!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'), '', text)
    text = re.sub('\n', '', text)
    text = re.sub('\w*\d\w*', '', text)
    return text


def clean_contractions(text, mapping):
    '''Expand contractions'''
    specials = ["'", "'", "´", "`"]
    for s in specials:
        text = text.replace(s, "'")
    for word in mapping.keys():
        if " " + word + " " in text:
            text = text.replace(" " + word + " ", " " + mapping[word] + " ")
    return text


def clean_special_chars(text, punct, mapping):
    '''Clean special characters'''
    for p in mapping:
        text = text.replace(p, mapping[p])
    for p in punct:
        text = text.replace(p, f' {p} ')
    specials = {'\u200b': ' ', '…': ' ... ', '\ufeff': '', 'करना': '', 'है': ''}
    for s in specials:
        text = text.replace(s, specials[s])
    return text


def correct_spelling(x, dic):
    '''Corrects common spelling errors'''
    for word in dic.keys():
        x = x.replace(word, dic[word])
    return x


def remove_space(text):
    '''Removes awkward spaces'''
    text = text.strip()
    text = text.split()
    return " ".join(text)


def text_preprocessing_pipeline(text):
    '''Complete text preprocessing pipeline for DeBERTa model'''
    text = clean_text(text)
    text = clean_contractions(text, contraction_mapping)
    text = clean_special_chars(text, punct, punct_mapping)
    text = correct_spelling(text, mispell_dict)
    text = remove_space(text)
    return text


# ============ Custom DeBERTa Model Class (from notebook) ============

class DeBERTaClass(torch.nn.Module):
    """Custom DeBERTa model for 5-class emotion classification"""
    def __init__(self):
        super(DeBERTaClass, self).__init__()
        self.deberta = AutoModel.from_pretrained(DEBERTA_BASE_MODEL)
        self.dropout = torch.nn.Dropout(0.3)
        # 768 is the hidden size, 5 is the number of emotion labels (anger, fear, joy, sadness, surprise)
        self.fc = torch.nn.Linear(768, 5)

    def forward(self, ids, mask, token_type_ids):
        outputs = self.deberta(input_ids=ids, attention_mask=mask, token_type_ids=token_type_ids)
        last_hidden_state = outputs.last_hidden_state
        # Extract [CLS] token representation
        cls_output = last_hidden_state[:, 0, :]
        output = self.fc(self.dropout(cls_output))
        return output


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
    global emotion_model, emotion_tokenizer, generation_model, generation_tokenizer, label_names, device, use_custom_deberta
    
    logger.info("Starting ML Service...")
    
    # Determine device
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Using device: {device}")
    
    try:
        # Check if custom DeBERTa model exists
        custom_model_exists = os.path.exists(CUSTOM_MODEL_PATH)
        logger.info(f"Custom DeBERTa model path: {CUSTOM_MODEL_PATH}")
        logger.info(f"Custom model exists: {custom_model_exists}")
        
        if custom_model_exists:
            # Load custom trained DeBERTa model
            logger.info("Loading custom DeBERTa-v3-base model...")
            use_custom_deberta = True
            label_names = DEBERTA_LABELS
            
            # Load tokenizer
            emotion_tokenizer = AutoTokenizer.from_pretrained(DEBERTA_BASE_MODEL)
            
            # Load custom model architecture
            emotion_model = DeBERTaClass()
            emotion_model.load_state_dict(torch.load(CUSTOM_MODEL_PATH, map_location=device))
            emotion_model.to(device)
            emotion_model.eval()
            
            logger.info(f"Custom DeBERTa model loaded with {len(label_names)} emotion labels: {label_names}")
        else:
            # Fallback to pre-trained RoBERTa model
            logger.info(f"Custom model not found. Falling back to {FALLBACK_MODEL_PATH}")
            use_custom_deberta = False
            
            emotion_tokenizer = AutoTokenizer.from_pretrained(FALLBACK_MODEL_PATH)
            emotion_model = AutoModelForSequenceClassification.from_pretrained(FALLBACK_MODEL_PATH).to(device)
            emotion_model.eval()
            
            # Load label names from model config
            if hasattr(emotion_model.config, 'id2label') and emotion_model.config.id2label:
                label_names = [emotion_model.config.id2label[i] for i in range(len(emotion_model.config.id2label))]
                logger.info(f"Loaded {len(label_names)} emotion labels from RoBERTa model config")
            else:
                raise ValueError("No labels found in model config")
        
        # Load generation model (FLAN-T5)
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
    Detect emotions using the loaded model (DeBERTa or RoBERTa)
    Returns: (comma_separated_emotions, confidence_score, list_of_emotions)
    """
    try:
        if use_custom_deberta:
            # Preprocess text for custom DeBERTa model
            processed_text = text_preprocessing_pipeline(text)
            
            inputs = emotion_tokenizer.encode_plus(
                processed_text,
                truncation=True,
                add_special_tokens=True,
                max_length=MAX_LENGTH,
                padding='max_length',
                return_token_type_ids=True,
                return_tensors="pt"
            )
            
            ids = inputs['input_ids'].to(device)
            mask = inputs['attention_mask'].to(device)
            token_type_ids = inputs['token_type_ids'].to(device)
            
            with torch.no_grad():
                logits = emotion_model(ids, mask, token_type_ids)
            
            # Multi-label prediction with sigmoid
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
            
        else:
            # Use pre-trained RoBERTa model (original logic)
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
        if use_custom_deberta:
            # Preprocess text for custom DeBERTa model
            processed_text = text_preprocessing_pipeline(text)
            
            inputs = emotion_tokenizer.encode_plus(
                processed_text,
                truncation=True,
                add_special_tokens=True,
                max_length=MAX_LENGTH,
                padding='max_length',
                return_token_type_ids=True,
                return_tensors="pt"
            )
            
            ids = inputs['input_ids'].to(device)
            mask = inputs['attention_mask'].to(device)
            token_type_ids = inputs['token_type_ids'].to(device)
            
            with torch.no_grad():
                logits = emotion_model(ids, mask, token_type_ids)
            
            # Get probabilities
            sigmoid = torch.sigmoid(logits)
            probs = sigmoid.squeeze().cpu().numpy()
            
            # Create scores dictionary for 5 emotions
            scores_dict = {label_names[i]: float(probs[i]) for i in range(len(label_names))}
            
            # Multi-label prediction
            predictions = (sigmoid > 0.5).int().squeeze().cpu().numpy()
            detected = [label_names[i] for i, pred in enumerate(predictions) if pred == 1]
            
            # Get top emotion
            max_index = torch.argmax(logits, dim=1).item()
            top_label = label_names[max_index]
            confidence = float(probs[max_index])
            
        else:
            # Use pre-trained RoBERTa model (original logic)
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
        "emotion_model": "DeBERTa-v3-base (custom trained)" if use_custom_deberta else "RoBERTa GoEmotions (pre-trained)",
        "emotion_labels": label_names,
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
