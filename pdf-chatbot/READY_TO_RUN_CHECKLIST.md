# ✅ Ready to Run Checklist

Before running the avatar, verify ALL items below:

---

## 📋 Prerequisites

- [ ] **Python 3.8+** installed
  ```bash
  python --version
  ```

- [ ] **Node.js 16+** installed
  ```bash
  node --version
  ```

- [ ] **FFmpeg** installed
  ```bash
  ffmpeg -version
  ```

---

## 🔑 Configuration

- [ ] **Azure Speech Key** obtained from Azure Portal

- [ ] **`.env` file created** in `backend/` folder with:
  ```env
  AZURE_SPEECH_KEY=your_actual_key_here
  AZURE_SPEECH_REGION=centralindia
  ```

---

## 📁 Files

- [ ] **Rhubarb executable** exists:
  - Windows: `backend/Rhubarb-Lip-Sync-1.13.0-Windows/rhubarb.exe`
  - Linux/Mac: `backend/Rhubarb/rhubarb`

- [ ] **Shyla.glb model** exists in `frontend/public/Shyla.glb`

- [ ] **Backend files** present:
  - `backend/api/main.py`
  - `backend/requirements.txt`

- [ ] **Frontend files** present:
  - `frontend/components/ChatWindowWithRhubarb.tsx`
  - `frontend/components/AvatarWithLipSync.tsx`
  - `frontend/lib/rhubarbLipSync.ts`

---

## 🚀 Quick Run

### Option 1: Automated Script

**Windows:**
```bash
setup_and_run.bat
```

**Linux/Mac:**
```bash
chmod +x setup_and_run.sh
./setup_and_run.sh
```

### Option 2: Manual

**Terminal 1 - Backend:**
```bash
cd backend
pip install -r requirements.txt
python -m api.main
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Browser:**
```
http://localhost:3000
```

---

## ✨ Expected Results

### When you open http://localhost:3000:

1. **Avatar appears** - Shyla 3D model loads
2. **Eyes blink** - Automatic blinking every 2-6 seconds
3. **Eyes move** - Looking around naturally
4. **Head breathes** - Subtle idle animation

### When you send a message:

1. **Backend processes** - Check backend terminal for logs
2. **Audio generates** - Azure TTS creates speech
3. **Rhubarb processes** - Generates mouth shapes
4. **Avatar speaks** - Mouth moves in sync with audio
5. **Head animates** - Natural nodding and movement

---

## 🔍 Verification Steps

### 1. Check Backend is Running
```bash
curl http://localhost:8000/health
```
Should return: `{"status":"ok",...}`

### 2. Check Frontend is Running
Open: http://localhost:3000
Should see: Avatar interface

### 3. Test Lip-Sync Endpoint
```bash
curl -X POST http://localhost:8000/lip-sync \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","user_id":"test","voice_selection":"Female_2"}'
```
Should return JSON with `audio` and `lipsync` data

### 4. Check Browser Console
Press F12, look for:
- `[Avatar] Found mesh with 711 morph targets`
- `[Avatar] Phoneme morphs: ['EE_1', 'Er', 'IH', ...]`
- No red errors

### 5. Send Test Message
Type: "What is the weight of PK 20/II clamp?"

**Backend logs should show:**
```
INFO: Lip-sync request: What is the weight...
INFO: TTS audio generated: ...
INFO: Converted to PCM: ...
INFO: Lip-sync generated: ...
```

**Browser console should show:**
```
[Rhubarb] Fetching lip-sync data...
[Rhubarb] Received response: {...}
[Rhubarb] Audio started
[Rhubarb] Shape D
[Rhubarb] Ah: 0.00 → 0.80
```

---

## 🎯 Success Indicators

✅ **Backend running** - Port 8000, no errors
✅ **Frontend running** - Port 3000, no errors
✅ **Avatar loads** - 3D model visible
✅ **Eyes animate** - Blinking and moving
✅ **Audio plays** - Sound comes from speakers
✅ **Mouth syncs** - Lips move with audio
✅ **Smooth animation** - No stuttering or lag

---

## ❌ Common Issues

### Backend Issues

**"ModuleNotFoundError: No module named 'azure'"**
```bash
pip install azure-cognitiveservices-speech
```

**"Rhubarb not found"**
- Check file exists
- Linux/Mac: `chmod +x backend/Rhubarb/rhubarb`

**"FFmpeg not found"**
- Install FFmpeg (see prerequisites)
- Restart terminal

**"Azure TTS failed"**
- Check `.env` file has correct key
- Verify Azure subscription is active

### Frontend Issues

**"Cannot find module"**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**"Port 3000 in use"**
```bash
# Kill process on port 3000
npx kill-port 3000
```

**"Shyla.glb not found"**
- Verify file exists in `frontend/public/Shyla.glb`
- Check file permissions

### Avatar Issues

**"No mesh with morph targets found"**
- Shyla.glb might be corrupted
- Verify it's the correct model with morph targets

**"Lips don't move"**
- Check backend logs for Rhubarb errors
- Verify FFmpeg is working
- Check browser console for errors

---

## 📞 Getting Help

If you've checked everything and it still doesn't work:

1. **Collect information:**
   - Backend terminal output
   - Frontend terminal output
   - Browser console (F12)
   - Any error messages

2. **Check documentation:**
   - `COMPLETE_SETUP_GUIDE.md` - Detailed setup
   - `RHUBARB_SETUP.md` - Rhubarb specifics
   - `START_HERE_README.md` - Quick start

3. **Verify each component:**
   - Test FFmpeg: `ffmpeg -version`
   - Test Rhubarb: `./backend/Rhubarb/rhubarb --version`
   - Test Python imports: `python -c "import azure.cognitiveservices.speech"`
   - Test backend endpoint: `curl http://localhost:8000/health`

---

## 🎉 You're Ready!

If all checkboxes are checked, run the application and enjoy your Rhubarb-powered avatar!

**Quick Start:**
```bash
# Windows
setup_and_run.bat

# Linux/Mac
./setup_and_run.sh
```

**Then open:** http://localhost:3000

---

Good luck! 🚀
