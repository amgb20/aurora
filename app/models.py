"""
Pydantic models for request and response schemas.
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any


class TranscriptTimestamp(BaseModel):
    """Single word timestamp."""
    word: str
    start: float
    end: float


class TranscribeResponse(BaseModel):
    """Response model for transcription endpoint."""
    transcript: str
    timestamps: Optional[List[Dict[str, Any]]] = None
    duration: Optional[float] = None
    chunks_processed: Optional[int] = None  # Number of chunks if file was split


class Topic(BaseModel):
    """Single topic with description."""
    topic: str
    description: str
    relevance_score: Optional[float] = None


class ConversationalCues(BaseModel):
    """Optional conversational analysis."""
    enthusiasm_level: Optional[str] = None
    agreement_level: Optional[str] = None
    interruptions: Optional[int] = None
    speaking_time_ratio: Optional[Dict[str, float]] = None


class SummariseResponse(BaseModel):
    """Response model for summarization endpoint."""
    topics: List[Topic]
    conversational_cues: Optional[ConversationalCues] = None


class UserVector(BaseModel):
    """Combined vector for a user."""
    user_id: str
    topic_vector: List[float]
    personality_traits: List[float]
    combined_vector: List[float]


class MatchResponse(BaseModel):
    """Response model for compatibility matching endpoint."""
    compatibility_score: float
    interpretation: str
    user_vectors: Dict[str, UserVector]
    details: Optional[Dict[str, Any]] = None


class UserProfile(BaseModel):
    """User psychometric profile."""
    id: str
    name: Optional[str] = None
    psychometrics: List[float] = Field(
        ..., 
        description="[openness, conscientiousness, extraversion, agreeableness, neuroticism]"
    )


# Speaker Diarization Models

class SpeakerSegment(BaseModel):
    """Speaker segment with time boundaries."""
    start: float
    end: float
    speaker_id: str  # e.g., "SPEAKER_0", "SPEAKER_1"
    speaker_name: Optional[str] = None  # e.g., "Joe Rogan", "Elon Musk"


class WordWithSpeaker(BaseModel):
    """Word with speaker attribution."""
    word: str
    start: float
    end: float
    speaker_id: str
    speaker_name: Optional[str] = None
    confidence: Optional[float] = None


class DiarizedTranscriptResponse(BaseModel):
    """Response model for diarized transcription endpoint."""
    transcript: str  # Full text
    speaker_segments: List[SpeakerSegment]
    words_with_speakers: List[WordWithSpeaker]
    speakers_detected: int
    speaker_mapping: Optional[Dict[str, str]] = None  # SPEAKER_0 -> Joe Rogan
    speaker_statistics: Optional[Dict[str, Any]] = None
    output_json: Optional[str] = None
    duration: Optional[float] = None
    chunks_processed: Optional[int] = None
