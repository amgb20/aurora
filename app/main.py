"""
FastAPI application for Audio Compatibility Pipeline.
"""

import os
import json
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.models import (
    TranscribeResponse, 
    SummariseResponse, 
    MatchResponse,
    UserProfile,
    UserVector,
    DiarizedTranscriptResponse,
    SpeakerSegment,
    WordWithSpeaker
)
from app.services.transcription import TranscriptionService
from app.services.topic_extraction import TopicExtractionService
from app.services.vectorization import VectorizationService
from app.services.fusion import FusionService
from app.services.matching import MatchingService
from app.services.formatters import (
    format_diarized_transcript_txt,
    format_diarized_transcript_srt,
    format_speaker_summary
)


# Initialize FastAPI app
settings = get_settings()
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Audio analysis pipeline with personality-based compatibility matching"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174", 
        "http://localhost:5175",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
transcription_service = TranscriptionService()
topic_service = TopicExtractionService()
vectorization_service = VectorizationService()
fusion_service = FusionService()
matching_service = MatchingService()


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": settings.app_version,
        "endpoints": ["/transcribe", "/summarise", "/match", "/transcribe_with_speakers"]
    }


@app.post("/transcribe", response_model=TranscribeResponse)
async def transcribe_audio(
    audio: UploadFile = File(..., description="Audio file to transcribe")
):
    """
    Transcribe an audio file using OpenAI Whisper.
    
    Args:
        audio: Audio file (WAV, MP3, etc.)
        
    Returns:
        TranscribeResponse with transcript and timestamps
    """
    # Validate file size
    content = await audio.read()
    if len(content) > settings.max_upload_size:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {settings.max_upload_size / (1024*1024)}MB"
        )
    
    # Save uploaded file to temporary location
    with tempfile.NamedTemporaryFile(delete=False, suffix=Path(audio.filename).suffix) as tmp_file:
        tmp_file.write(content)
        tmp_file_path = tmp_file.name
    
    try:
        # Transcribe audio
        result = await transcription_service.transcribe_audio(tmp_file_path)
        
        return TranscribeResponse(
            transcript=result["transcript"],
            timestamps=result.get("timestamps"),
            duration=result.get("duration"),
            chunks_processed=result.get("chunks_processed")
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    
    finally:
        # Clean up temporary file
        if os.path.exists(tmp_file_path):
            os.unlink(tmp_file_path)


@app.post("/summarise", response_model=SummariseResponse)
async def summarise_content(
    audio: Optional[UploadFile] = File(None, description="Audio file to analyze"),
    transcript: Optional[str] = Form(None, description="Pre-existing transcript text"),
    extract_cues: bool = Form(True, description="Extract conversational cues")
):
    """
    Extract top 5 topics from audio or transcript.
    
    Args:
        audio: Audio file (optional if transcript provided)
        transcript: Pre-existing transcript (optional if audio provided)
        extract_cues: Whether to extract conversational cues
        
    Returns:
        SummariseResponse with topics and optional conversational cues
    """
    transcript_text = transcript
    
    # If audio is provided, transcribe it first
    if audio and not transcript_text:
        content = await audio.read()
        if len(content) > settings.max_upload_size:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum size is {settings.max_upload_size / (1024*1024)}MB"
            )
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(audio.filename).suffix) as tmp_file:
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        try:
            result = await transcription_service.transcribe_audio(tmp_file_path)
            transcript_text = result["transcript"]
        finally:
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)
    
    if not transcript_text:
        raise HTTPException(
            status_code=400,
            detail="Either audio file or transcript text must be provided"
        )
    
    try:
        # Extract topics
        result = await topic_service.extract_topics(transcript_text, extract_cues)
        
        return SummariseResponse(
            topics=result["topics"],
            conversational_cues=result.get("conversational_cues")
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Topic extraction failed: {str(e)}")


@app.post("/match", response_model=MatchResponse)
async def match_compatibility(
    audio: UploadFile = File(..., description="Audio file with conversation between two speakers")
):
    """
    Compute compatibility score between two speakers.
    
    This endpoint performs the full pipeline:
    1. Transcribe audio
    2. Extract topics
    3. Vectorize topics
    4. Load user profiles
    5. Fuse topics with personality traits
    6. Compute compatibility score
    
    Args:
        audio: Audio file with conversation
        
    Returns:
        MatchResponse with compatibility score and interpretation
    """
    # Validate file size
    content = await audio.read()
    if len(content) > settings.max_upload_size:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {settings.max_upload_size / (1024*1024)}MB"
        )
    
    # Save uploaded file to temporary location
    with tempfile.NamedTemporaryFile(delete=False, suffix=Path(audio.filename).suffix) as tmp_file:
        tmp_file.write(content)
        tmp_file_path = tmp_file.name
    
    try:
        # Step 1: Transcribe audio
        transcription_result = await transcription_service.transcribe_audio(tmp_file_path)
        transcript_text = transcription_result["transcript"]
        
        # Step 2: Extract topics with conversational cues
        topic_result = await topic_service.extract_topics(transcript_text, extract_cues=True)
        topics = topic_result["topics"]
        conversational_cues = topic_result.get("conversational_cues")
        
        # Step 3: Vectorize topics
        topic_vector = await vectorization_service.embed_topics(topics)
        
        # Step 4: Load user profiles
        profiles_path = Path(__file__).parent.parent / "sample_data" / "user_profiles.json"
        with open(profiles_path, "r") as f:
            profiles_data = json.load(f)
        
        user_profiles = [UserProfile(**profile) for profile in profiles_data]
        
        if len(user_profiles) < 2:
            raise HTTPException(
                status_code=400,
                detail="At least 2 user profiles are required"
            )
        
        # Extract speaking time ratios if available
        speaking_ratios = {}
        if conversational_cues and conversational_cues.speaking_time_ratio:
            speaking_ratios = conversational_cues.speaking_time_ratio
        else:
            # Default to equal speaking time
            speaking_ratios = {"speaker_1": 0.5, "speaker_2": 0.5}
        
        # Step 5: Fuse topics with personality for each user
        user_vectors = {}
        
        for i, profile in enumerate(user_profiles[:2], 1):
            speaker_key = f"speaker_{i}"
            engagement = fusion_service.calculate_engagement_from_speaking_time(
                speaking_ratios.get(speaker_key, 0.5)
            )
            
            combined_vector = fusion_service.fuse_topic_personality(
                topic_vector.copy(),
                profile.psychometrics,
                engagement
            )
            
            user_vectors[profile.id] = UserVector(
                user_id=profile.id,
                topic_vector=topic_vector.tolist(),
                personality_traits=profile.psychometrics,
                combined_vector=combined_vector.tolist()
            )
        
        # Step 6: Compute compatibility score
        user_ids = list(user_vectors.keys())
        vector1 = user_vectors[user_ids[0]].combined_vector
        vector2 = user_vectors[user_ids[1]].combined_vector
        
        import numpy as np
        compatibility_score, interpretation = matching_service.compute_compatibility(
            np.array(vector1),
            np.array(vector2)
        )
        
        # Get detailed analysis
        details = matching_service.get_detailed_analysis(
            np.array(vector1),
            np.array(vector2)
        )
        
        return MatchResponse(
            compatibility_score=compatibility_score,
            interpretation=interpretation,
            user_vectors=user_vectors,
            details=details
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Matching failed: {str(e)}")
    
    finally:
        # Clean up temporary file
        if os.path.exists(tmp_file_path):
            os.unlink(tmp_file_path)


@app.post("/transcribe_with_speakers", response_model=DiarizedTranscriptResponse)
async def transcribe_with_speaker_diarization(
    audio: UploadFile = File(..., description="Audio file with multi-speaker conversation"),
    speaker_names: Optional[str] = Form(None, description="Comma-separated speaker names (e.g., 'Joe Rogan,Elon Musk')"),
    num_speakers: Optional[int] = Form(None, description="Exact number of speakers when known"),
    min_speakers: Optional[int] = Form(None, description="Minimum expected number of speakers"),
    max_speakers: Optional[int] = Form(None, description="Maximum expected number of speakers")
):
    """
    Transcribe audio with speaker diarization to identify and label individual speakers.
    
    This endpoint:
    1. Transcribes audio using Whisper with word-level timestamps
    2. Performs speaker diarization using pyannote.audio
    3. Aligns words with speakers
    4. Returns speaker-attributed transcript
    
    Args:
        audio: Audio file with conversation
        speaker_names: Optional comma-separated list of speaker names to map to detected speakers
        
    Returns:
        DiarizedTranscriptResponse with speaker-attributed transcript
        
    Note: Requires HUGGINGFACE_TOKEN in environment to access pyannote models
    """
    # Validate file size
    content = await audio.read()
    if len(content) > settings.max_upload_size:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {settings.max_upload_size / (1024*1024)}MB"
        )
    
    # Save uploaded file to temporary location
    with tempfile.NamedTemporaryFile(delete=False, suffix=Path(audio.filename).suffix) as tmp_file:
        tmp_file.write(content)
        tmp_file_path = tmp_file.name
    
    try:
        # Parse speaker names if provided
        speaker_name_list = None
        if speaker_names:
            speaker_name_list = [name.strip() for name in speaker_names.split(',')]
        
        # Validate speaker bounds if provided
        if num_speakers is not None and num_speakers <= 0:
            raise HTTPException(status_code=400, detail="num_speakers must be greater than zero")

        if min_speakers is not None and min_speakers <= 0:
            raise HTTPException(status_code=400, detail="min_speakers must be greater than zero")

        if max_speakers is not None and max_speakers <= 0:
            raise HTTPException(status_code=400, detail="max_speakers must be greater than zero")

        if (
            min_speakers is not None
            and max_speakers is not None
            and min_speakers > max_speakers
        ):
            raise HTTPException(status_code=400, detail="min_speakers cannot be greater than max_speakers")

        # Run transcription with speaker diarization
        result = await transcription_service.transcribe_with_speakers(
            tmp_file_path,
            speaker_names=speaker_name_list,
            num_speakers=num_speakers,
            min_speakers=min_speakers,
            max_speakers=max_speakers
        )

        # Persist readable JSON output for easier review
        output_payload = jsonable_encoder({
            "transcript": result["transcript"],
            "speaker_segments": result["speaker_segments"],
            "words_with_speakers": result["words_with_speakers"],
            "speaker_mapping": result.get("speaker_mapping"),
            "speaker_statistics": result.get("speaker_statistics"),
            "speakers_detected": result.get("speakers_detected"),
            "duration": result.get("duration"),
            "chunks_processed": result.get("chunks_processed"),
        })

        output_dir = Path("outputs/diarized_transcripts")
        output_dir.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
        sanitized_name = Path(audio.filename).stem.replace(" ", "_") if audio.filename else "audio"
        output_path = output_dir / f"{sanitized_name}_{timestamp}.json"

        with output_path.open("w", encoding="utf-8") as fp:
            json.dump(output_payload, fp, indent=2)

        return DiarizedTranscriptResponse(
            transcript=result["transcript"],
            speaker_segments=result["speaker_segments"],
            words_with_speakers=result["words_with_speakers"],
            speakers_detected=result["speakers_detected"],
            speaker_mapping=result.get("speaker_mapping"),
            speaker_statistics=result.get("speaker_statistics"),
            output_json=str(output_path),
            duration=result.get("duration"),
            chunks_processed=result.get("chunks_processed")
        )
    
    except ValueError as e:
        # Handle missing HuggingFace token
        raise HTTPException(status_code=400, detail=str(e))
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speaker diarization failed: {str(e)}")
    
    finally:
        # Clean up temporary file
        if os.path.exists(tmp_file_path):
            os.unlink(tmp_file_path)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
