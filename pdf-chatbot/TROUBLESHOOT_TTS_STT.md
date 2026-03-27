# 🔧 Troubleshooting TTS & STT

## Quick Diagnosis

### Step 1: Test Backend
```bash
cd pdf-chatbot
python test_backend.py
```

**Expected output:**
```
✅ Backend is running
✅ Lip-sync endpoint working
✅ TTS audio directory exists
✅ All tests passed!
```

**If it fails:** See Backend Issues below

---

### Step 2: Test Frontend
1. Open browser: http://localhost:3000
2. Open DevTools (F12)
3. Click the green 🎤 button (top left of avatar)
4. Check console for logs

**Expected logs:**
```
[TTS] Starting speech synthesis for: Hello, this is a test...
[Rhubarb] Fetching lip-sync data from backend...
[Rhubarb] Received response: {textLength: 67, mouthCues: 45, ...}
[TTS] Decoding audio from base64...
[TTS] Starting lip-sync animation...
[TTS] Playing audio...
[TTS] Audio playback started successfully
[Rhubarb] Audio started, beginning lip-sync
```

**If you see errors:** See Frontend Issues below

---

## Backend Issues

### Issue: "Cannot connect to backend on port 8000"

**Solution:**
```bash
# Check if backend is running
curl http://localhost:8000/health

# If not running, start it:
cd pdf-chatbot/backend
python -m api.main
```

---

### Issue: "ModuleNotFoundError: No module named 'azure'"

**Solution:**
```bash
cd pdf-chatbot/backend
pip install azure-cognitiveservices-speech
```

---

### Issue: "Rhubarb not found"

**Solution:**
```bash
# Windows
dir backend\Rhubarb-Lip-Sync-1.13.0-Windows\rhubarb.exe

# Linux/Mac
ls -la backend/Rhubarb/rhubarb
chmod +x backend/Rhubarb/rhubarb
```

---

### Issue: "FFmpeg not found"

**Solution:**
```bash
# Test FFmpeg
ffmpeg -version

# If not installed:
# Windows: choco install ffmpeg
# Linux: sudo apt-get install ffmpeg
# Mac: brew install ffmpeg
```

---

### Issue: "Azure TTS failed"

**Solution:**
1. Check `.env` file exists in `backend/` folder
2. Verify it contains:
   ```env
   AZURE_SPEECH_KEY=your_actual_key_here
   AZURE_SPEECH_REGION=centralindia
   ```
3. Test Azure key:
   ```bash
   python -c "import os; from dotenv import load_dotenv; load_dotenv(); print('Key:', os.getenv('AZURE_SPEECH_KEY')[:10] + '...')"
   ```

---

## Frontend Issues

### Issue: No audio plays

**Check 1: Browser console**
```
Press F12 → Console tab
Look for errors
```

**Check 2: Network tab**
```
Press F12 → Network tab
Send a message
Look for /lip-sync request
Check if it returns 200 OK
```

**Check 3: Audio permissions**
```
Browser settings → Site settings → Sound
Make sure audio is allowed
```

---

### Issue: "Failed to fetch" or CORS error

**Solution:**
Backend CORS is already configured for localhost:3000 and localhost:3001

If still having issues, check backend logs for CORS errors.

---

### Issue: STT (microphone) doesn't work

**Check 1: Browser support**
```javascript
// Open browser console and run:
console.log('SpeechRecognition:', 
  'SpeechRecognition' in window || 
  'webkitSpeechRecognition' in window
);
```

**Should show:** `SpeechRecognition: true`

**If false:** Use Chrome or Edge (Safari not supported)

**Check 2: Microphone permissions**
```
Browser settings → Site settings → Microphone
Make sure microphone is allowed
```

**Check 3: Microphone hardware**
```
# Test microphone in system settings
# Windows: Settings → Sound → Input
# Mac: System Preferences → Sound → Input
# Linux: Settings → Sound → Input
```

---

## Step-by-Step Debugging

### 1. Start Backend with Verbose Logging
```bash
cd pdf-chatbot/backend
python -m api.main
```

Watch for these logs when you send a message:
```
INFO: Lip-sync request: ...
INFO: TTS audio generated: ...
INFO: Converted to PCM: ...
INFO: Lip-sync generated: ...
```

**If you don't see these:** Backend endpoint not being called

