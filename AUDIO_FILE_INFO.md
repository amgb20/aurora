# Audio File Information

## Sample Audio File Details

**Filename**: `Is Mars the Future of Humanity？ Joe Rogan Asks Elon Musk 2.wav`

**Location**: Project root directory
```
/Users/vinben007/Documents/Personal Apps/Aurora/Is Mars the Future of Humanity？ Joe Rogan Asks Elon Musk 2.wav
```

**File Properties**:
- **Format**: RIFF WAVE audio
- **Encoding**: Microsoft PCM, 16-bit
- **Channels**: Stereo
- **Sample Rate**: 44.1 kHz (44100 Hz)
- **File Size**: 62 MB

**Content**: 
- Conversation between Joe Rogan (Speaker 1) and Elon Musk (Speaker 2)
- Topic: Mars colonization and the future of humanity

## How to Use This File

### 1. With the Test Script
The `test_api.py` script is pre-configured to use this exact file:
```python
AUDIO_FILE = "Is Mars the Future of Humanity？ Joe Rogan Asks Elon Musk 2.wav"
```

Simply run:
```bash
python test_api.py
```

### 2. With cURL
```bash
curl -X POST "http://localhost:8000/match" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "audio=@Is Mars the Future of Humanity？ Joe Rogan Asks Elon Musk 2.wav"
```

### 3. With Swagger UI
1. Go to http://localhost:8000/docs
2. Click on any endpoint (e.g., `/match`)
3. Click "Try it out"
4. Click "Choose File" and select: `Is Mars the Future of Humanity？ Joe Rogan Asks Elon Musk 2.wav`
5. Click "Execute"

### 4. With Python Requests
```python
import requests

url = "http://localhost:8000/match"
files = {
    "audio": open("Is Mars the Future of Humanity？ Joe Rogan Asks Elon Musk 2.wav", "rb")
}
response = requests.post(url, files=files)
print(response.json())
```

## User Profile Mapping

This audio file corresponds to the user profiles in `sample_data/user_profiles.json`:

- **Speaker 1 (Joe Rogan)** → `user_1`
  - Psychometrics: `[0.8, 0.4, 0.7, 0.2, 0.9]`
  - Traits: High openness, moderate extraversion, high neuroticism

- **Speaker 2 (Elon Musk)** → `user_2`
  - Psychometrics: `[0.3, 0.9, 0.1, 0.6, 0.4]`
  - Traits: High conscientiousness, moderate agreeableness, low extraversion

## Expected Processing Times

For this 2-minute audio file:
- **Transcription** (`/transcribe`): 10-30 seconds
- **Summarization** (`/summarise`): 15-40 seconds
- **Full Pipeline** (`/match`): 20-50 seconds

Processing time varies based on OpenAI API response times.

## Expected Output Topics

When you run the `/summarise` endpoint with this audio, expect topics like:
1. Mars colonization
2. Space exploration and technology
3. Future of humanity
4. Multi-planetary civilization
5. Sustainability and resources

## File Verification

To verify the file is correct:

```bash
# Check if file exists
ls -lah "Is Mars the Future of Humanity？ Joe Rogan Asks Elon Musk 2.wav"

# Verify it's a WAV file
file "Is Mars the Future of Humanity？ Joe Rogan Asks Elon Musk 2.wav"

# Check file size (should be ~62MB)
du -h "Is Mars the Future of Humanity？ Joe Rogan Asks Elon Musk 2.wav"
```

Expected output:
```
Is Mars the Future of Humanity？ Joe Rogan Asks Elon Musk 2.wav: RIFF (little-endian) data, WAVE audio, Microsoft PCM, 16 bit, stereo 44100 Hz
```

## Troubleshooting

### File Not Found Error

If you get "file not found" errors:

1. **Check current directory**:
   ```bash
   pwd
   # Should be: /Users/vinben007/Documents/Personal Apps/Aurora
   ```

2. **List files to verify name**:
   ```bash
   ls -la *.wav
   ```

3. **Use absolute path if needed**:
   ```bash
   /Users/vinben007/Documents/Personal\ Apps/Aurora/Is\ Mars\ the\ Future\ of\ Humanity？\ Joe\ Rogan\ Asks\ Elon\ Musk\ 2.wav
   ```

### Special Characters in Filename

Note: The filename contains a special character `？` (full-width question mark). If you have issues:

1. **Copy exact filename from this doc**
2. **Use tab completion** in terminal
3. **Escape special characters** if needed

### ✅ Large File Support

**Good news!** The application now supports files up to 200MB through automatic chunking.

Your 62MB file:
- ✅ Automatically split into 2 chunks (5 minutes each)
- ✅ Processed sequentially
- ✅ Results merged seamlessly
- ✅ Complete transcript with all timestamps

**No preprocessing required!** Just upload and go.

If you see `chunks_processed: 2` in the response, it means the file was automatically chunked.

## Using Your Own Audio Files

To test with other audio files:

1. **Supported formats**: WAV, MP3, M4A, FLAC
2. **Size limit**: Under 25MB for best results
3. **Update the filename** in:
   - `test_api.py` (line 13): `AUDIO_FILE = "your_file.wav"`
   - Or pass directly via Swagger UI or cURL

---

**The application is configured to use this exact audio file for all tests and demonstrations.**

