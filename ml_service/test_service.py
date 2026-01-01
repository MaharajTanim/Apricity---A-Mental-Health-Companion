#!/usr/bin/env python3
"""
Test script for Apricity ML Service
Tests all endpoints to verify the service is working correctly
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000"
TIMEOUT = 30


def print_header(text):
    """Print a formatted header"""
    print("\n" + "=" * 60)
    print(f"  {text}")
    print("=" * 60)


def print_result(success, message):
    """Print a test result"""
    status = "✓ PASS" if success else "✗ FAIL"
    print(f"{status}: {message}")


def test_health():
    """Test health endpoint"""
    print_header("Testing Health Endpoint")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=TIMEOUT)
        data = response.json()
        
        success = (
            response.status_code == 200 and
            data.get("status") == "healthy" and
            data.get("models_loaded") == True
        )
        
        print(json.dumps(data, indent=2))
        print_result(success, "Health check")
        return success
        
    except Exception as e:
        print(f"Error: {e}")
        print_result(False, "Health check")
        return False


def test_predict():
    """Test /predict endpoint (main backend integration endpoint)"""
    print_header("Testing /predict Endpoint (Backend Integration)")
    
    test_data = {
        "userId": "507f191e810c19729de860ea",
        "diaryId": "507f1f77bcf86cd799439011",
        "text": "Today was really challenging. I felt overwhelmed at work and couldn't focus on anything."
    }
    
    try:
        print(f"\nRequest:")
        print(json.dumps(test_data, indent=2))
        
        response = requests.post(
            f"{BASE_URL}/predict",
            json=test_data,
            timeout=TIMEOUT
        )
        
        data = response.json()
        
        print(f"\nResponse:")
        print(json.dumps(data, indent=2))
        
        success = (
            response.status_code == 200 and
            "top_label" in data and
            "scores" in data and
            "summary_suggestion" in data and
            isinstance(data["scores"], dict) and
            len(data["scores"]) > 0
        )
        
        print_result(success, "/predict endpoint")
        return success
        
    except Exception as e:
        print(f"Error: {e}")
        print_result(False, "/predict endpoint")
        return False


def test_detect_emotion():
    """Test emotion detection endpoint"""
    print_header("Testing Emotion Detection")
    
    test_data = {
        "text": "I'm feeling really anxious about my upcoming presentation tomorrow."
    }
    
    try:
        print(f"\nRequest:")
        print(json.dumps(test_data, indent=2))
        
        response = requests.post(
            f"{BASE_URL}/api/v1/detect-emotion",
            json=test_data,
            timeout=TIMEOUT
        )
        
        data = response.json()
        
        print(f"\nResponse:")
        print(json.dumps(data, indent=2))
        
        success = (
            response.status_code == 200 and
            "emotions" in data and
            "confidence" in data
        )
        
        print_result(success, "Emotion detection")
        return success
        
    except Exception as e:
        print(f"Error: {e}")
        print_result(False, "Emotion detection")
        return False


def test_generate_support():
    """Test support response generation"""
    print_header("Testing Support Response Generation")
    
    test_data = {
        "text": "I'm feeling really anxious about my upcoming presentation tomorrow.",
        "emotions": "anxiety, nervousness",
        "user_name": "Alex"
    }
    
    try:
        print(f"\nRequest:")
        print(json.dumps(test_data, indent=2))
        
        response = requests.post(
            f"{BASE_URL}/api/v1/generate-support",
            json=test_data,
            timeout=TIMEOUT
        )
        
        data = response.json()
        
        print(f"\nResponse:")
        print(json.dumps(data, indent=2))
        
        success = (
            response.status_code == 200 and
            "response" in data and
            len(data["response"]) > 0
        )
        
        print_result(success, "Support generation")
        return success
        
    except Exception as e:
        print(f"Error: {e}")
        print_result(False, "Support generation")
        return False


def test_full_pipeline():
    """Test full chat pipeline"""
    print_header("Testing Full Chat Pipeline")
    
    test_data = {
        "text": "I'm feeling really happy today! Everything went well at work.",
        "user_name": "Taylor"
    }
    
    try:
        print(f"\nRequest:")
        print(json.dumps(test_data, indent=2))
        
        response = requests.post(
            f"{BASE_URL}/api/v1/chat",
            json=test_data,
            timeout=TIMEOUT
        )
        
        data = response.json()
        
        print(f"\nResponse:")
        print(json.dumps(data, indent=2))
        
        success = (
            response.status_code == 200 and
            "emotions" in data and
            "response" in data
        )
        
        print_result(success, "Full pipeline")
        return success
        
    except Exception as e:
        print(f"Error: {e}")
        print_result(False, "Full pipeline")
        return False


def main():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("  Apricity ML Service Test Suite")
    print(f"  Testing: {BASE_URL}")
    print(f"  Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    results = []
    
    # Run tests
    results.append(("Health Check", test_health()))
    results.append(("/predict Endpoint", test_predict()))
    results.append(("Emotion Detection", test_detect_emotion()))
    results.append(("Support Generation", test_generate_support()))
    results.append(("Full Pipeline", test_full_pipeline()))
    
    # Print summary
    print_header("Test Summary")
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✓" if result else "✗"
        print(f"  {status} {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed!")
        sys.exit(0)
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        sys.exit(1)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nTests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\nUnexpected error: {e}")
        sys.exit(1)
