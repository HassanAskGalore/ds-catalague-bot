# 🚀 Complete Setup Guide - Rhubarb Lip-Sync Avatar

Follow these steps EXACTLY to get the avatar working.

---

## ✅ Step 1: Check Prerequisites

### 1.1 Check Python
```bash
python --version
# Should be Python 3.8 or higher
```

### 1.2 Check Node.js
```bash
node --version
# Should be v16 or higher

npm --version
# Should be 8 or higher
```

### 1.3 Install FFmpeg

**Windows:**
```bash
# Download from https://ffmpeg.org/download.html
# Or use chocolatey:
choco install ffmpeg
```

**Linux:**
```bash
sudo apt-get update
sudo apt-get install ffmpeg -y
```

**macOS:**
```bash
brew install ffmpeg
```

**Verify FFmpeg:**
```bash
ffmpeg -version
# Should show FFmpeg version info
```

---

## ✅ Step 2: Setup Azure Speech Services

### 2.1 Get Azure Credentials
1. Go to https://portal.azure.com
2. Create a "Speech Services" resource
3. Copy your **Key** and **Region**

### 2.2 Create Backend .env File
```bash
cd pdf-chatbot/backend
```

Create a file named `.env` with this content:
```env
AZURE_SPEECH_KEY=your_actual_key_here
AZURE_SPEECH_REGION=centralindia
```

**Replace `your_actual_key_here` with your actual Azure Speech key!**

---

## ✅ Step 3: Setup Rhubarb Executable

### 3.1 Check if Rhubarb Exists
```bash
cd pdf-chatbot/backend

# Windows
dir Rhubarb-Lip-Sync-1.13.0-Windows\rhubarb.exe

# Linux/Mac
ls -la Rhubarb/rhubarb
```

### 3.2 Make Rhubarb Executable (Linux/Mac Only)
```bash
chmod +x Rhubarb/rhubarb
```

### 3.3 Test Rhubarb
```bash
# Windows
Rhubarb-Lip-Sync-1.13.0-Windows\rhubarb.exe --version

# Linux/Mac
./Rhubarb/rhubarb --version
```

**Expected output:** `Rhubarb Lip Sync version 1.13.0`

---

## ✅ Step 4: Setup Backend

### 4.1 Install Python Dependencies
```bash
cd pdf-chatbot/backend
pip install -r requirements.txt
```

**Wait for all packages to install (may take 2-3 minutes)**

### 4.2 Verify Installation
```bash
python -c "import azure.cognitiveservices.speech as speechsdk; print('Azure Speech SDK installed!')"
```

### 4.3 Create tts_audio Directory
```bash
mkdir -p tts_audio
```

---

## ✅ Step 5: Setup Frontend

### 5.1 Install Node Dependencies
```bash
cd pdf-chatbot/frontend
npm install
```

**Wait for all packages to install (may take 3-5 minutes)**

### 5.2 Verify Shyla Model Exists
```bash
# Check if Shyla.glb exists in public folder
ls -la public/Shyla.glb
```

If missing, you need to add your Shyla.glb 3D model to `pdf-chatbot/frontend/public/Shyla.glb`

---

## ✅ Step 6: Start the Application

### 6.1 Start Backend (Terminal 1)
```bash
cd pdf-chatbot/backend
python -m api.main
```

**Expected output:**
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Keep this terminal running!**

### 6.2 Start Frontend (Terminal 2 - New Terminal)
```bash
cd pdf-chatbot/frontend
npm run dev
```

**Expected output:**
```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
- event compiled client and server successfully
```

**Keep this terminal running!**

---

## ✅ Step 7: Test the Application

### 7.1 Open Browser
Go to: **http://localhost:3000**

### 7.2 Test Chat
1. Type a question: "What is the weight of PK 20/II clamp?"
2. Press Enter or click Send
3. Wait for response

### 7.3 Check Avatar Animation
You should see:
- ✅ Avatar loads (Shyla model)
- ✅ Eyes blink automatically
- ✅ Eyes look around
- ✅ Head moves slightly (breathing)
- ✅ When speaking: mouth moves with lip-sync
- ✅ Audio plays synchronized with mouth movement

---

## 🔍 Troubleshooting

### Problem: Backend won't start

**Error: "ModuleNotFoundError: No module named 'azure'"**
```bash
cd pdf-chatbot/backend
pip install azure-cognitiveservices-speech
```

