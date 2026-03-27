# ⚡ Quick Fix for TTS & STT

## 🚨 If you can't hear audio or use microphone:

### Step 1: Test Backend (30 seconds)
```bash
cd pdf-chatbot
python test_backend.py
```

**If it fails:** Backend issue - see below
**If it passes:** Frontend issue - see below

---

## Backend Issues

### Quick Fix:
```bash
# 1. Make sure .env file exists
cat backend/.env
# Should show: AZURE_SPEECH_KEY=...

# 2. Install dependencies
cd backend
pip install azure-cognitiveservices-speech

# 3. Test FFmpeg
ffmpeg -version

# 4. Check Rhubarb
# Windows:
dir Rhubarb-Lip-Sync-1.13.0-Windows\rhubarb.exe
# Linux/Mac:
ls -la Rhubarb/rhubarb
chmod +x Rhubarb/rhubarb

# 5. Restart backend
python -m api.main
```

---

## Frontend Issues

### Quick Fix:
```bash
# 1. Clear and reinstall
cd frontend
rm -rf node_modules .next
npm install

# 2. Restart frontend
npm run dev

# 3. Hard refresh browser
# Press: Ctrl + Shift + R (Windows/Linux)
# Press: Cmd + Shift + R (Mac)
```

---

## Test TTS Now

1. Open: http://localhost:3000
2. Click green 🎤 button (top left of avatar)
3. Should hear: "Hello, this is a test..."
4. Check browser console (F12) for logs

**Expected logs:**
```
[TTS] Starting speech synthesis...
[Rhubarb] Fetching lip-sync data...
[TTS] Audio playback started successfully
```

**If you see error alert:** Read the error message, it tells you what's wrong

---

## Test STT Now

1. Click microphone button (bottom right)
2. Allow microphone access
3. Say: "Hello"
4. Text should appear in input field

**If doesn't work:**
- Use Chrome or Edge (not Safari)
- Check microphone permissions in browser settings
- Test microphone in system settings

---

## Still Not Working?

### Run Full Diagnostic:
```bash
# Test backend
python test_backend.py

# Check backend is running
curl http://localhost:8000/health

# Check frontend can reach backend
# Open browser console and run:
fetch('http://localhost:8000/health').then(r => r.json()).then(console.log)
```

### Check These:

1. **Backend running?**
   ```bash
   curl http://localhost:8000/health
   ```
   Should return: `{"status":"ok"}`

2. **Azure key configured?**
   ```bash
   cat backend/.env
   ```
   Should show: `AZURE_SPEECH_KEY=...`

3. **FFmpeg installed?**
   ```bash
   ffmpeg -version
   ```
   Should show version info

4. **Rhubarb exists?**
   ```bash
   # Windows:
   dir backend\Rhubarb-Lip-Sync-1.13.0-Windows\rhubarb.exe
   # Linux/Mac:
   ls backend/Rhubarb/rhubarb
   ```

5. **Browser console errors?**
   - Press F12
   - Check Console tab
   - Look for red errors

---

## Emergency Reset

If nothing works, do a complete reset:

```bash
# 1. Stop all servers (Ctrl+C)

# 2. Backend reset
cd pdf-chatbot/backend
pip install -r requirements.txt --force-reinstall
rm -rf tts_audio/*
rm -rf __pycache__

# 3. Frontend reset
cd ../frontend
rm -rf node_modules .next package-lock.json
npm install

# 4. Restart backend
cd ../backend
python -m api.main

# 5. Restart frontend (new terminal)
cd ../frontend
npm run dev

# 6. Hard refresh browser
# Ctrl+Shift+R or Cmd+Shift+R
```

---

## Quick Test Commands

```bash
# Test backend health
curl http://localhost:8000/health

# Test lip-sync endpoint
curl -X POST http://localhost:8000/lip-sync \
  -H "Content-Type: application/json" \
  -d '{"message":"Test","user_id":"test","voice_selection":"Female_2"}'

# Run diagnostic script
python test_backend.py
```

---

## What Should Work:

✅ **TTS (Text-to-Speech):**
- Click green 🎤 button → Hear audio
- Send message → Avatar speaks
- Mouth moves with audio

✅ **STT (Speech-to-Text):**
- Click microphone button → Speak
- Text appears in input field
- Can send spoken message

✅ **Avatar Animation:**
- Eyes blink automatically
- Eyes look around
- Head rotates (no floating)
- Mouth syncs with audio

---

## Get Help:

If still not working, share:
1. Output of `python test_backend.py`
2. Backend terminal logs
3. Browser console logs (F12)
4. Screenshot of Network tab (F12 → Network)

See `TROUBLESHOOT_TTS_STT.md` for detailed debugging.
