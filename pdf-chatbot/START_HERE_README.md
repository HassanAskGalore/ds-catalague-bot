# 🚀 Quick Start - Rhubarb Avatar

## Fastest Way to Run

### Windows:
```bash
# Double-click this file:
setup_and_run.bat
```

### Linux/Mac:
```bash
chmod +x setup_and_run.sh
./setup_and_run.sh
```

---

## Before Running

### 1. Create `.env` file in `backend/` folder:
```env
AZURE_SPEECH_KEY=your_azure_key_here
AZURE_SPEECH_REGION=centralindia
```

### 2. Make sure you have:
- Python 3.8+
- Node.js 16+
- FFmpeg installed

---

## Manual Setup (if script fails)

### Backend:
```bash
cd backend
pip install -r requirements.txt
python -m api.main
```

### Frontend (new terminal):
```bash
cd frontend
npm install
npm run dev
```

### Open Browser:
```
http://localhost:3000
```

---

## What You'll See

1. **Avatar loads** - Shyla 3D model appears
2. **Eyes blink** - Automatic every few seconds
3. **Eyes move** - Natural looking around
4. **Type a message** - "What is the weight of PK 20/II clamp?"
5. **Avatar speaks** - Mouth moves with perfect lip-sync!

---

## Troubleshooting

**Problem:** Backend won't start
- Check `.env` file exists with Azure key
- Run: `pip install azure-cognitiveservices-speech`

**Problem:** No lip movement
- Check backend logs for errors
- Verify FFmpeg is installed: `ffmpeg -version`
- Check Rhubarb exists: `ls backend/Rhubarb/rhubarb`

**Problem:** Frontend errors
- Delete `node_modules` and run `npm install` again
- Check port 3000 is not in use

---

## Full Documentation

See `COMPLETE_SETUP_GUIDE.md` for detailed instructions.

---

## System Architecture

```
User Question
    ↓
Backend RAG (Get Answer)
    ↓
Azure TTS (Generate Audio)
    ↓
FFmpeg (Convert to PCM)
    ↓
Rhubarb (Generate Mouth Shapes: A-H, X)
    ↓
Frontend (Play Audio + Animate Mouth)
    ↓
Avatar (Apply 711 Morph Targets)
```

---

## Features

✅ **Rhubarb Lip-Sync** - 9 mouth shapes (A-H, X)
✅ **Eye Blinking** - Natural automatic blinking
✅ **Eye Movement** - Looking around naturally
✅ **Head Animation** - Nodding and breathing
✅ **Facial Expressions** - Eyebrows and cheeks
✅ **711 Morph Targets** - Full facial animation

---

## Need Help?

1. Check `COMPLETE_SETUP_GUIDE.md`
2. Check `RHUBARB_SETUP.md`
3. Look at backend terminal for errors
4. Check browser console (F12) for errors

---

Enjoy your avatar! 🎉
