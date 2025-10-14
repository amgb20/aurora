"""
Configuration module for the Audio Compatibility Pipeline.
Handles environment variables and application settings.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Pydantic v2 configuration
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    openai_api_key: str
    
    # Hugging Face token for pyannote models (optional)
    huggingface_token: Optional[str] = None
    
    # OpenAI model configurations
    whisper_model: str = "whisper-1"
    gpt_model: str = "gpt-4-turbo-preview"
    embedding_model: str = "text-embedding-3-small"
    
    # Application settings
    app_name: str = "Audio Compatibility Pipeline"
    app_version: str = "1.0.0"
    
    # File upload limits
    # Now supports large files via automatic chunking
    max_upload_size: int = 200 * 1024 * 1024  # 200MB (with chunking support)
    
    # Speaker diarization settings
    enable_diarization: bool = True
    min_speakers: int = 1
    max_speakers: int = 2  # For Joe Rogan/Elon Musk case


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance that loads from .env file."""
    return Settings()

