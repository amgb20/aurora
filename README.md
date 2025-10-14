# Audio Compatibility Pipeline

A sophisticated FastAPI-based pipeline that analyzes audio conversations, extracts topics, and computes personality-based compatibility scores between speakers.

## 🎯 Overview

This application processes audio conversations through multiple stages:
1. **Transcription**: Converts audio to text with timestamps using OpenAI Whisper
   - ✨ **NEW**: Automatic chunking for files up to 200MB (no size limits!)
   - 🎙️ **NEW**: Speaker diarization to identify and label individual speakers
2. **Topic Extraction**: Identifies top 5 discussion topics using GPT-4
3. **Vectorization**: Creates embeddings for topics using OpenAI embeddings
4. **Fusion**: Combines topic vectors with personality traits (Big Five model)
5. **Matching**: Computes compatibility scores using cosine similarity

## 🏗️ Architecture

### Tech Stack
- **FastAPI**: REST API with auto-generated Swagger UI
- **OpenAI Whisper API**: Audio transcription with timestamps
- **OpenAI GPT-4**: Intelligent topic extraction
- **OpenAI Embeddings** (text-embedding-3-small): Topic vectorization
- **NumPy/scikit-learn**: Cosine similarity matching
- **Docker + Docker Compose**: Containerization

### Project Structure
```
Aurora/
├── app/
│   ├── main.py              # FastAPI application with endpoints
│   ├── models.py            # Pydantic request/response models
│   ├── config.py            # Settings and environment configuration
│   └── services/
│       ├── transcription.py # Whisper API integration
│       ├── topic_extraction.py # GPT-4 topic extraction
│       ├── vectorization.py # OpenAI embeddings
│       ├── fusion.py        # Topic × Personality fusion
│       └── matching.py      # Compatibility scoring
├── sample_data/
│   └── user_profiles.json   # Psychometric profiles
├── Dockerfile
├── docker-compose.yml
└── requirements.txt
```

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- OpenAI API key with access to Whisper, GPT-4, and Embeddings

### Setup

1. **Clone the repository**
```bash
cd Aurora
```

2. **Set up environment variables**
```bash
# Create .env file
echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
```

3. **Build and run with Docker**
```bash
docker-compose up --build
```

The API will be available at `http://localhost:8000`

4. **Access the interactive API documentation**
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Alternative: Local Development

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variable
export OPENAI_API_KEY=your_api_key_here

# Run the application
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 📊 Using the Sample Data

### User Profiles
The `sample_data/user_profiles.json` contains psychometric profiles for Joe Rogan (user_1) and Elon Musk (user_2):

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

**Traits** (in order): `[openness, conscientiousness, extraversion, agreeableness, neuroticism]`

### Audio File
The sample audio file "Is Mars the Future of Humanity？ Joe Rogan Asks Elon Musk 2.wav" (62MB, 6 minutes) is included in the root directory for testing.

**Note**: This file is 62MB, which exceeds the standard 25MB Whisper API limit. The pipeline automatically chunks large files into 5-minute segments, processes them separately, and seamlessly merges the results. No manual intervention required!

## 🔌 API Endpoints

### 1. POST `/transcribe`
Transcribe audio to text with timestamps.

### 1b. POST `/transcribe_with_speakers` ✨ NEW
Transcribe audio with speaker diarization to identify and label individual speakers (e.g., Joe Rogan & Elon Musk).

**Request:**
- `audio`: Audio file (multipart/form-data)

**Response:**
```json
{
  "transcript": "Full transcript text...",
  "timestamps": [
    {"word": "hello", "start": 0.0, "end": 0.5}
  ],
  "duration": 120.5
}
```

### 2. POST `/summarise`
Extract top 5 topics from audio or transcript.

**Request:**
- `audio`: Audio file (optional)
- `transcript`: Text transcript (optional)
- `extract_cues`: Boolean for conversational cues (default: true)

**Response:**
```json
{
  "topics": [
    {
      "topic": "Mars Colonization",
      "description": "Discussion about establishing human settlements on Mars",
      "relevance_score": 0.95
    }
  ],
  "conversational_cues": {
    "enthusiasm_level": "high",
    "agreement_level": "agreeing",
    "interruptions": 3,
    "speaking_time_ratio": {"speaker_1": 0.6, "speaker_2": 0.4}
  }
}
```

### 3. POST `/match`
Compute compatibility score between speakers.

---

## 🎙️ Speaker Diarization (NEW!)

