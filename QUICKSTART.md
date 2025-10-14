# Quick Start Guide

Get the Audio Compatibility Pipeline running in under 5 minutes!

## Steps

### 1. Set Your API Key

Create a `.env` file in the project root:

```bash
echo "OPENAI_API_KEY=sk-your-actual-openai-api-key" > .env
```

### 2. Start the Application

**Using the setup script (recommended):**
```bash
chmod +x setup.sh
./setup.sh
```

**Or manually with Docker Compose:**
```bash
docker-compose up --build
```

### 3. Access the API

Open your browser and navigate to:
- **Interactive API Docs**: http://localhost:8000/docs

### 4. Test the Endpoints

#### Option A: Use Swagger UI (Browser)
1. Go to http://localhost:8000/docs
2. Click on any endpoint (e.g., `/match`)
3. Click "Try it out"
4. Upload the sample audio file: `Is Mars the Future of Humanity？ Joe Rogan Asks Elon Musk 2.wav`
5. Click "Execute"

#### Option B: Use cURL (Terminal)

**Test Health Check:**
```bash
curl http://localhost:8000/
```

**Test Full Pipeline (Match):**
```bash
curl -X POST "http://localhost:8000/match" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "audio=@Is Mars the Future of Humanity？ Joe Rogan Asks Elon Musk 2.wav"
```

**Test Transcription Only:**
```bash
curl -X POST "http://localhost:8000/transcribe" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "audio=@Is Mars the Future of Humanity？ Joe Rogan Asks Elon Musk 2.wav"
```

**Test Topic Extraction:**
```bash
curl -X POST "http://localhost:8000/summarise" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "audio=@Is Mars the Future of Humanity？ Joe Rogan Asks Elon Musk 2.wav" \
  -F "extract_cues=true"
```

### 5. View Logs

```bash
docker-compose logs -f
```

### 6. Stop the Application

```bash
docker-compose down
```

## Troubleshooting

**Problem**: Port 8000 already in use
```bash
# Check what's using port 8000
lsof -i :8000

# Change port in docker-compose.yml
# ports:
#   - "8001:8000"  # Use 8001 instead
```

**Problem**: OpenAI API errors
- Verify your API key is correct in `.env`
- Ensure you have sufficient API credits
- Check you have access to GPT-4, Whisper, and Embeddings APIs

**Problem**: Docker issues
```bash
# Rebuild completely
docker-compose down
docker-compose build --no-cache
docker-compose up
```

## What to Expect

**Processing Times** (approximate):
- `/transcribe`: 10-30 seconds for a 2-minute audio clip
- `/summarise`: 15-40 seconds (includes transcription if audio provided)
- `/match`: 20-50 seconds (full pipeline)

**Sample Output** from `/match`:
```json
{
  "compatibility_score": 0.73,
  "interpretation": "High compatibility: The speakers show strong alignment...",
  "user_vectors": {...},
  "details": {
    "topic_similarity": 0.81,
    "personality_similarity": 0.65,
    "trait_differences": {
      "openness": 0.5,
      "conscientiousness": 0.5,
      ...
    }
  }
}
```

## Next Steps

- Review the full [README.md](README.md) for detailed architecture
- Read [WRITEUP.md](WRITEUP.md) for technical reasoning and trade-offs
- Explore the code in `app/services/` to understand each pipeline stage

