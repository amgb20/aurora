# Bug Fixes Summary

## Issues Fixed

### 1. OpenAI Whisper File Format Error (400 Error)
**Error Message:** 
```
Invalid file format. Supported formats: ['flac', 'm4a', 'mp3', 'mp4', 'mpeg', 'mpga', 'oga', 'ogg', 'wav', 'webm']
```

**Root Cause:** 
The OpenAI API requires the filename (with extension) to detect the file format. The code was only passing the file handle without the filename.

**Fix Applied:**
Modified `app/services/transcription.py` in the `_transcribe_single` method:
- Extract file extension from the audio file path
- Create a proper filename with extension
- Pass file as tuple `(filename, file_handle)` to OpenAI API

```python
# Before:
file=audio_file

# After:
file_ext = os.path.splitext(audio_file_path)[1]
filename = f"audio{file_ext}" if file_ext else "audio.wav"
file=(filename, audio_file)
```

### 2. Pyannote Speaker Diarization Error (NoneType Error)
**Error Message:**
```
'NoneType' object has no attribute 'eval'
```

**Root Cause:**
The pyannote.audio integration was using outdated API:
- Old model version (`pyannote/speaker-diarization@2.1`)
- Deprecated parameter (`use_auth_token` instead of `token`)
- Missing device configuration (CPU/GPU)

**Fix Applied:**
Updated `app/services/diarization.py`:

1. **Added torch import** for device management:
```python
import torch
```

2. **Updated to pyannote 3.1 model** with correct parameters:
```python
# Before:
self.pipeline = Pipeline.from_pretrained(
    "pyannote/speaker-diarization@2.1",
    use_auth_token=self.hf_token
)

# After:
self.pipeline = Pipeline.from_pretrained(
    "pyannote/speaker-diarization-3.1",
    use_auth_token=self.hf_token
)
```

3. **Added device configuration** (GPU/CPU):
```python
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
self.pipeline.to(device)
```

4. **Updated speaker count parameters**:
```python
# Use num_speakers when count is known, otherwise min/max
if self.min_speakers == self.max_speakers:
    diarization = pipeline(audio_path, num_speakers=self.min_speakers)
else:
    diarization = pipeline(audio_path, min_speakers=self.min_speakers, max_speakers=self.max_speakers)
```

## Testing
After these fixes, the `/transcribe_with_speakers` endpoint should work correctly:

```bash
curl -X 'POST' \
  'http://localhost:8000/transcribe_with_speakers' \
  -H 'accept: application/json' \
  -H 'Content-Type: multipart/form-data' \
  -F 'audio=@Is Mars the Future of Humanity？ Joe Rogan Asks Elon Musk 2.wav;type=audio/wav' \
  -F 'speaker_names=joe,elon'
```

## Dependencies
All required dependencies are already in `requirements.txt`:
- `torch==2.1.0` ✅
- `torchaudio==2.1.0` ✅
- `pyannote.audio==3.1.1` ✅
- `openai==1.54.0` ✅

## Environment Variables Required
Make sure your `.env` file has:
- `OPENAI_API_KEY` - For Whisper transcription
- `HUGGINGFACE_TOKEN` - For pyannote speaker diarization

## ⚠️ IMPORTANT: HuggingFace Model Access Setup

The pyannote models are **gated** and require accepting user conditions:

1. **Create HuggingFace Access Token:**
   - Visit https://huggingface.co/settings/tokens
   - Create a new token with read access
   - Copy the token to your `.env` file as `HUGGINGFACE_TOKEN`

2. **Accept Model Terms & Conditions** (REQUIRED):
   - Visit https://hf.co/pyannote/speaker-diarization-3.1
   - Click "Agree and access repository"
   - Also visit https://hf.co/pyannote/segmentation and accept terms
   - You must be logged in to HuggingFace

Without accepting these terms, you'll get the error:
```
Could not download 'pyannote/segmentation' model.
It might be because the model is private or gated...
```

