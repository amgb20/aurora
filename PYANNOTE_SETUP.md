# 🎤 Pyannote Speaker Diarization Setup Guide

## ⚠️ CRITICAL: Model Access Required

The pyannote models are **gated** - you MUST complete these steps or the API will fail!

## Step-by-Step Setup

### 1. Create HuggingFace Account
- Go to https://huggingface.co/join if you don't have an account
- Verify your email

### 2. Accept Model Terms (REQUIRED!)
You must accept the terms for BOTH models:

**Model 1: Speaker Diarization**
- Visit: https://hf.co/pyannote/speaker-diarization-3.1
- Log in to HuggingFace
- Click "Agree and access repository"

**Model 2: Segmentation (dependency)**
- Visit: https://hf.co/pyannote/segmentation  
- Log in to HuggingFace
- Click "Agree and access repository"

### 3. Create Access Token
- Go to: https://huggingface.co/settings/tokens
- Click "New token"
- Name it (e.g., "aurora-diarization")
- Select "Read" access
- Click "Generate token"
- **Copy the token immediately** (you won't see it again!)

### 4. Add Token to Environment
Edit your `.env` file:
```bash
HUGGINGFACE_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxx
```

Replace `hf_xxxxxxxxxxxxxxxxxxxxx` with your actual token.

### 5. Restart the Server
```bash
# Stop the current server (Ctrl+C)
# Then restart:
uvicorn app.main:app --reload
```

## Verification

Test the endpoint:
```bash
curl -X 'POST' \
  'http://localhost:8000/transcribe_with_speakers' \
  -H 'accept: application/json' \
  -H 'Content-Type: multipart/form-data' \
  -F 'audio=@Is Mars the Future of Humanity？ Joe Rogan Asks Elon Musk 2.wav;type=audio/wav' \
  -F 'speaker_names=joe,elon'
```

## Common Errors

### Error: "Could not download 'pyannote/segmentation' model"
**Solution:** You haven't accepted the model terms. Go to step 2 above.

### Error: "'NoneType' object has no attribute 'eval'"  
**Solution:** Invalid or missing HuggingFace token. Check step 3 and 4 above.

### Error: "401 Unauthorized"
**Solution:** Your token doesn't have the right permissions or you haven't accepted the model terms.

## What Models Are Used?

- `pyannote/speaker-diarization-3.1` - Main diarization pipeline
- `pyannote/segmentation` - Dependency for speaker segmentation
- Both are gated and require user acceptance

## Privacy Note

The models run **locally** on your machine. Audio is not sent to HuggingFace servers during inference, only the model weights are downloaded initially.

