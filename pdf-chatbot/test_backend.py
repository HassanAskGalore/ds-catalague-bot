#!/usr/bin/env python3
"""
Quick test script for backend lip-sync endpoint
"""

import requests
import json
import sys

def test_backend():
    print("=" * 50)
    print("Testing Backend Lip-Sync Endpoint")
    print("=" * 50)
    print()
    
    # Test 1: Health check
    print("[1/3] Testing health endpoint...")
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is running")
            print(f"   Status: {response.json().get('status')}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend on port 8000")
        print("   Make sure backend is running: python -m api.main")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    print()
    
    # Test 2: Lip-sync endpoint
    print("[2/3] Testing lip-sync endpoint...")
    try:
        payload = {
            "message": "Hello world",
            "user_id": "test123",
            "voice_selection": "Female_2"
        }
        
        print(f"   Sending request: {payload}")
        response = requests.post(
            "http://localhost:8000/lip-sync",
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Lip-sync endpoint working")
            print(f"   Text length: {len(data.get('text', ''))}")
            print(f"   Audio length: {len(data.get('audio', ''))}")
            print(f"   Mouth cues: {len(data.get('lipsync', {}).get('mouthCues', []))}")
            print(f"   Duration: {data.get('lipsync', {}).get('metadata', {}).get('duration')}s")
            
            # Check if all required fields are present
            if not data.get('audio'):
                print("⚠️  Warning: No audio data in response")
            if not data.get('lipsync'):
                print("⚠️  Warning: No lipsync data in response")
                
        else:
            print(f"❌ Lip-sync failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ Request timed out (>30s)")
        print("   This might indicate:")
        print("   - Azure TTS is slow")
        print("   - FFmpeg is not installed")
        print("   - Rhubarb is not working")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    print()
    
    # Test 3: Check generated files
    print("[3/3] Checking generated files...")
    import os
    
    tts_dir = "backend/tts_audio"
    if os.path.exists(tts_dir):
        files = os.listdir(tts_dir)
        print(f"✅ TTS audio directory exists")
        print(f"   Files: {len(files)}")
        
        # Check for test files
        test_files = [f for f in files if 'test123' in f]
        if test_files:
            print(f"   Test files found: {test_files}")
        else:
            print("   No test files found yet")
    else:
        print(f"⚠️  TTS audio directory not found: {tts_dir}")
    
    print()
    print("=" * 50)
    print("✅ All tests passed!")
    print("=" * 50)
    print()
    print("Backend is working correctly.")
    print("If frontend still has issues, check:")
    print("1. Browser console for errors")
    print("2. Network tab for failed requests")
    print("3. CORS settings")
    
    return True

if __name__ == "__main__":
    try:
        success = test_backend()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\nTest interrupted")
        sys.exit(1)
