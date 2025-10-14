# Environment Setup Guide

## OpenAI API Key Configuration

This application **requires** an OpenAI API key to function. The API key **must** be stored in a `.env` file in the project root directory.

## Step-by-Step Setup

### 1. Get Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in to your OpenAI account
3. Click "Create new secret key"
4. Copy the key (it starts with `sk-`)

### 2. Create the .env File

**Option A: Copy from template**
```bash
cp env.template .env
```

**Option B: Create manually**
```bash
echo "OPENAI_API_KEY=sk-your-actual-key-here" > .env
```

### 3. Edit the .env File

Open the `.env` file and replace `your_openai_api_key_here` with your actual API key:

```bash
# Using nano
nano .env

# Or using vim
vim .env

# Or using any text editor
open -a TextEdit .env
```

The `.env` file should look like this:
```
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 4. Verify the Setup

The `.env` file should be:
- In the root directory of the project (`/Users/vinben007/Documents/Personal Apps/Aurora/`)
- Named exactly `.env` (with the dot at the beginning)
- Contain the line `OPENAI_API_KEY=sk-...` with your actual key

**Security Note**: The `.env` file is automatically excluded from Git (via `.gitignore`) to keep your API key private.

## How It Works

The application uses **Pydantic Settings** to automatically load configuration from the `.env` file:

1. When the app starts, `app/config.py` creates a `Settings` object
2. Pydantic Settings automatically reads the `.env` file
3. The `OPENAI_API_KEY` is loaded into `settings.openai_api_key`
4. All services (Whisper, GPT-4, Embeddings) use this key via `get_settings()`

### Code Reference

In `app/config.py`:
```python
class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",  # ← Loads from .env file
        env_file_encoding="utf-8",
        case_sensitive=False
    )
    
    openai_api_key: str  # ← Required field from .env
```

In service files (e.g., `app/services/transcription.py`):
```python
def __init__(self):
    settings = get_settings()  # ← Loads settings from .env
    self.client = OpenAI(api_key=settings.openai_api_key)  # ← Uses the key
```

## Troubleshooting

### Error: "Field required" or "openai_api_key validation error"

**Cause**: The `.env` file is missing or the API key is not set.

**Solution**:
```bash
# Check if .env file exists
ls -la .env

# If it doesn't exist, create it
echo "OPENAI_API_KEY=sk-your-key-here" > .env
```

### Error: "Incorrect API key provided"

**Cause**: The API key in `.env` is invalid or expired.

**Solution**:
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Update your `.env` file with the new key
4. Restart the Docker container: `docker-compose restart`

### Error: ".env file not found"

**Cause**: The `.env` file is not in the correct location.

**Solution**: Ensure the `.env` file is in the project root:
```bash
# Check current directory
pwd
# Should be: /Users/vinben007/Documents/Personal Apps/Aurora

# Create .env in the correct location
cat > .env << EOF
OPENAI_API_KEY=sk-your-actual-key-here
EOF
```

### Docker Not Reading .env File

**Cause**: Docker Compose might not be reading the `.env` file.

**Solution**:
1. Verify `.env` exists: `ls -la .env`
2. Check docker-compose.yml has `env_file: - .env`
3. Restart containers: `docker-compose down && docker-compose up --build`

## Environment Variables (Optional)

You can also set additional configuration in the `.env` file:

```bash
# Required
OPENAI_API_KEY=sk-your-key-here

# Optional (these have defaults)
WHISPER_MODEL=whisper-1
GPT_MODEL=gpt-4-turbo-preview
EMBEDDING_MODEL=text-embedding-3-small
```

## Verification

To verify your setup is correct:

```bash
# 1. Check .env file exists and has content
cat .env

# 2. Start the application
docker-compose up

# 3. Check the logs - should NOT see API key errors
docker-compose logs | grep -i "api"

# 4. Test the health endpoint
curl http://localhost:8000/
```

If everything is configured correctly, you should see:
```json
{
  "status": "healthy",
  "service": "Audio Compatibility Pipeline",
  "version": "1.0.0",
  "endpoints": ["/transcribe", "/summarise", "/match"]
}
```

## Security Best Practices

✅ **DO**:
- Keep your `.env` file private
- Never commit `.env` to Git
- Rotate your API key periodically
- Use different keys for dev/prod

❌ **DON'T**:
- Share your API key publicly
- Hardcode API keys in source code
- Commit `.env` to version control
- Use the same key across multiple projects

---

**Your `.env` file is now configured and the application will automatically use your OpenAI API key!** 🎉

