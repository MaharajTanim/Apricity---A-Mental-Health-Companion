#!/usr/bin/env python3
"""
Comprehensive test script with multiple test cases
Tests various emotions and scenarios
"""

import requests
import json
import sys
from datetime import datetime

ML_SERVICE_URL = "http://localhost:8000"

# Test cases with different emotions
TEST_CASES = [
    {
        "name": "Anxiety/Stress",
        "data": {
            "userId": "user-001",
            "diaryId": "diary-001",
            "text": "I'm feeling really anxious about tomorrow's presentation. My heart is racing and I can't stop worrying about what might go wrong."
        }
    },
    {
        "name": "Joy/Happiness",
        "data": {
            "userId": "user-002",
            "diaryId": "diary-002",
            "text": "Today was amazing! I got the promotion I've been working towards. I feel so grateful and excited about the future!"
        }
    },
    {
        "name": "Sadness/Disappointment",
        "data": {
            "userId": "user-003",
            "diaryId": "diary-003",
            "text": "Everything feels heavy today. I didn't get the job I really wanted, and I'm feeling pretty down about it."
        }
    },
    {
        "name": "Mixed Emotions",
        "data": {
            "userId": "user-004",
            "diaryId": "diary-004",
            "text": "I'm both excited and nervous about moving to a new city. It's a great opportunity, but I'll miss my friends and family."
        }
    },
    {
        "name": "Neutral/Reflective",
        "data": {
            "userId": "user-005",
            "diaryId": "diary-005",
            "text": "Today was a regular day at work. Had some meetings, finished a few tasks. Nothing particularly exciting or troubling."
        }
    }
]


def test_single_case(test_case):
    """Test a single case and return results"""
    print(f"\n{'='*60}")
    print(f"Test Case: {test_case['name']}")
    print('='*60)
    
    data = test_case['data']
    print(f"Text: \"{data['text'][:80]}...\"")
    
    try:
        response = requests.post(
            f"{ML_SERVICE_URL}/predict",
            json=data,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            
            print(f"\n✓ Status: {response.status_code}")
            print(f"Top Emotion: {result['top_label']} ({result['confidence']:.1%})")
            print(f"All Detected: {', '.join(result['all_detected'])}")
            print(f"Response: {result['summary_suggestion'][:100]}...")
            
            return {
                'success': True,
                'result': result,
                'test_name': test_case['name']
            }
        else:
            print(f"\n✗ Failed with status {response.status_code}")
            return {
                'success': False,
                'error': f"Status {response.status_code}",
                'test_name': test_case['name']
            }
            
    except Exception as e:
        print(f"\n✗ Error: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'test_name': test_case['name']
        }


def run_all_tests():
    """Run all test cases"""
    print("\n" + "="*60)
    print("Apricity ML Service - Comprehensive Test Suite")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)
    
    # Health check first
    print("\nChecking service health...")
    try:
        health = requests.get(f"{ML_SERVICE_URL}/health", timeout=5)
        if health.status_code == 200:
            health_data = health.json()
            print(f"✓ Service is healthy")
            print(f"  Models loaded: {health_data.get('models_loaded')}")
            print(f"  Device: {health_data.get('device')}")
        else:
            print(f"⚠️  Health check returned {health.status_code}")
    except Exception as e:
        print(f"✗ Health check failed: {str(e)}")
        print("  Make sure the service is running:")
        print("    python predict_server.py")
        print("    OR")
        print("    docker run -p 8000:8000 apricity-ml-service")
        return False
    
    # Run test cases
    results = []
    for test_case in TEST_CASES:
        result = test_single_case(test_case)
        results.append(result)
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for r in results if r['success'])
    total = len(results)
    
    for result in results:
        status = "✓ PASS" if result['success'] else "✗ FAIL"
        print(f"{status}: {result['test_name']}")
        if not result['success']:
            print(f"       Error: {result.get('error', 'Unknown')}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed!")
        return True
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return False


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
