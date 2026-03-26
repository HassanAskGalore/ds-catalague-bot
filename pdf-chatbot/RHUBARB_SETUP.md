# Rhubarb Lip-Sync Setup Guide

This project uses **Rhubarb Lip-Sync** for accurate avatar lip synchronization.

## System Architecture

```
User Question → Backend → Azure TTS → Audio (WAV) → FFmpeg (PCM) → Rhubarb → Mouth Shapes (JSON) → Frontend → Avatar Animation
```

## Prerequisites

### 1. Azure Speech Services
- Azure subscription with Speech Services enabled
- Speech API key and region

### 2. FFmpeg
Install FFmpeg for audio conversion:

**Windows:**
```bash
# Download from https://ffmpeg.org/download.html
# Or use chocolatey:
choco install ffmpeg
```

**Linux:**
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

### 3. Rhubarb Lip-Sync
Already included in `pdf-chatbot/backend/Rhubarb/` and `pdf-chatbot/backend/Rhubarb-Lip-Sync-1.13.0-Windows/`

**Make executable (Linux/Mac):**
```bash
chmod +x pdf-chatbot/backend/Rhubarb/rhubarb
```

## Backend Setup

### 1. Install Python Dependencies
```bash
cd pdf-chatbot/backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Create `.env` file in `pdf-chatbot/backend/`:
```env
AZURE_SPEECH_KEY=your_azure_speech_key_here
AZURE_SPEECH_REGION=centralindia
```

### 3. Test Rhubarb
```bash
# Check if Rhubarb works
cd pdf-chatbot/backend
./Rhubarb/rhubarb --version
# Should output: Rhubarb Lip Sync version 1.13.0
```

### 4. Start Backend
```bash
cd pdf-chatbot/backend
python -m api.main
# Backend runs on http://localhost:8000
```

## Frontend Setup

### 1. Install Dependencies
```bash
cd pdf-chatbot/frontend
npm install
```

### 2. Start Frontend
```bash
npm run dev
# Frontend runs on http://localhost:3000
```

## How It Works

### Backend Flow (`/lip-sync` endpoint)

1. **Receive Request**
   - User message
   - User ID
   - Voice selection (Male_1, Female_1, Female_2)

2. **Generate Answer**
   - RAG system retrieves relevant information
   - GPT-4 generates response

3. **Text-to-Speech (Azure)**
   ```python
   text → Azure TTS → audio.wav
   ```

4. **Audio Conversion (FFmpeg)**
   ```python
   audio.wav → FFmpeg → audio_pcm.wav (16-bit PCM)
   ```

5. **Lip-Sync Generation (Rhubarb)**
   ```python
   audio_pcm.wav → Rhubarb → lipsync.json
   ```
   
   Output JSON:
   ```json
   {
     "metadata": {
       "soundFile": "audio.wav",
       "duration": 2.5
     },
     "mouthCues": [
       { "start": 0.00, "end": 0.05, "value": "X" },
       { "start": 0.05, "end": 0.27, "value": "D" },
       { "start": 0.27, "end": 0.31, "value": "C" }
     ]
   }
   ```

6. **Return Response**
   ```json
   {
     "text": "Answer text",
     "audio": "base64_encoded_audio",
     "lipsync": { ... },
     "facialExpression": "default",
     "animation": "Idle"
   }
   ```

### Frontend Flow

1. **Fetch Lip-Sync Data**
   ```typescript
   const response = await fetchLipSync(message, userId, voice);
   ```

2. **Decode Audio**
   ```typescript
   const audioUrl = base64ToAudioUrl(response.audio);
   const audio = new Audio(audioUrl);
   ```

3. **Animate Mouth Shapes**
   ```typescript
   audio.addEventListener('timeupdate', () => {
     const currentTime = audio.currentTime;
     const currentCue = findCurrentCue(currentTime);
     avatarRef.current?.setMouthShape(currentCue.value);
   });
   ```

4. **Apply Morph Targets**
   - Rhubarb shape → Shyla morph targets
   - A → B_M_P (lips closed)
   - D → Ah + Jaw_Open (wide open)
   - F → W_OO + Mouth_Pucker (puckered)
   - etc.

## Rhubarb Mouth Shapes

| Shape | Description | Phonemes | Morph Targets |
|-------|-------------|----------|---------------|
| **A** | Closed mouth | P, B, M | B_M_P, Mouth_Press |
| **B** | Clenched teeth | K, S, T, EE | S_Z, EE_1, Mouth_Stretch |
| **C** | Open mouth | EH, AE | AE, Jaw_Open, Mouth_Open |
| **D** | Wide open | AA (father) | Ah, Jaw_Open (0.9) |
| **E** | Slightly rounded | AO, ER (off, bird) | Er, Oh, Mouth_Funnel |
| **F** | Puckered lips | UW, OW, W | W_OO, Mouth_Pucker |
| **G** | Teeth on lip | F, V | F_V, Mouth_Lower_Down |
| **H** | Tongue raised | Long L | T_L_D_N, Jaw_Open |
| **X** | Rest/idle | Silence | All morphs at 0 |

## Troubleshooting

### Backend Issues

**1. Rhubarb not found**
```bash
# Check path
ls pdf-chatbot/backend/Rhubarb/rhubarb

