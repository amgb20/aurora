"""
Transcription service using OpenAI Whisper API with chunking support for large files.
"""

import os
import tempfile
from typing import Dict, Any, List, Optional
from openai import OpenAI
from pydub import AudioSegment
from app.config import get_settings
from app.services.diarization import DiarizationService
from app.models import SpeakerSegment, WordWithSpeaker


class TranscriptionService:
    """Service for audio transcription using OpenAI Whisper with automatic size-based chunking."""
    
    # Maximum file size for Whisper API (use 24MB to be safe, actual limit is 25MB)
    MAX_CHUNK_SIZE = 24 * 1024 * 1024  # 24MB
    
    def __init__(self):
        settings = get_settings()
        self.client = OpenAI(api_key=settings.openai_api_key)
        self.model = settings.whisper_model
        self.diarization_service = DiarizationService()
    
    async def transcribe_audio(self, audio_file_path: str) -> Dict[str, Any]:
        """
        Transcribe audio file using OpenAI Whisper API.
        Automatically chunks large files to stay within API limits.
        
        Args:
            audio_file_path: Path to the audio file
            
        Returns:
            Dictionary containing transcript and optional timestamps
        """
        file_size = os.path.getsize(audio_file_path)
        
        # If file is small enough, process directly
        if file_size <= self.MAX_CHUNK_SIZE:
            return await self._transcribe_single(audio_file_path)
        
        # Otherwise, split into chunks and process
        return await self._transcribe_with_chunks(audio_file_path)
    
    async def _transcribe_single(self, audio_file_path: str) -> Dict[str, Any]:
        """Transcribe a single audio file."""
        with open(audio_file_path, "rb") as audio_file:
            # Get the file extension to help OpenAI detect the format
            file_ext = os.path.splitext(audio_file_path)[1]
            filename = f"audio{file_ext}" if file_ext else "audio.wav"
            
            # Transcribe with timestamps using verbose_json format
            # Pass filename tuple to ensure OpenAI can detect the file format
            transcript_response = self.client.audio.transcriptions.create(
                model=self.model,
                file=(filename, audio_file),
                response_format="verbose_json",
                timestamp_granularities=["word"]
            )
        
        # Extract transcript text
        transcript_text = transcript_response.text
        
        # Extract word-level timestamps if available
        timestamps = []
        if hasattr(transcript_response, 'words') and transcript_response.words:
            timestamps = []
            for word in transcript_response.words:
                entry = {
                    "word": word.word,
                    "start": word.start,
                    "end": word.end
                }

                # Include confidence when provided by Whisper (not all models return it)
                if hasattr(word, "confidence") and word.confidence is not None:
                    entry["confidence"] = word.confidence

                timestamps.append(entry)
        
        return {
            "transcript": transcript_text,
            "timestamps": timestamps if timestamps else None,
            "duration": getattr(transcript_response, 'duration', None)
        }
    
    async def _transcribe_with_chunks(self, audio_file_path: str) -> Dict[str, Any]:
        """
        Transcribe large audio files by splitting into chunks based on file size.
        
        Args:
            audio_file_path: Path to the large audio file
            
        Returns:
            Combined transcription results
        """
        # Load audio file
        audio = AudioSegment.from_file(audio_file_path)
        total_duration_ms = len(audio)
        
        # Get file size and calculate number of chunks needed
        file_size = os.path.getsize(audio_file_path)
        num_chunks = (file_size + self.MAX_CHUNK_SIZE - 1) // self.MAX_CHUNK_SIZE
        
        # Calculate duration per chunk to divide audio equally
        chunk_duration_ms = total_duration_ms // num_chunks
        
        all_transcripts = []
        all_timestamps = []
        total_duration = 0.0
        
        # Process each chunk
        for i in range(num_chunks):
            chunk_start = i * chunk_duration_ms
            chunk_end = min((i + 1) * chunk_duration_ms, total_duration_ms)
            
            # Extract chunk
            chunk = audio[chunk_start:chunk_end]
            
            # Determine output format - preserve original if possible, otherwise use MP3
            file_ext = os.path.splitext(audio_file_path)[1].lower()
            export_format = "mp3"  # Default to MP3 for compression
            export_params = {"bitrate": "128k"}
            
            # If original is already compressed, use that format
            if file_ext in ['.mp3', '.m4a', '.ogg']:
                export_format = file_ext[1:]  # Remove the dot
            
            # Save chunk to temporary file
            with tempfile.NamedTemporaryFile(suffix=f".{export_format}", delete=False) as tmp_chunk:
                chunk.export(tmp_chunk.name, format=export_format, **export_params)
                chunk_path = tmp_chunk.name
            
            try:
                # Verify chunk size
                chunk_size = os.path.getsize(chunk_path)
                if chunk_size > self.MAX_CHUNK_SIZE:
                    raise ValueError(
                        f"Chunk {i+1}/{num_chunks} is {chunk_size} bytes, exceeds limit of {self.MAX_CHUNK_SIZE} bytes. "
                        f"Original file: {file_size} bytes."
                    )
                
                # Transcribe chunk
                result = await self._transcribe_single(chunk_path)
                
                # Add transcript
                all_transcripts.append(result["transcript"])
                
                # Adjust and add timestamps
                if result.get("timestamps"):
                    time_offset = chunk_start / 1000.0  # Convert ms to seconds
                    for ts in result["timestamps"]:
                        all_timestamps.append({
                            "word": ts["word"],
                            "start": ts["start"] + time_offset,
                            "end": ts["end"] + time_offset
                        })
                
                # Track total duration
                if result.get("duration"):
                    total_duration += result["duration"]
                    
            finally:
                # Clean up temporary chunk file
                if os.path.exists(chunk_path):
                    os.unlink(chunk_path)
        
        # Combine results
        combined_transcript = " ".join(all_transcripts)
        
        return {
            "transcript": combined_transcript,
            "timestamps": all_timestamps if all_timestamps else None,
            "duration": total_duration if total_duration > 0 else None,
            "chunks_processed": num_chunks
        }
    
    async def transcribe_with_speakers(
        self,
        audio_file_path: str,
        speaker_names: Optional[List[str]] = None,
        *,
        num_speakers: Optional[int] = None,
        min_speakers: Optional[int] = None,
        max_speakers: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Transcribe audio with speaker diarization.
        
        Args:
            audio_file_path: Path to the audio file
            speaker_names: Optional list of speaker names (e.g., ["Joe Rogan", "Elon Musk"])
            
        Returns:
            Dictionary with transcript, speaker segments, and word-speaker alignment
        """
        # Step 1: Run transcription with timestamps
        transcription_result = await self.transcribe_audio(audio_file_path)
        
        transcript = transcription_result.get("transcript", "")
        timestamps = transcription_result.get("timestamps", [])
        duration = transcription_result.get("duration")
        chunks_processed = transcription_result.get("chunks_processed")
        
        # Step 2: Run speaker diarization
        speaker_segments = await self.diarization_service.diarize_audio(
            audio_file_path,
            num_speakers=num_speakers,
            min_speakers=min_speakers,
            max_speakers=max_speakers
        )
        
        # Step 3: Create speaker mapping
        speaker_mapping = self.diarization_service.create_speaker_mapping(
            speaker_segments,
            speaker_names
        )
        
        # Step 4: Align words with speakers
        words_with_speakers = await self.diarization_service.align_with_transcript(
            speaker_segments,
            timestamps,
            speaker_mapping
        )
        
        # Step 5: Apply speaker names to segments
        for segment in speaker_segments:
            segment.speaker_name = speaker_mapping.get(segment.speaker_id)
        
        # Step 6: Get speaker statistics
        speaker_stats = self.diarization_service.get_speaker_statistics(speaker_segments)
        
        # Count unique speakers
        unique_speakers = len(set(seg.speaker_id for seg in speaker_segments))
        
        return {
            "transcript": transcript,
            "speaker_segments": speaker_segments,
            "words_with_speakers": words_with_speakers,
            "speakers_detected": unique_speakers,
            "speaker_mapping": speaker_mapping,
            "speaker_statistics": speaker_stats,
            "duration": duration,
            "chunks_processed": chunks_processed
        }
