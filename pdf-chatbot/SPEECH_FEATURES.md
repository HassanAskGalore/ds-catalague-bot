# Speech Features Guide

## ✅ What's Implemented

### 1. Speech-to-Text (STT)
- **Microphone button** in chat input
- Real-time voice recognition
- Continuous recognition mode
- Automatic text insertion

### 2. Text-to-Speech (TTS)
- **Auto-speak toggle** button (top left of avatar panel)
- Automatic response reading
- Neural voice: Jenny (en-US-JennyNeural)
- High-quality audio output

### 3. Viseme-Based Lip Sync
- 22 viseme events from Azure TTS
- Real-time mouth movement
- Accurate phoneme-to-mouth mapping
- Smooth interpolation

## 🎯 How to Use

### Voice Input (STT)
1. Click the **microphone icon** (bottom right of input)
2. Speak your question
3. Text appears automatically in the input field
4. Click send or press Enter

### Voice Output (TTS)
1. **Auto-speak is ON by default**
2. Bot responses are automatically spoken
3. Avatar lip syncs with the speech
4. Click the **speaker icon** (top left) to toggle auto-speak

### Manual Speech Control
- **Stop speaking**: Click speaker icon while speaking
- **Disable auto-speak**: Click speaker icon when not speaking

## 🔧 Configuration

### Change Voice
Edit `lib/azureSpeech.ts`:
```typescript
voice: string = 'en-US-AriaNeural' // Female, expressive
voice: string = 'en-US-GuyNeural'  // Male, natural
voice: string = 'en-US-DavisNeural' // Male, professional
```

### Adjust Lip Sync Sensitivity
Edit `components/AvatarWithLipSync.tsx`:
```typescript
// Increase for more mouth movement
const mouthOpen = getVisemeMouthOpening(currentViseme) * 1.2;

// Decrease for subtle movement
const mouthOpen = getVisemeMouthOpening(currentViseme) * 0.8;
```

### Change Recognition Language
Edit `lib/azureSpeech.ts`:
```typescript
speechConfig.speechRecognitionLanguage = 'de-DE'; // German
speechConfig.speechRecognitionLanguage = 'fr-FR'; // French
speechConfig.speechRecognitionLanguage = 'es-ES'; // Spanish
```

## 🎨 UI Indicators

### Microphone States
- **Gray**: Ready to record
- **Red pulsing**: Recording active
- **Disabled**: Loading/processing

### Speaker States
- **Blue**: Auto-speak enabled OR currently speaking
- **Gray**: Auto-speak disabled
- **Pulsing**: Currently speaking

## 📊 Viseme Mapping

The system maps 22 Azure viseme IDs to mouth shapes:

| Viseme | Phoneme | Mouth Opening |
|--------|---------|---------------|
| 0      | Silence | 0% (closed)   |
| 1      | p, b, m | 0% (closed)   |
| 10     | aa      | 80% (wide)    |
| 13     | o       | 60% (round)   |
| 15     | open    | 70% (open)    |

## 🐛 Troubleshooting

### No voice input
- Check browser microphone permissions
- Ensure HTTPS or localhost
- Verify Azure Speech key in `.env.local`

### No voice output
- Check browser audio permissions
- Verify speakers/headphones
- Check browser console for errors

### No lip sync
- Verify 3D model has morph targets
- Check console for viseme events
- Ensure audio is playing

### Poor lip sync quality
- Check viseme timing in console
- Adjust interpolation speed
- Verify morph target names match

## 🚀 Performance Tips

1. **Preload audio**: TTS generates audio before playing
2. **Viseme buffering**: Events are queued for smooth playback
3. **Morph target caching**: Reduces computation overhead

## 📝 Next Steps

- [ ] Add emotion detection
- [ ] Implement voice activity detection
- [ ] Add background noise suppression
- [ ] Support multiple languages
- [ ] Add voice cloning
- [ ] Implement real-time translation

## 🔗 Resources

- [Azure Speech SDK Docs](https://docs.microsoft.com/azure/cognitive-services/speech-service/)
- [Viseme Reference](https://docs.microsoft.com/azure/cognitive-services/speech-service/how-to-speech-synthesis-viseme)
- [Three.js Morph Targets](https://threejs.org/docs/#api/en/objects/Mesh.morphTargetInfluences)