# Make executable
chmod +x pdf-chatbot/backend/Rhubarb/rhubarb
```

**2. FFmpeg not found**
```bash
# Test FFmpeg
ffmpeg -version

# Install if missing (see Prerequisites)
```

**3. Azure TTS fails**
- Check `.env` file has correct `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION`
- Verify Azure subscription is active
- Check API quota limits

**4. Audio conversion fails**
```bash
# Test manually
ffmpeg -i input.wav -acodec pcm_s16le -ar 16000 output_pcm.wav
```

### Frontend Issues

**1. No lip movement**
- Check browser console for errors
- Verify backend is running on port 8000
- Check network tab for `/lip-sync` response
- Look for `[Rhubarb]` logs in console

**2. Audio plays but no sync**
- Check `mouthCues` array in response
- Verify `audio.currentTime` is updating
- Check `setMouthShape()` is being called

**3. Morph targets not working**
- Check console for available morph targets
- Verify Shyla.glb has phoneme morphs (B_M_P, Ah, etc.)
- Check morph target names match exactly

## Testing

### Test Backend Endpoint
```bash
curl -X POST http://localhost:8000/lip-sync \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, how are you?",
    "user_id": "test123",
    "voice_selection": "Female_2"
  }'
```

### Test Rhubarb Manually
```bash
cd pdf-chatbot/backend
./Rhubarb/rhubarb -f json -o test.json test.wav -r phonetic
cat test.json
```

## File Structure

```
pdf-chatbot/
├── backend/
│   ├── api/
│   │   └── main.py              # /lip-sync endpoint
│   ├── Rhubarb/
│   │   └── rhubarb              # Linux/Mac executable
│   ├── Rhubarb-Lip-Sync-1.13.0-Windows/
│   │   └── rhubarb.exe          # Windows executable
│   ├── tts_audio/               # Generated audio files
│   │   ├── user123.wav
│   │   ├── user123_pcm.wav
│   │   └── user123.json
│   └── requirements.txt
├── frontend/
│   ├── components/
│   │   ├── AvatarWithLipSync.tsx      # Avatar with morph targets
│   │   └── ChatWindowWithRhubarb.tsx  # Chat UI with Rhubarb
│   ├── lib/
│   │   └── rhubarbLipSync.ts          # Rhubarb utilities
│   └── app/
│       └── page.tsx                    # Main page
└── RHUBARB_SETUP.md
```

## Performance Tips

1. **Cache audio files** - Store generated audio for repeated queries
2. **Preload Rhubarb** - Keep process warm for faster generation
3. **Optimize morph targets** - Use only necessary morphs for better FPS
4. **Reduce audio quality** - Lower bitrate for faster transmission

## Credits

- **Rhubarb Lip-Sync**: https://github.com/DanielSWolf/rhubarb-lip-sync
- **Azure Speech Services**: https://azure.microsoft.com/en-us/services/cognitive-services/speech-services/
- **Three.js / React Three Fiber**: https://docs.pmnd.rs/react-three-fiber