**Error: "Rhubarb not found"**
- Check Step 3 again
- Make sure Rhubarb executable exists
- On Linux/Mac, make sure it's executable (`chmod +x`)

**Error: "FFmpeg not found"**
- Install FFmpeg (see Step 1.3)
- Restart terminal after installation

### Problem: Frontend won't start

**Error: "Cannot find module"**
```bash
cd pdf-chatbot/frontend
rm -rf node_modules package-lock.json
npm install
```

**Error: "Port 3000 already in use"**
```bash
# Kill process on port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:3000 | xargs kill -9
```

### Problem: Avatar doesn't load

**Check browser console (F12):**
- Look for errors
- Check if Shyla.glb is loading
- Verify WebGL is supported

**Check Shyla.glb exists:**
```bash
ls -la pdf-chatbot/frontend/public/Shyla.glb
```

### Problem: No lip movement

**Check backend logs:**
- Look for "TTS audio generated"
- Look for "Lip-sync generated"
- Check for errors

**Check browser console:**
- Look for `[Rhubarb]` logs
- Should see: "Fetching lip-sync data..."
- Should see: "Shape A", "Shape D", etc.

**Test backend directly:**
```bash
curl -X POST http://localhost:8000/lip-sync \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello world",
    "user_id": "test123",
    "voice_selection": "Female_2"
  }'
```

### Problem: Audio plays but no sync

**Check mouthCues in response:**
- Open browser DevTools (F12)
- Go to Network tab
- Find `/lip-sync` request
- Check response has `mouthCues` array

**Check console logs:**
- Should see: `[Rhubarb] Time: 0.05s, Shape: D`
- Should see: `[Rhubarb] Ah: 0.00 → 0.80`

---

## 📊 Verification Checklist

Before asking for help, verify:

- [ ] Python 3.8+ installed
- [ ] Node.js 16+ installed
- [ ] FFmpeg installed and in PATH
- [ ] Azure Speech key in `.env` file
- [ ] Rhubarb executable exists and is executable
- [ ] Backend dependencies installed (`pip install -r requirements.txt`)
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Shyla.glb exists in `public/` folder
- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] Browser console shows no errors
- [ ] Backend logs show no errors

---

## 🎯 Expected Behavior

### When you send a message:

1. **Backend receives request** → Logs: "Lip-sync request: ..."
2. **RAG generates answer** → Logs: "Query: ..."
3. **Azure TTS generates audio** → Logs: "TTS audio generated: ..."
4. **FFmpeg converts to PCM** → Logs: "Converted to PCM: ..."
5. **Rhubarb generates lip-sync** → Logs: "Lip-sync generated: ..."
6. **Frontend receives response** → Console: "[Rhubarb] Received response"
7. **Audio plays** → Console: "[Rhubarb] Audio started"
8. **Mouth animates** → Console: "[Rhubarb] Shape A", "[Rhubarb] Shape D", etc.
9. **Morph targets update** → Console: "[Rhubarb] Ah: 0.00 → 0.80"

### Avatar Features:

- **Idle state:**
  - Eyes blink every 2-6 seconds
  - Eyes look around every 2-5 seconds
  - Head moves slightly (breathing)
  - Mouth closed (shape X)

- **Speaking state:**
  - Head nods and tilts naturally
  - Eyebrows raise slightly
  - Cheeks move slightly
  - Mouth shapes change: A, B, C, D, E, F, G, H, X
  - Morph targets animate smoothly

---

## 🎬 Quick Start Commands

**Terminal 1 (Backend):**
```bash
cd pdf-chatbot/backend
python -m api.main
```

**Terminal 2 (Frontend):**
```bash
cd pdf-chatbot/frontend
npm run dev
```

**Browser:**
```
http://localhost:3000
```

---

## 📝 Test Messages

Try these to test the avatar:

1. "What is the weight of PK 20/II clamp?"
2. "Show all suspension clamps"
3. "Tell me about tension clamps"
4. "What products do you have?"

---

## 🆘 Still Having Issues?

1. **Check all logs** - Backend terminal and browser console
2. **Verify all prerequisites** - Use the checklist above
3. **Test each component** - Backend endpoint, FFmpeg, Rhubarb
4. **Share error messages** - Copy exact error text

---

## 🎉 Success!

If everything works, you should see:
- ✅ Avatar loads and animates
- ✅ Eyes blink and move
- ✅ Head moves naturally
- ✅ Mouth syncs perfectly with audio
- ✅ Smooth, realistic animation

Enjoy your Rhubarb-powered avatar! 🚀
