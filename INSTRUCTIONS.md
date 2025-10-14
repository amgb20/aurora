# Setup Instructions for Audio Compatibility Pipeline

## Prerequisites

Before you begin, ensure you have:
- Docker and Docker Compose installed on your system
- An OpenAI API key with access to:
  - Whisper API (audio transcription)
  - GPT-4 API (topic extraction)
  - Embeddings API (text-embedding-3-small)

## Step-by-Step Setup

### 1. Navigate to Project Directory

```bash
cd /Users/vinben007/Documents/Personal\ Apps/Aurora
```

### 2. Create Environment File

You need to provide your OpenAI API key. Create a `.env` file:

```bash
# Copy the template
cp env.template .env

# Edit the .env file and add your actual API key
# Replace 'your_openai_api_key_here' with your actual key
nano .env
```

Your `.env` file should look like:
```
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Start the Application

#### Option A: Using the Setup Script (Recommended)

```bash
chmod +x setup.sh
./setup.sh
```

The script will:
- Check if Docker is installed
- Create `.env` file if needed
- Build and start the Docker containers
- Verify the service is running

#### Option B: Using Docker Compose Manually

```bash
docker-compose up --build
```

To run in detached mode (background):
```bash
docker-compose up --build -d
```

### 4. Verify the Application is Running

Open your browser and navigate to:
- **Health Check**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

You should see the Swagger UI with three main endpoints:
- POST /transcribe
- POST /summarise  
- POST /match

### 5. Test the API

#### Option A: Using the Test Script

```bash
python test_api.py
```

This will run automated tests on all endpoints and show the results.

#### Option B: Using Swagger UI (Browser)

1. Go to http://localhost:8000/docs
2. Click on the `/match` endpoint
3. Click "Try it out"
4. Click "Choose File" and select: `Is Mars the Future of Humanity？ Joe Rogan Asks Elon Musk 2.wav`
5. Click "Execute"
6. View the results below

#### Option C: Using cURL (Terminal)

```bash
# Test health check
curl http://localhost:8000/

# Test full pipeline (compatibility matching)
curl -X POST "http://localhost:8000/match" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "audio=@Is Mars the Future of Humanity？ Joe Rogan Asks Elon Musk 2.wav"
```

## Sample Data

The project includes sample data for testing:

### Audio File
- `Is Mars the Future of Humanity？ Joe Rogan Asks Elon Musk 2.wav`
- A conversation between Joe Rogan and Elon Musk about Mars colonization

### User Profiles
Located in `sample_data/user_profiles.json`:

```json
[
  {
    "id": "user_1",
    "name": "Joe Rogan",
    "psychometrics": [0.8, 0.4, 0.7, 0.2, 0.9]
  },
  {
    "id": "user_2",
    "name": "Elon Musk",
    "psychometrics": [0.3, 0.9, 0.1, 0.6, 0.4]
  }
]
```

The psychometrics array represents the Big Five personality traits:
1. Openness
2. Conscientiousness
3. Extraversion
4. Agreeableness
5. Neuroticism

Each value is between 0.0 and 1.0.

## Expected Processing Times

For the sample audio file (~2 minutes):
- `/transcribe`: 10-30 seconds
- `/summarise`: 15-40 seconds (includes transcription if audio is provided)
- `/match`: 20-50 seconds (complete pipeline)

Note: Processing time depends on OpenAI API response times.

## Viewing Logs

To see application logs:

```bash
# If running in detached mode
docker-compose logs -f

# To see just the last 100 lines
docker-compose logs --tail=100
```

## Stopping the Application

```bash
# Stop and remove containers
docker-compose down

# Stop, remove containers, and remove volumes
docker-compose down -v
```

## Troubleshooting

### Issue: "Port 8000 is already in use"

```bash
# Find what's using port 8000
lsof -i :8000

# Kill the process or change the port in docker-compose.yml
# Edit docker-compose.yml and change:
# ports:
#   - "8001:8000"  # Use port 8001 instead
```

### Issue: "Invalid API Key" or "OpenAI API Error"

1. Verify your `.env` file exists and contains the correct API key
2. Ensure your API key has access to Whisper, GPT-4, and Embeddings
3. Check your OpenAI account has sufficient credits
4. Restart the container after updating `.env`:
   ```bash
   docker-compose down
   docker-compose up --build
   ```

### Issue: "Audio file not found"

Ensure the audio file is in the project root directory:
```bash
ls -la "Is Mars the Future of Humanity？ Joe Rogan Asks Elon Musk 2.wav"
```

### Issue: Docker build fails

```bash
# Clean rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up
```

### Issue: Python script errors

If using the test script:
```bash
# Install dependencies
pip install requests

# Run the script
python test_api.py
```

## Project Structure

```
Aurora/
├── app/                    # Application code
│   ├── main.py            # FastAPI endpoints
│   ├── models.py          # Pydantic models
│   ├── config.py          # Configuration
│   └── services/          # Service layer
├── sample_data/           # Sample psychometric profiles
├── Dockerfile             # Docker build instructions
├── docker-compose.yml     # Docker orchestration
├── requirements.txt       # Python dependencies
├── setup.sh              # Setup automation script
├── test_api.py           # API test script
└── README.md             # Full documentation
```

## Next Steps

1. Review the comprehensive [README.md](README.md) for architecture details
2. Read [WRITEUP.md](WRITEUP.md) for technical reasoning and trade-offs
3. Check [QUICKSTART.md](QUICKSTART.md) for a condensed guide
4. Explore the code in `app/services/` to understand each pipeline stage
5. Try uploading your own audio files through the API

## API Endpoints Summary

### GET /
Health check endpoint - verifies the service is running

### POST /transcribe
Transcribe audio to text with word-level timestamps
- Input: Audio file
- Output: Transcript, timestamps, duration

### POST /summarise
Extract top 5 topics and conversational cues
- Input: Audio file OR transcript text
- Output: Topics with descriptions, conversational dynamics

### POST /match
Complete compatibility analysis pipeline
- Input: Audio file
- Output: Compatibility score, interpretation, user vectors, detailed analysis

## Support

For issues or questions:
1. Check this INSTRUCTIONS.md file
2. Review README.md for detailed documentation
3. Check Docker logs: `docker-compose logs`
4. Ensure all prerequisites are met

---

**Good luck with your testing!** 🚀

