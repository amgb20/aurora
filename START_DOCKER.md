# How to Start Docker and Run the Application

## Prerequisites

### 1. Start Docker Desktop

Before running any Docker commands, you need to start Docker Desktop:

**On macOS:**
1. Open **Docker Desktop** from Applications or Spotlight
2. Wait for Docker to fully start (whale icon in menu bar should be steady, not animated)
3. Verify Docker is running:
   ```bash
   docker --version
   docker ps
   ```

If you see "Cannot connect to the Docker daemon", Docker is not running yet.

---

## Step-by-Step Instructions

### 1. Ensure Docker is Running

```bash
# Check Docker status
docker info
```

If you get an error, start Docker Desktop and wait ~30 seconds.

### 2. Create Your .env File

**Important**: You must set your OpenAI API key before running Docker!

```bash
cd /Users/vinben007/Documents/Personal\ Apps/Aurora

# Create .env file
echo "OPENAI_API_KEY=your_actual_openai_api_key_here" > .env

# Verify it was created
cat .env
```

Replace `your_actual_openai_api_key_here` with your real OpenAI API key (starts with `sk-`).

### 3. Build the Docker Image

```bash
docker-compose build --no-cache
```

This will:
- Download Python 3.11 image
- Install system dependencies (gcc, ffmpeg)
- Install Python packages (FastAPI, pydub, OpenAI, etc.)
- Copy your application code
- Create the container image

**Expected time**: 2-5 minutes (first time only)

### 4. Start the Application

```bash
docker-compose up
```

**Expected output:**
```
[+] Running 1/1
 ✔ Container aurora-api  Created
Attaching to aurora-api

aurora-api  | INFO:     Started server process [1]
aurora-api  | INFO:     Waiting for application startup.
aurora-api  | INFO:     Application startup complete.
aurora-api  | INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

**Alternative - Run in background:**
```bash
docker-compose up -d  # -d for detached mode
```

### 5. Verify It's Running

Open your browser:
- **Health Check**: http://localhost:8000
- **Swagger UI**: http://localhost:8000/docs

You should see the Swagger UI interface with your 3 API endpoints!

### 6. Test the API

**Option A - Using Swagger UI (Recommended):**
1. Go to http://localhost:8000/docs
2. Click on `POST /match`
3. Click "Try it out"
4. Click "Choose File" and select your audio file
5. Click "Execute"
6. Wait 30-60 seconds
7. See the compatibility results!

**Option B - Using Test Script:**
```bash
# In a new terminal (keep Docker running in the first one)
python test_api.py
```

**Option C - Using cURL:**
```bash
curl -X POST "http://localhost:8000/transcribe" \
  -F "audio=@Is Mars the Future of Humanity？ Joe Rogan Asks Elon Musk 2.wav"
```

---

## Common Issues & Solutions

### Issue 1: "Cannot connect to the Docker daemon"

**Problem**: Docker Desktop is not running

**Solution**:
```bash
# Start Docker Desktop application
open -a Docker

# Wait 30 seconds, then try again
docker ps
```

### Issue 2: "Port 8000 is already in use"

**Problem**: Something else is using port 8000

**Solution**:
```bash
# Find what's using port 8000
lsof -i :8000

# Kill that process or change the port in docker-compose.yml
# Edit docker-compose.yml and change:
# ports:
#   - "8001:8000"
```

### Issue 3: "openai_api_key field required"

**Problem**: .env file is missing or empty

**Solution**:
```bash
# Create .env file with your API key
echo "OPENAI_API_KEY=sk-your-key-here" > .env

# Restart Docker
docker-compose restart
```

### Issue 4: "Incorrect API key provided"

**Problem**: Invalid or expired OpenAI API key

**Solution**:
1. Get a new API key from https://platform.openai.com/api-keys
2. Update .env file
3. Restart: `docker-compose restart`

---

## Viewing Logs

### If running in foreground:
Logs appear directly in the terminal

### If running in background (-d):
```bash
# View all logs
docker-compose logs

# Follow logs (live)
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100
```

---

## Stopping the Application

### If running in foreground:
Press `CTRL+C`

### If running in background:
```bash
docker-compose down
```

---

## Complete Workflow Example

```bash
# 1. Start Docker Desktop (wait for it to start)
open -a Docker
sleep 30

# 2. Navigate to project
cd /Users/vinben007/Documents/Personal\ Apps/Aurora

# 3. Create .env file
echo "OPENAI_API_KEY=sk-your-actual-key" > .env

# 4. Build Docker image
docker-compose build --no-cache

# 5. Start the application
docker-compose up

# 6. In another terminal, test it
open http://localhost:8000/docs
```

---

## What You'll See

### In Terminal (Docker Logs):
```
aurora-api  | INFO:     Started server process [1]
aurora-api  | INFO:     Waiting for application startup.
aurora-api  | INFO:     Application startup complete.
aurora-api  | INFO:     Uvicorn running on http://0.0.0.0:8000
aurora-api  | INFO:     127.0.0.1:52301 - "GET / HTTP/1.1" 200 OK
aurora-api  | INFO:     127.0.0.1:52302 - "GET /docs HTTP/1.1" 200 OK
```

### In Browser (Swagger UI):
A clean, interactive web interface showing:
- **Audio Compatibility Pipeline v1.0.0**
- List of endpoints with descriptions
- Interactive forms to upload files and test
- Real-time request/response display

---

## Quick Reference Commands

```bash
# Build
docker-compose build --no-cache

# Start (foreground)
docker-compose up

# Start (background)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Restart
docker-compose restart

# Rebuild and restart
docker-compose down && docker-compose build --no-cache && docker-compose up
```

---

**Ready to run? Start Docker Desktop, create your .env file, and run `docker-compose up --build`!** 🐳

