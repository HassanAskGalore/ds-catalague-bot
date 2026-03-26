# Azure Speech Services Setup Guide

## Overview
This guide will help you set up Azure Speech Services for STT (Speech-to-Text) and TTS (Text-to-Speech) with viseme-based lip sync.

## Step 1: Create Azure Speech Resource

1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Create a resource"
3. Search for "Speech"
4. Click "Speech" by Microsoft
5. Click "Create"
6. Fill in the details:
   - **Subscription**: Your Azure subscription
   - **Resource group**: Create new or use existing
   - **Region**: Choose closest to your users (e.g., `eastus`, `westeurope`)
   - **Name**: Give it a unique name (e.g., `mosdorfer-speech`)
   - **Pricing tier**: Choose `F0` (Free) for testing or `S0` (Standard) for production
7. Click "Review + create" then "Create"

## Step 2: Get Your Keys

1. Once deployed, go to your Speech resource
2. Click on "Keys and Endpoint" in the left menu
3. Copy **KEY 1** and **REGION**

## Step 3: Configure Frontend

1. Navigate to `pdf-chatbot/frontend/`
2. Create `.env.local` file (copy from `.env.local.example`):
   ```bash
   cp .env.local.example .env.local
   ```

3. Edit `.env.local` and add your credentials:
   ```env
   NEXT_PUBLIC_AZURE_SPEECH_KEY=your_key_here
   NEXT_PUBLIC_AZURE_SPEECH_REGION=eastus
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

## Step 4: Install Dependencies

```bash
cd pdf-chatbot/frontend
npm install
```

This will install:
- `microsoft-cognitiveservices-speech-sdk` - Azure Speech SDK

## Step 5: Test the Setup

1. Start the frontend:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000
3. Click the microphone button to test STT
4. Send a message and click the speaker button to test TTS with lip sync

## Features Implemented

### Speech-to-Text (STT)
- Real-time voice recognition
- Continuous recognition mode
- Automatic punctuation
- Language: English (US)

### Text-to-Speech (TTS)
- Neural voice: `en-US-JennyNeural` (female, natural)
- Alternative voices available:
  - `en-US-GuyNeural` (male)
  - `en-US-AriaNeural` (female)
  - `en-US-DavisNeural` (male)

### Viseme-Based Lip Sync
- 22 viseme events from Azure TTS
- Real-time synchronization with audio
- Smooth morph target interpolation
- Accurate phoneme-to-mouth-shape mapping

## Viseme IDs Reference

Azure provides 22 viseme IDs based on IPA phonemes:

| ID | Phoneme | Example | Mouth Shape |
|----|---------|---------|-------------|
| 0  | Silence | -       | Closed      |
| 1  | p, b, m | **p**at | Lips together |
| 2  | f, v    | **f**at | Teeth on lip |
| 3  | th      | **th**in | Tongue between teeth |
| 4  | t, d    | **t**ap | Tongue on roof |
| 5  | k, g    | **k**it | Back of tongue up |
| 6  | ch, j, sh | **ch**in | Lips forward |
| 7  | s, z    | **s**it | Teeth close |
| 8  | n, l    | **n**o  | Tongue on roof |
| 9  | r       | **r**ed | Lips slightly rounded |
| 10 | aa      | f**a**ther | Mouth open wide |
| 11 | e       | b**e**d | Mouth slightly open |
| 12 | i       | f**ee**t | Mouth wide smile |
| 13 | o       | b**oa**t | Lips rounded |
| 14 | u       | b**oo**k | Lips narrow |

## Pricing

### Free Tier (F0)
- **STT**: 5 hours/month free
- **TTS**: 0.5 million characters/month free
- **Neural voices**: 0.5 million characters/month free

### Standard Tier (S0)
- **STT**: $1 per hour
- **TTS Standard**: $4 per 1M characters
- **TTS Neural**: $16 per 1M characters

## Troubleshooting

### "Invalid subscription key"
- Check that your key is correct in `.env.local`
- Ensure no extra spaces in the key
- Verify the region matches your Azure resource

### "Microphone not working"
- Check browser permissions (allow microphone access)
- Ensure HTTPS or localhost (required for mic access)
- Try a different browser

### "No lip sync"
- Check browser console for viseme events
- Verify your 3D model has morph targets
- Ensure audio is playing

### "Audio not playing"
- Check browser audio permissions
- Verify speakers/headphones are connected
- Check browser console for errors

## Advanced Configuration

### Change Voice

Edit `pdf-chatbot/frontend/lib/azureSpeech.ts`:

```typescript
export async function synthesizeSpeechWithVisemes(
  text: string,
  voice: string = 'en-US-AriaNeural' // Change this
): Promise<TTSResult> {
  // ...
}
```

### Adjust Speech Rate/Pitch

Use SSML (Speech Synthesis Markup Language):

```typescript
const ssml = `
  <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
    <voice name="en-US-JennyNeural">
      <prosody rate="1.1" pitch="+5%">
        ${text}
      </prosody>
    </voice>
  </speak>
`;

synthesizer.speakSsmlAsync(ssml, ...);
```

## Next Steps

1. ✅ Install Azure Speech SDK
2. ✅ Configure environment variables
3. ✅ Test STT and TTS
4. 🔄 Fine-tune viseme mapping for your 3D model
5. 🔄 Add emotion/expression support
6. 🔄 Implement voice activity detection

## Resources

- [Azure Speech Documentation](https://docs.microsoft.com/azure/cognitive-services/speech-service/)
- [Viseme Reference](https://docs.microsoft.com/azure/cognitive-services/speech-service/how-to-speech-synthesis-viseme)
- [Neural Voice Gallery](https://speech.microsoft.com/portal/voicegallery)