The pipeline now supports **automatic speaker diarization** using pyannote.audio to identify and label individual speakers in conversations.

### Quick Start

```bash
# 1. Get a free Hugging Face token
# Visit: https://huggingface.co/settings/tokens

# 2. Add to .env file
echo "HUGGINGFACE_TOKEN=hf_your_token_here" >> .env

# 3. Accept pyannote model terms
# Visit: https://huggingface.co/pyannote/speaker-diarization

# 4. Use the new endpoint
curl -X POST "http://localhost:8000/transcribe_with_speakers" \
  -F "audio=@conversation.wav" \
  -F "speaker_names=Joe Rogan,Elon Musk"
```

### Features

- 🎙️ Automatic speaker detection with optional `num_speakers` / `min_speakers` / `max_speakers`
- 🏷️ Speaker labeling and name mapping
- ⏱️ Word-level speaker attribution with timestamps
- 📊 Speaker statistics (speaking time, turns)
- 📝 Prettified JSON output saved to `outputs/diarized_transcripts/` plus optional TXT/SRT formatters

### Where it fits in the pipeline

1. **Transcription (`app/services/transcription.py`)** – Whisper (OpenAI) generates the verbatim transcript with word-level timestamps and confidences.
2. **Diarization (`app/services/diarization.py`)** – pyannote’s `speaker-diarization-3.1` pipeline segments the audio into speaker turns, honouring any speaker-count hints you pass to the endpoint.
3. **Alignment & Stats** – Each Whisper token is matched to the diarization window to attach the correct speaker label, producing `words_with_speakers` plus aggregate metrics.
4. **API response (`app/main.py`)** – The `/transcribe_with_speakers` endpoint packages the structured result and also writes a readable JSON snapshot to `outputs/diarized_transcripts/<filename>.json` for later review.

```
Audio file ➜ Whisper transcript ➜ Pyannote speaker turns ➜ Aligned words + stats ➜ FastAPI response + saved JSON
```

The diagrams and a deeper walkthrough live in [SPEAKER_DIARIZATION_IMPLEMENTATION.md](SPEAKER_DIARIZATION_IMPLEMENTATION.md) and [SPEAKER_DIARIZATION.md](SPEAKER_DIARIZATION.md).

### Example Response

```json
{
  "transcript": "Full conversation...",
  "speaker_segments": [
    {"start": 0.0, "end": 5.2, "speaker_id": "SPEAKER_0", "speaker_name": "Joe Rogan"},
    {"start": 5.5, "end": 12.3, "speaker_id": "SPEAKER_1", "speaker_name": "Elon Musk"}
  ],
  "words_with_speakers": [...],
  "speakers_detected": 2,
  "speaker_mapping": {"SPEAKER_0": "Joe Rogan", "SPEAKER_1": "Elon Musk"}
}
```

**See [SPEAKER_DIARIZATION.md](SPEAKER_DIARIZATION.md) for complete guide.**

---

### Original Endpoints

**Request:**
- `audio`: Audio file with conversation

**Response:**
```json
{
  "compatibility_score": 0.75,
  "interpretation": "High compatibility: The speakers show strong alignment...",
  "user_vectors": {
    "user_1": {
      "user_id": "user_1",
      "topic_vector": [...],
      "personality_traits": [0.8, 0.4, 0.7, 0.2, 0.9],
      "combined_vector": [...]
    }
  },
  "details": {
    "topic_similarity": 0.82,
    "personality_similarity": 0.68,
    "trait_differences": {...}
  }
}
```

## 🧠 Design Decisions

### 1. Audio Pre-Processing (Outlined - Not Implemented)

For production systems, the following pre-processing steps would be considered:

- **Audio Normalization**: Level volume across the file to ensure consistent input to Whisper
- **Noise Reduction**: Apply spectral gating to remove background noise
- **Format Conversion**: Ensure audio is in a Whisper-compatible format (prefer WAV, 16kHz sample rate)
- **Silence Trimming**: Remove long silence periods to reduce processing time
- **Sample Rate Standardization**: Convert to 16kHz for optimal Whisper performance

**Rationale**: OpenAI's Whisper API handles most of this internally, so we rely on their preprocessing.

### 2. Topic Vectorization Method

**Choice**: OpenAI text-embedding-3-small

**Rationale**:
- High-quality semantic representations (1536 dimensions)
- Better than TF-IDF for capturing topic meaning
- Consistent with using OpenAI ecosystem
- Relevance-weighted averaging of topic embeddings

