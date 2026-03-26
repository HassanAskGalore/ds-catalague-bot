# 🎭 Rhubarb Lip-Sync Avatar - Complete System

## 🚀 Quick Start (3 Steps)

### 1️⃣ Create `.env` file
Create `backend/.env`:
```env
AZURE_SPEECH_KEY=your_key_here
AZURE_SPEECH_REGION=centralindia
```

### 2️⃣ Run Setup Script
**Windows:**
```bash
setup_and_run.bat
```

**Linux/Mac:**
```bash
chmod +x setup_and_run.sh
./setup_and_run.sh
```

### 3️⃣ Open Browser
```
http://localhost:3000
```

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **START_HERE_README.md** | Quick start guide |
| **READY_TO_RUN_CHECKLIST.md** | Pre-flight checklist |
| **COMPLETE_SETUP_GUIDE.md** | Detailed setup instructions |
| **RHUBARB_SETUP.md** | Rhubarb-specific documentation |

---

## 🏗️ System Architecture

```
┌─────────────┐
│   User      │
│  Question   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│         Backend (Python)            │
│  ┌──────────────────────────────┐  │
│  │  1. RAG System               │  │
│  │     - Qdrant Vector DB       │  │
│  │     - GPT-4 Generation       │  │
│  └──────────┬───────────────────┘  │
│             │                       │
│  ┌──────────▼───────────────────┐  │
│  │  2. Azure TTS                │  │
│  │     - Text → Audio (WAV)     │  │
│  └──────────┬───────────────────┘  │
│             │                       │
│  ┌──────────▼───────────────────┐  │
│  │  3. FFmpeg                   │  │
│  │     - WAV → PCM (16-bit)     │  │
│  └──────────┬───────────────────┘  │
│             │                       │
│  ┌──────────▼───────────────────┐  │
│  │  4. Rhubarb Lip-Sync         │  │
│  │     - PCM → Mouth Shapes     │  │
│  │     - Output: JSON           │  │
│  └──────────┬───────────────────┘  │
│             │                       │
│  ┌──────────▼───────────────────┐  │
│  │  5. Response                 │  │
│  │     - Audio (base64)         │  │
│  │     - Lip-sync JSON          │  │
│  │     - Text answer            │  │
│  └──────────────────────────────┘  │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│      Frontend (Next.js/React)       │
│  ┌──────────────────────────────┐  │
│  │  1. Decode Audio             │  │
│  │     - Base64 → Audio Object  │  │
│  └──────────┬───────────────────┘  │
│             │                       │
│  ┌──────────▼───────────────────┐  │
│  │  2. Parse Lip-Sync           │  │
│  │     - mouthCues array        │  │
│  │     - Timing data            │  │
│  └──────────┬───────────────────┘  │
│             │                       │
│  ┌──────────▼───────────────────┐  │
│  │  3. Sync Animation           │  │
│  │     - audio.currentTime      │  │
│  │     - Find current shape     │  │
│  └──────────┬───────────────────┘  │
│             │                       │
│  ┌──────────▼───────────────────┐  │
│  │  4. Apply Morph Targets      │  │
│  │     - Shape → Morphs         │  │
│  │     - A → B_M_P              │  │
│  │     - D → Ah + Jaw_Open      │  │
│  │     - F → W_OO + Pucker      │  │
│  └──────────┬───────────────────┘  │
│             │                       │
│  ┌──────────▼───────────────────┐  │
│  │  5. Render Avatar            │  │
│  │     - Three.js/R3F           │  │
│  │     - 711 morph targets      │  │
│  │     - Eye blinking           │  │
│  │     - Head movement          │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

## 🎯 Features

### Avatar Animation
- ✅ **Rhubarb Lip-Sync** - 9 mouth shapes (A, B, C, D, E, F, G, H, X)
- ✅ **Eye Blinking** - Natural automatic blinking every 2-6 seconds
- ✅ **Eye Movement** - Looking around naturally every 2-5 seconds
- ✅ **Head Animation** - Nodding, tilting, breathing
- ✅ **Facial Expressions** - Eyebrow raises, cheek movements
- ✅ **711 Morph Targets** - Full facial animation support

### Rhubarb Mouth Shapes
| Shape | Phonemes | Example | Morph Targets |
|-------|----------|---------|---------------|
| **A** | P, B, M | "**M**om" | B_M_P, Mouth_Press |
| **B** | K, S, T, EE | "**S**ee" | S_Z, EE_1, Mouth_Stretch |
| **C** | EH, AE | "B**e**d" | AE, Jaw_Open, Mouth_Open |
| **D** | AA | "F**a**ther" | Ah, Jaw_Open (0.9) |
| **E** | AO, ER | "**O**ff", "B**ir**d" | Er, Oh, Mouth_Funnel |
| **F** | UW, OW, W | "Y**ou**", "Sh**ow**" | W_OO, Mouth_Pucker |
| **G** | F, V | "**F**ive" | F_V, Mouth_Lower_Down |
| **H** | L | "**L**ong" | T_L_D_N, Jaw_Open |
| **X** | Silence | (pause) | All morphs at 0 |

---

## 📁 Project Structure

```
pdf-chatbot/
├── backend/
│   ├── api/
│   │   └── main.py                    # /lip-sync endpoint
│   ├── Rhubarb/
│   │   └── rhubarb                    # Linux/Mac executable
│   ├── Rhubarb-Lip-Sync-1.13.0-Windows/
│   │   └── rhubarb.exe                # Windows executable
│   ├── tts_audio/                     # Generated audio files
│   ├── .env                           # Azure credentials
│   └── requirements.txt               # Python dependencies
│
├── frontend/
│   ├── components/
│   │   ├── AvatarWithLipSync.tsx      # 3D avatar component
│   │   └── ChatWindowWithRhubarb.tsx  # Chat UI
│   ├── lib/
│   │   └── rhubarbLipSync.ts          # Rhubarb utilities
│   ├── public/
│   │   └── Shyla.glb                  # 3D model (711 morphs)
│   └── app/
│       └── page.tsx                    # Main page
│
├── setup_and_run.bat                  # Windows setup script
├── setup_and_run.sh                   # Linux/Mac setup script
├── START_HERE_README.md               # Quick start
├── READY_TO_RUN_CHECKLIST.md          # Pre-flight checklist
├── COMPLETE_SETUP_GUIDE.md            # Detailed setup
└── RHUBARB_SETUP.md                   # Rhubarb documentation
```

---

## 🔧 Technology Stack

### Backend
- **Python 3.8+** - Backend runtime
- **FastAPI** - REST API framework
- **Azure Speech Services** - Text-to-Speech
- **FFmpeg** - Audio conversion
- **Rhubarb Lip-Sync** - Phoneme detection
- **Qdrant** - Vector database
- **GPT-4** - Answer generation

### Frontend
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Three.js** - 3D rendering
- **React Three Fiber** - React + Three.js
- **Tailwind CSS** - Styling

---

## 🎬 Usage Example

### 1. Start the application
```bash
./setup_and_run.sh  # or setup_and_run.bat on Windows
```

### 2. Open browser
```
http://localhost:3000
```

### 3. Ask a question
```
"What is the weight of PK 20/II clamp?"
```

### 4. Watch the avatar
- Avatar speaks with perfect lip-sync
- Mouth shapes change: X → D → C → B → A → X
- Eyes blink and move naturally
- Head nods and tilts
- Smooth, realistic animation

---

## 🔍 Debugging

### Check Backend Logs
```bash
# Should see:
INFO: Lip-sync request: ...
INFO: TTS audio generated: ...
INFO: Converted to PCM: ...
INFO: Lip-sync generated: ...
```

### Check Browser Console (F12)
```javascript
// Should see:
[Avatar] Found mesh with 711 morph targets
[Avatar] Phoneme morphs: ['EE_1', 'Er', 'IH', ...]
[Rhubarb] Fetching lip-sync data...
[Rhubarb] Audio started
[Rhubarb] Shape D
[Rhubarb] Ah: 0.00 → 0.80
```

### Test Backend Endpoint
```bash
curl -X POST http://localhost:8000/lip-sync \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","user_id":"test","voice_selection":"Female_2"}'
```

---

## 📊 Performance

- **Audio Generation**: ~1-2 seconds (Azure TTS)
- **Rhubarb Processing**: ~0.5-1 second
- **Total Response Time**: ~2-3 seconds
- **Animation FPS**: 60 FPS (Three.js)
- **Morph Target Updates**: Every frame

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Backend won't start | Check `.env` file, install dependencies |
| FFmpeg not found | Install FFmpeg, restart terminal |
| Rhubarb not found | Check file exists, make executable |
| No lip movement | Check backend logs, verify FFmpeg |
| Avatar doesn't load | Check Shyla.glb exists, verify WebGL |
| Audio plays but no sync | Check mouthCues in response |

See `COMPLETE_SETUP_GUIDE.md` for detailed troubleshooting.

---

## 📝 API Reference

### POST /lip-sync

**Request:**
```json
{
  "message": "Hello, how are you?",
  "user_id": "user123",
  "voice_selection": "Female_2"
}
```

**Response:**
```json
{
  "text": "Hello, how are you?",
  "audio": "base64_encoded_audio...",
  "lipsync": {
    "metadata": {
      "soundFile": "audio.wav",
      "duration": 2.5
    },
    "mouthCues": [
      {"start": 0.00, "end": 0.05, "value": "X"},
      {"start": 0.05, "end": 0.27, "value": "D"},
      {"start": 0.27, "end": 0.31, "value": "C"}
    ]
  },
  "facialExpression": "default",
  "animation": "Idle"
}
```

---

## 🎉 Success!

If everything works, you should see:
- ✅ Avatar loads and animates smoothly
- ✅ Eyes blink and move naturally
- ✅ Head moves with breathing and speech
- ✅ Mouth syncs perfectly with audio
- ✅ Realistic, lifelike animation

**Enjoy your Rhubarb-powered avatar!** 🚀

---

## 📞 Support

For issues or questions:
1. Check documentation files
2. Review backend and frontend logs
3. Verify all prerequisites are installed
4. Test each component individually

---

## 🙏 Credits

- **Rhubarb Lip-Sync**: https://github.com/DanielSWolf/rhubarb-lip-sync
- **Azure Speech Services**: Microsoft Azure
- **Three.js**: https://threejs.org
- **React Three Fiber**: https://docs.pmnd.rs/react-three-fiber

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**System**: Rhubarb Lip-Sync Avatar
