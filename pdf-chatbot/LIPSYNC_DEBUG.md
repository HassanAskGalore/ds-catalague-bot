# Lip Sync Debugging Guide

## Issues Fixed

### 1. Double Audio Playback ✅
**Problem**: Two voices playing at the same time
**Cause**: Azure Speech SDK was playing audio automatically AND we were playing it again manually
**Solution**: Changed synthesizer to use `null` audio config to prevent automatic playback

### 2. Lip Sync Not Working
**Possible Causes**:
- Avatar model doesn't have morph targets
- Morph targets are named differently than expected
- Viseme timing is off

## How to Debug

### Step 1: Check Browser Console
Open browser DevTools (F12) and look for these log messages:

```
[TTS] Audio generated: XXXXms, Visemes captured: XX
[LipSync] Starting playback with XX visemes
[LipSync] Audio started playing
[LipSync] Applying viseme X at XXXms
[Avatar] Received viseme: X
[Avatar] Found mesh with X morph targets
[Avatar] Morph target names: [...]
```

### Step 2: Verify Morph Targets
When the avatar loads, you should see:
```
[Avatar] Found mesh with X morph targets
[Avatar] Morph target names: [...]
```

If you see:
```
[Avatar] No mesh with morph targets found - lip sync will not work
```
Then your Shyla.glb model doesn't have morph targets for mouth animation.

### Step 3: Check Viseme Flow
When speaking, you should see a continuous stream of:
```
[Viseme] ID: 10, Offset: 123ms
[LipSync] Applying viseme 10 at 123ms
[Avatar] Received viseme: 10
```

If visemes are captured but not applied, check the timing logic.

### Step 4: Test Audio Only
If you hear audio but no lip sync:
1. Check if morph targets exist (Step 2)
2. Verify visemes are being received (Step 3)
3. Check if `isSpeaking` prop is true during playback

## Common Issues

### No Morph Targets in Model
If your Shyla.glb doesn't have morph targets:
- You need to add blend shapes/morph targets in Blender
- Common mouth shapes: mouth_open, mouth_smile, jaw_open, etc.
- Export with "Shape Keys" enabled

### Wrong Morph Target Index
Currently using `morphTargetInfluences[0]` (first morph target).
If mouth is a different index, update the code to use the correct one.

### Timing Issues
If lip sync is delayed or too fast:
- Check audio format (currently using 16kHz MP3)
- Verify `audioOffset` conversion (currently dividing by 10000)
- Use `audio.currentTime` instead of `Date.now()` for better sync

## Testing Commands

1. **Test with simple phrase**: "Hello world"
2. **Test with longer phrase**: "What is the weight of PK 20 clamp?"
3. **Check console logs** for viseme data
4. **Toggle auto-speak** to test manual vs automatic playback

## Next Steps if Still Not Working

1. Export morph target names from Shyla.glb
2. Map Azure viseme IDs to actual morph target names
3. Use multiple morph targets for better lip sync (not just index 0)
4. Consider using Oculus Viseme standard if model supports it
