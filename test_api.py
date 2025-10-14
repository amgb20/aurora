#!/usr/bin/env python3
"""
Test script for the Audio Compatibility Pipeline API.
Run this after starting the Docker container to verify everything works.
"""

import requests
import json
import sys
from pathlib import Path

BASE_URL = "http://localhost:8000"
AUDIO_FILE = "Is Mars the Future of Humanity？ Joe Rogan Asks Elon Musk 2.wav"


def test_health_check():
    """Test the health check endpoint."""
    print("Testing health check endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/")
        response.raise_for_status()
        print("✅ Health check passed")
        print(f"   Response: {json.dumps(response.json(), indent=2)}\n")
        return True
    except Exception as e:
        print(f"❌ Health check failed: {e}\n")
        return False


def test_transcribe():
    """Test the transcription endpoint."""
    print("Testing transcription endpoint...")
    
    if not Path(AUDIO_FILE).exists():
        print(f"❌ Audio file not found: {AUDIO_FILE}")
        print(f"   Please ensure the audio file is in the current directory\n")
        return False
    
    try:
        with open(AUDIO_FILE, "rb") as audio:
            files = {"audio": audio}
            response = requests.post(f"{BASE_URL}/transcribe", files=files)
            response.raise_for_status()
            
        result = response.json()
        print("✅ Transcription successful")
        print(f"   Transcript length: {len(result.get('transcript', ''))} characters")
        print(f"   Duration: {result.get('duration')} seconds")
        print(f"   Timestamps: {len(result.get('timestamps', []))} words\n")
        return True
    except Exception as e:
        print(f"❌ Transcription failed: {e}\n")
        return False


def test_summarise():
    """Test the summarization endpoint."""
    print("Testing summarization endpoint...")
    
    if not Path(AUDIO_FILE).exists():
        print(f"❌ Audio file not found: {AUDIO_FILE}\n")
        return False
    
    try:
        with open(AUDIO_FILE, "rb") as audio:
            files = {"audio": audio}
            data = {"extract_cues": "true"}
            response = requests.post(f"{BASE_URL}/summarise", files=files, data=data)
            response.raise_for_status()
        
        result = response.json()
        print("✅ Summarization successful")
        print(f"   Topics extracted: {len(result.get('topics', []))}")
        
        if result.get('topics'):
            print("\n   Top Topics:")
            for i, topic in enumerate(result['topics'][:3], 1):
                print(f"   {i}. {topic['topic']}")
                print(f"      {topic['description']}")
                print(f"      Relevance: {topic.get('relevance_score', 'N/A')}")
        
        if result.get('conversational_cues'):
            cues = result['conversational_cues']
            print(f"\n   Conversational Cues:")
            print(f"   - Enthusiasm: {cues.get('enthusiasm_level')}")
            print(f"   - Agreement: {cues.get('agreement_level')}")
        print()
        return True
    except Exception as e:
        print(f"❌ Summarization failed: {e}\n")
        return False


def test_match():
    """Test the compatibility matching endpoint."""
    print("Testing compatibility matching endpoint...")
    
    if not Path(AUDIO_FILE).exists():
        print(f"❌ Audio file not found: {AUDIO_FILE}\n")
        return False
    
    try:
        with open(AUDIO_FILE, "rb") as audio:
            files = {"audio": audio}
            response = requests.post(f"{BASE_URL}/match", files=files)
            response.raise_for_status()
        
        result = response.json()
        print("✅ Compatibility matching successful")
        print(f"\n   Compatibility Score: {result.get('compatibility_score', 0):.2%}")
        print(f"\n   Interpretation:")
        print(f"   {result.get('interpretation', 'N/A')}")
        
        if result.get('details'):
            details = result['details']
            print(f"\n   Detailed Analysis:")
            print(f"   - Topic Similarity: {details.get('topic_similarity', 0):.2%}")
            print(f"   - Personality Similarity: {details.get('personality_similarity', 0):.2%}")
            print(f"   - Most Similar Trait: {details.get('most_similar_trait')}")
            print(f"   - Most Different Trait: {details.get('most_different_trait')}")
        print()
        return True
    except Exception as e:
        print(f"❌ Compatibility matching failed: {e}\n")
        return False


def main():
    """Run all tests."""
    print("=" * 60)
    print("Audio Compatibility Pipeline - API Test Suite")
    print("=" * 60)
    print()
    
    results = []
    
    # Test 1: Health Check
    results.append(("Health Check", test_health_check()))
    
    # Test 2: Transcription
    results.append(("Transcription", test_transcribe()))
    
    # Test 3: Summarization
    results.append(("Summarization", test_summarise()))
    
    # Test 4: Matching
    results.append(("Compatibility Matching", test_match()))
    
    # Summary
    print("=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    for test_name, passed in results:
        status = "✅ PASSED" if passed else "❌ FAILED"
        print(f"{test_name}: {status}")
    
    print()
    
    all_passed = all(result[1] for result in results)
    
    if all_passed:
        print("🎉 All tests passed! The API is working correctly.")
        return 0
    else:
        print("⚠️  Some tests failed. Please check the errors above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())

