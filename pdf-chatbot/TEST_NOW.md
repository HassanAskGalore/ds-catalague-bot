# 🧪 Test Your Avatar NOW

## Quick Test (5 minutes)

### Step 1: Start Servers (2 min)

**Terminal 1 - Backend:**
```bash
cd pdf-chatbot/backend
python -m api.main
```
Wait for: `Uvicorn running on http://0.0.0.0:8000`

**Terminal 2 - Frontend:**
```bash
cd pdf-chatbot/frontend
npm run dev
```
Wait for: `ready started server on 0.0.0.0:3000`

### Step 2: Open Browser
```
http://localhost:3000
```

### Step 3: Test Features (3 min)

#### Test 1: Avatar Loads ✅
- **Expected:** Shyla 3D model appears
- **Check:** Avatar is visible, not floating

#### Test 2: Eye Blinking ✅
- **Wait:** 2-6 seconds
- **Expected:** Eyes blink automatically
- **Check:** Smooth blinking animation

#### Test 3: Eye Movement ✅
- **Wait:** 2-5 seconds
- **Expected:** Eyes look left/right/up/down
- **Check:** Natural eye movements

#### Test 4: Head Movement ✅
- **Observe:** Head rotates slightly
- **Expected:** Subtle breathing motion
- **Check:** NO vertical floating, only rotation

#### Test 5: Speech-to-Text (STT) ✅
1. Click microphone button (bottom right)
2. Allow microphone access
3. Say: "What is the weight of PK 20/II clamp?"
4. **Expected:** Text appears in input field
5. Click Send

#### Test 6: Text-to-Speech + Lip-Sync (TTS) ✅
1. Wait for response
2. **Expected:** 
   - Audio plays
   - Mouth moves with audio
   - Head nods during speech
   - Perfect lip synchronization

---

## What You Should See:

### ✅ Idle State:
- Avatar standing still
- Eyes blinking every few seconds
- Eyes looking around
- Head rotating slightly (breathing)
- Mouth closed (shape X)
- **NO floating up and down**

### ✅ Speaking State:
- Audio playing from speakers
- Mouth shapes changing: X → D → C → B → A → F → X
- Head nodding and tilting
- Eyebrows raising slightly
- Cheeks moving
- Perfect audio-visual sync

---

## Browser Console Check:

Press **F12** to open console, you should see:

```
[Avatar] Found mesh with 711 morph targets
[Avatar] Phoneme morphs: (15) ['EE_1', 'Er', 'IH', 'Ah', 'Oh', ...]
[Avatar] Mouth morphs: (20) ['Mouth_Smile_L', 'Mouth_Open', ...]
[Avatar] Jaw morphs: (1) ['Jaw_Open']
```

When speaking:
```
[Rhubarb] Fetching lip-sync data...
[Rhubarb] Received response
[Rhubarb] Audio started
[Rhubarb] Time: 0.05s, Shape: D
[Rhubarb] Shape D: Ah, Jaw_Open
[Rhubarb] Ah: 0.00 → 0.80
```

---

## Backend Logs Check:

In backend terminal, you should see:

```
INFO: Lip-sync request: What is the weight...
INFO: TTS audio generated: tts_audio/user123.wav
INFO: Converted to PCM: tts_audio/user123_pcm.wav
INFO: Lip-sync generated: tts_audio/user123.json
```

---

## Quick Troubleshooting:

### Problem: No audio
- Check speakers are on
- Check browser audio permissions
- Check backend logs for TTS errors

### Problem: No lip movement
- Check browser console for errors
- Verify backend generated lip-sync JSON
- Check `[Rhubarb]` logs in console

### Problem: Avatar floating
- **FIXED!** Should not float anymore
- If still floating, refresh page

### Problem: No eye/head movement
- Wait 5-10 seconds
- Check browser console for errors
- Verify WebGL is working

### Problem: Microphone doesn't work
- Check browser microphone permissions
- Use Chrome or Edge (Safari not supported)
- Check microphone is connected

---

## Success Criteria:

✅ Avatar loads without floating
✅ Eyes blink automatically
✅ Eyes look around naturally
✅ Head rotates (no vertical movement)
✅ Microphone button works
✅ Can speak and text appears
✅ Audio plays when responding
✅ Mouth syncs perfectly with audio
✅ Smooth, natural animation

---

## Test Messages:

Try these questions:

1. "What is the weight of PK 20/II clamp?"
2. "Show all suspension clamps"
3. "Tell me about tension clamps"
4. "What products do you have?"

---

## Expected Timeline:

- **0:00** - Start servers
- **0:30** - Backend ready
- **1:00** - Frontend ready
- **1:30** - Open browser
- **2:00** - Avatar loads
- **2:05** - First eye blink
- **2:10** - Eyes look around
- **2:30** - Test microphone
- **3:00** - Send first message
- **3:05** - Avatar starts speaking
- **3:10** - Perfect lip-sync visible
- **5:00** - All tests complete ✅

---

## If Everything Works:

🎉 **Congratulations!** Your Rhubarb-powered avatar is fully functional!

You now have:
- ✅ Speech-to-Text (voice input)
- ✅ Text-to-Speech (audio output)
- ✅ Perfect lip-sync (Rhubarb)
- ✅ Natural eye animation
- ✅ Realistic head movement
- ✅ 711 morph targets
- ✅ Smooth, lifelike avatar

---

## Next Steps:

1. Try different questions
2. Test with longer responses
3. Adjust voice selection (Female_1, Female_2, Male_1)
4. Customize avatar appearance
5. Add more animations

---

**Enjoy your avatar!** 🚀