**Alternatives Considered**:
- TF-IDF: Too sparse, lacks semantic understanding
- One-hot encoding: Doesn't capture topic relationships
- SentenceTransformers: Good alternative, but OpenAI embeddings integrate better

### 3. Fusion Logic: Topics × Personality

**Approach**:
1. Weight topic embeddings by relevance scores
2. Apply personality-based modulation:
   - **High Openness (>0.6)**: 1.2× amplification (receptive to diverse topics)
   - **High Conscientiousness (>0.6)**: 1.15× amplification (focused discussion)
   - **High Extraversion (>0.6)**: 1.1× amplification (active participation)
   - **High Agreeableness (>0.6)**: 1.05× amplification (collaborative)
   - **High Neuroticism (>0.6)**: 0.9× reduction (variable engagement)
3. Weight by speaker engagement (derived from speaking time ratio)
4. Combine weighted topic vector with personality traits: `[topic_embedding, psychometrics]`

**Rationale**: This creates a holistic representation that captures both *what* was discussed and *how* each person's personality influenced their engagement.

### 4. Conversational Cues

**Implemented**:
- Enthusiasm level (emotional energy)
- Agreement level (consensus vs. debate)
- Interruption count (turn-taking dynamics)
- Speaking time ratio (participation balance)

**Extraction Method**: GPT-4 analyzes transcript for these patterns using prompt engineering.

### 5. Matching Logic

**Method**: Cosine similarity on combined vectors

**Score Normalization**: Convert [-1, 1] → [0, 1] scale

**Interpretation Thresholds**:
- 0.9-1.0: Exceptional compatibility
- 0.7-0.9: High compatibility
- 0.5-0.7: Moderate compatibility
- 0.3-0.5: Low compatibility
- 0.0-0.3: Minimal compatibility

**Edge Cases**:
- Zero vectors: Return 0.0 compatibility
- Missing profiles: Return error with clear message
- Single speaker: Require minimum 2 profiles

### 6. Architecture Patterns

- **Async/Await**: All service methods are async for better concurrency
- **Dependency Injection**: Services initialized at app startup
- **Pydantic Models**: Strong typing for requests/responses
- **Error Handling**: Comprehensive try-catch with meaningful error messages
- **Temporary File Management**: Automatic cleanup of uploaded files

## 🧪 Testing the API

### Using the Swagger UI

1. Navigate to `http://localhost:8000/docs`
2. Test each endpoint:

**Test `/transcribe`:**
```bash
curl -X POST "http://localhost:8000/transcribe" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "audio=@Is Mars the Future of Humanity？ Joe Rogan Asks Elon Musk 2.wav"
```

**Test `/summarise`:**
```bash
curl -X POST "http://localhost:8000/summarise" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "audio=@Is Mars the Future of Humanity？ Joe Rogan Asks Elon Musk 2.wav" \
  -F "extract_cues=true"
```

**Test `/match`:**
```bash
curl -X POST "http://localhost:8000/match" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "audio=@Is Mars the Future of Humanity？ Joe Rogan Asks Elon Musk 2.wav"
```

## 🐳 Docker Commands

```bash
# Build and start
docker-compose up --build

# Run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down

# Rebuild after code changes
docker-compose up --build --force-recreate
```

## 📈 Performance Considerations

- **File Size Limit**: 200MB (with automatic chunking for large files)
  - Files < 24MB: Processed directly (~10-30 seconds)
  - Files > 24MB: Automatically chunked into 5-minute segments
  - Your 62MB file: Processed in 2 chunks (~30-60 seconds)
- **Concurrent Requests**: FastAPI handles async requests efficiently
- **Caching**: Settings are cached using `@lru_cache`
- **Memory**: Temporary files are cleaned up immediately after processing
- **Chunking**: Transparent to users - happens automatically for large files

## 🔒 Security Notes

- API key stored in environment variables
- Temporary files auto-deleted after processing
- Input validation on all endpoints
- File size limits enforced

## 🛠️ Troubleshooting

**Issue**: "Invalid API key"
- Verify your `.env` file has the correct `OPENAI_API_KEY`

**Issue**: "File too large"
- Ensure audio file is under 25MB
- Consider compressing the audio

**Issue**: "Docker container won't start"
- Check Docker logs: `docker-compose logs`
- Ensure port 8000 is not in use

## 📝 License

This project is for educational and interview purposes.

## 👤 Author

Built as part of the ML Interview Take-Home Assessment.