---

### 2. Test Backend Directly
```bash
curl -X POST http://localhost:8000/lip-sync \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","user_id":"test","voice_selection":"Female_2"}'
```

**Expected:** JSON response with `audio` and `lipsync` fields

**If error:** Check backend logs for details

---

### 3. Check Frontend Network Requests
1. Open DevTools (F12)
2. Go to Network tab
3. Send a message
4. Look for `/lip-sync` request
5. Click on it to see:
   - Request payload
   - Response data
   - Status code
   - Timing

---

### 4. Test Audio Playback
Open browser console and run:
```javascript
// Test if browser can play audio
const audio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=');
audio.play().then(() => console.log('✅ Audio works')).catch(e => console.error('❌ Audio failed:', e));
```

---

## Common Error Messages

### "TTS Error: No audio data received from backend"

**Cause:** Backend didn't generate audio

**Check:**
1. Backend logs for errors
2. Azure TTS key is valid
3. FFmpeg is installed
4. Rhubarb is working

---

### "Failed to fetch"

**Cause:** Cannot connect to backend

**Check:**
1. Backend is running on port 8000
2. Frontend is calling correct URL
3. No firewall blocking

---

### "NetworkError when attempting to fetch resource"

**Cause:** CORS or network issue

**Check:**
1. Backend CORS settings
2. Both running on localhost
3. No proxy interfering

---

## Manual Test Procedure

### Test 1: Backend Health
```bash
curl http://localhost:8000/health
```
**Expected:** `{"status":"ok",...}`

### Test 2: Backend Lip-Sync
```bash
curl -X POST http://localhost:8000/lip-sync \
  -H "Content-Type: application/json" \
  -d '{"message":"Test","user_id":"test","voice_selection":"Female_2"}'
```
**Expected:** JSON with audio and lipsync data

### Test 3: Frontend Load
```
Open: http://localhost:3000
```
**Expected:** Avatar loads, no console errors

### Test 4: Frontend TTS
```
Click green 🎤 button (top left)
```
**Expected:** Audio plays, mouth moves

### Test 5: Frontend STT
```
Click microphone button (bottom right)
Allow microphone access
Speak: "Hello"
```
**Expected:** Text appears in input field

---

## Still Not Working?

### Collect Debug Information:

1. **Backend logs:**
   ```bash
   # Copy all output from backend terminal
   ```

2. **Frontend console:**
   ```
   Press F12 → Console tab
   Copy all logs and errors
   ```

3. **Network requests:**
   ```
   Press F12 → Network tab
   Find /lip-sync request
   Copy request and response
   ```

4. **System info:**
   ```bash
   python --version
   node --version
   ffmpeg -version
   # Windows: dir backend\Rhubarb-Lip-Sync-1.13.0-Windows\rhubarb.exe
   # Linux/Mac: ls -la backend/Rhubarb/rhubarb
   ```

5. **Environment:**
   ```bash
   cat backend/.env  # (hide the actual key)
   ```

---

## Quick Fixes

### Fix 1: Restart Everything
```bash
# Stop all servers (Ctrl+C)
# Clear browser cache
# Restart backend
cd pdf-chatbot/backend
python -m api.main

# Restart frontend (new terminal)
cd pdf-chatbot/frontend
npm run dev

# Refresh browser (Ctrl+Shift+R)
```

### Fix 2: Reinstall Dependencies
```bash
# Backend
cd pdf-chatbot/backend
pip install -r requirements.txt --force-reinstall

# Frontend
cd pdf-chatbot/frontend
rm -rf node_modules package-lock.json
npm install
```

### Fix 3: Check Ports
```bash
# Make sure ports are free
# Windows:
netstat -ano | findstr :8000
netstat -ano | findstr :3000

# Linux/Mac:
lsof -ti:8000
lsof -ti:3000
```

---

## Success Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] `curl http://localhost:8000/health` returns OK
- [ ] `python test_backend.py` passes all tests
- [ ] Browser console shows no errors
- [ ] Green 🎤 button plays audio
- [ ] Microphone button records voice
- [ ] Avatar mouth moves with audio

---

**If all checks pass but still no audio/STT, share:**
1. Backend terminal output
2. Browser console logs
3. Network tab screenshot
4. System info (OS, Python version, Node version)
