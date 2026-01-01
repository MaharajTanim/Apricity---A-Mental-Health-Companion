#!/usr/bin/env python3
"""
Example usage of Apricity Inference Pipeline
Demonstrates all key functions
"""

import json
from inference_pipeline import (
    load_models,
    clean_text,
    infer,
    full_pipeline,
    save_predictions_json,
    batch_infer
)

def example_1_basic_emotion_detection():
    """Example 1: Basic emotion detection"""
    print("\n" + "=" * 60)
    print("Example 1: Basic Emotion Detection")
    print("=" * 60)
    
    text = "I'm feeling really anxious about my presentation tomorrow."
    
    # Detect emotions
    result = infer(text)
    
    print(f"\nInput: {text}")
    print(f"\nTop Emotion: {result['top_label']}")
    print(f"Confidence: {result['confidence']:.3f}")
    print(f"All Detected: {', '.join(result['all_emotions'])}")
    print(f"\nTop 5 Emotion Scores:")
    
    # Sort scores and show top 5
    sorted_scores = sorted(
        result['scores'].items(),
        key=lambda x: x[1],
        reverse=True
    )[:5]
    
    for emotion, score in sorted_scores:
        print(f"  {emotion}: {score:.3f}")


def example_2_full_pipeline():
    """Example 2: Full pipeline with response generation"""
    print("\n" + "=" * 60)
    print("Example 2: Full Pipeline (Emotion + Response)")
    print("=" * 60)
    
    text = "Today was amazing! Everything went perfectly at work and I got promoted!"
    user_name = "Alex"
    
    # Run full pipeline
    result = full_pipeline(text, user_name=user_name)
    
    print(f"\nInput: {text}")
    print(f"User: {user_name}")
    print(f"\nDetected Emotions: {', '.join(result['emotion_results']['all_emotions'])}")
    print(f"Top Emotion: {result['emotion_results']['top_label']} "
          f"({result['emotion_results']['confidence']:.3f})")
    print(f"\nGenerated Response:")
    print(f"{result['final_response']}")


def example_3_crisis_detection():
    """Example 3: Crisis keyword detection"""
    print("\n" + "=" * 60)
    print("Example 3: Crisis Detection")
    print("=" * 60)
    
    text = "I feel so overwhelmed. I don't know if I can keep going."
    
    result = full_pipeline(text)
    
    print(f"\nInput: {text}")
    print(f"\nCrisis Detected: {result['crisis_detected']}")
    print(f"Top Emotion: {result['emotion_results']['top_label']}")
    print(f"\nResponse (with crisis banner if detected):")
    print(f"{result['final_response']}")


def example_4_batch_processing():
    """Example 4: Batch processing multiple texts"""
    print("\n" + "=" * 60)
    print("Example 4: Batch Processing")
    print("=" * 60)
    
    texts = [
        "I'm feeling really happy today!",
        "Everything is going wrong and I feel terrible.",
        "I'm confused about what to do next.",
        "Work was challenging but I learned a lot."
    ]
    
    print(f"\nProcessing {len(texts)} texts...")
    results = batch_infer(texts)
    
    print("\nResults:")
    for i, result in enumerate(results, 1):
        emotions = result['emotion_results']['all_emotions']
        top = result['emotion_results']['top_label']
        conf = result['emotion_results']['confidence']
        
        print(f"\n{i}. \"{result['input_text'][:50]}...\"")
        print(f"   Top: {top} ({conf:.3f})")
        print(f"   All: {', '.join(emotions)}")


def example_5_save_to_json():
    """Example 5: Save predictions to JSON"""
    print("\n" + "=" * 60)
    print("Example 5: Save Predictions to JSON")
    print("=" * 60)
    
    text = "I'm nervous about the interview but also excited about the opportunity."
    
    result = full_pipeline(text, user_name="Taylor")
    
    # Save to JSON
    output_file = "example_prediction.json"
    save_predictions_json(result, output_file)
    
    print(f"\nPrediction saved to: {output_file}")
    print("\nJSON content preview:")
    print(json.dumps({
        "top_emotion": result['emotion_results']['top_label'],
        "confidence": result['emotion_results']['confidence'],
        "all_emotions": result['emotion_results']['all_emotions'],
        "response": result['final_response'][:100] + "..."
    }, indent=2))


def example_6_custom_parameters():
    """Example 6: Using custom inference parameters"""
    print("\n" + "=" * 60)
    print("Example 6: Custom Parameters")
    print("=" * 60)
    
    text = "I have mixed feelings about the situation."
    
    # Custom threshold for multi-label detection
    result_strict = infer(text, threshold=0.7)  # More strict
    result_lenient = infer(text, threshold=0.3)  # More lenient
    
    print(f"\nInput: {text}")
    print(f"\nWith threshold=0.7 (strict):")
    print(f"  Detected: {', '.join(result_strict['all_emotions'])}")
    
    print(f"\nWith threshold=0.3 (lenient):")
    print(f"  Detected: {', '.join(result_lenient['all_emotions'])}")


def main():
    """Run all examples"""
    print("\n" + "=" * 60)
    print("Apricity Inference Pipeline - Usage Examples")
    print("=" * 60)
    
    # Load models once at startup
    print("\nLoading models...")
    if not load_models():
        print("ERROR: Failed to load models")
        return
    
    print("\nModels loaded successfully!")
    
    # Run examples
    try:
        example_1_basic_emotion_detection()
        example_2_full_pipeline()
        example_3_crisis_detection()
        example_4_batch_processing()
        example_5_save_to_json()
        example_6_custom_parameters()
        
        print("\n" + "=" * 60)
        print("All examples completed successfully!")
        print("=" * 60 + "\n")
        
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
