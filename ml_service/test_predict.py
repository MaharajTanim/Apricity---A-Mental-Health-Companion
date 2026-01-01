#!/usr/bin/env python3
"""
Simple test script for Apricity ML Service
POSTs sample text to /predict endpoint and prints results
"""

import requests
import json
import sys

# Configuration
ML_SERVICE_URL = "http://localhost:8000"
PREDICT_ENDPOINT = f"{ML_SERVICE_URL}/predict"

# Sample test data
SAMPLE_DATA = {
    "userId": "test-user-123",
    "diaryId": "test-diary-456",
    "text": "Today was really challenging. I felt overwhelmed at work and couldn't focus on anything. I'm worried about meeting all the deadlines."
}

def test_predict():
    """Send POST request to /predict endpoint and print results"""
    
    print("=" * 60)
    print("Testing Apricity ML Service - /predict endpoint")
    print("=" * 60)
    
    print(f"\nService URL: {ML_SERVICE_URL}")
    print(f"Endpoint: {PREDICT_ENDPOINT}")
    
    # Display request data
    print("\n📤 REQUEST:")
    print(json.dumps(SAMPLE_DATA, indent=2))
    
    try:
        # Send POST request
        print(f"\nSending POST request to {PREDICT_ENDPOINT}...")
        response = requests.post(
            PREDICT_ENDPOINT,
            json=SAMPLE_DATA,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        # Check status code
        print(f"\n✓ Status Code: {response.status_code}")
        
        if response.status_code == 200:
            # Parse and display response
            result = response.json()
            
            print("\n📥 RESPONSE:")
            print(json.dumps(result, indent=2))
            
            # Display key results in a friendly format
            print("\n" + "=" * 60)
            print("📊 ANALYSIS RESULTS:")
            print("=" * 60)
            print(f"Diary ID: {result.get('diaryId')}")
            print(f"User ID: {result.get('userId')}")
            print(f"\n🎯 Top Emotion: {result.get('top_label')}")
            print(f"   Confidence: {result.get('confidence', 0):.2%}")
            
            if 'all_detected' in result:
                print(f"\n🔍 All Detected Emotions:")
                for emotion in result['all_detected']:
                    score = result.get('scores', {}).get(emotion, 0)
                    print(f"   - {emotion}: {score:.2%}")
            
            print(f"\n💬 Supportive Response:")
            suggestion = result.get('summary_suggestion', '')
            # Wrap text at 60 chars for readability
            words = suggestion.split()
            line = ""
            for word in words:
                if len(line) + len(word) + 1 <= 60:
                    line += word + " "
                else:
                    print(f"   {line.strip()}")
                    line = word + " "
            if line:
                print(f"   {line.strip()}")
            
            print("\n" + "=" * 60)
            print("✅ TEST PASSED - Service is working correctly!")
            print("=" * 60)
            
            return True
            
        else:
            print(f"\n❌ ERROR: Received status code {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Could not connect to ML service")
        print(f"   Make sure the service is running at {ML_SERVICE_URL}")
        print(f"   Start it with: python predict_server.py")
        print(f"   Or with Docker: docker run -p 8000:8000 apricity-ml-service")
        return False
        
    except requests.exceptions.Timeout:
        print("\n❌ ERROR: Request timed out")
        print("   The service may be processing the request or overloaded")
        return False
        
    except requests.exceptions.RequestException as e:
        print(f"\n❌ ERROR: Request failed - {str(e)}")
        return False
        
    except json.JSONDecodeError:
        print("\n❌ ERROR: Invalid JSON response")
        print(f"Response text: {response.text}")
        return False
        
    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def test_health():
    """Check if service is healthy"""
    try:
        print("\nChecking service health...")
        response = requests.get(f"{ML_SERVICE_URL}/health", timeout=5)
        
        if response.status_code == 200:
            health_data = response.json()
            print(f"✓ Service is healthy")
            print(f"  Models loaded: {health_data.get('models_loaded', False)}")
            print(f"  Device: {health_data.get('device', 'unknown')}")
            return True
        else:
            print(f"✗ Service health check failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"✗ Health check failed: {str(e)}")
        return False


if __name__ == "__main__":
    print("\n🚀 Starting ML Service Test...\n")
    
    # First check if service is healthy
    if not test_health():
        print("\n⚠️  Service may not be ready. Proceeding anyway...\n")
    
    # Run the prediction test
    success = test_predict()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)
