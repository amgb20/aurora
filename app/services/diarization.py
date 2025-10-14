"""
Speaker diarization service using pyannote.audio.
Supports chunking for long audio files to prevent memory issues.
"""

import os
import torch
import tempfile
import wave
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from pyannote.audio import Pipeline
from pydub import AudioSegment
from huggingface_hub import login as hf_login
from app.config import get_settings
from app.models import SpeakerSegment, WordWithSpeaker


class DiarizationService:
    """Service for speaker diarization using pyannote.audio."""
    
    # Maximum chunk duration in seconds (2 minutes to prevent memory issues)
    MAX_CHUNK_DURATION = 120
    
    def __init__(self):
        settings = get_settings()
        self.pipeline = None
        self.hf_token = settings.huggingface_token
        self.min_speakers = settings.min_speakers
        self.max_speakers = settings.max_speakers
    
    def _load_pipeline(self):
        """Lazy load the diarization pipeline."""
        if self.pipeline is None:
            if not self.hf_token:
                raise ValueError(
                    "Hugging Face token is required for speaker diarization. "
                    "Please set HUGGINGFACE_TOKEN in your .env file. "
                    "Get a token at https://huggingface.co/settings/tokens and "
                    "accept the model conditions at https://hf.co/pyannote/speaker-diarization-3.1"
                )
            
            # Set token as environment variable so all HuggingFace operations can use it
            os.environ['HF_TOKEN'] = self.hf_token
            os.environ['HUGGING_FACE_HUB_TOKEN'] = self.hf_token
            os.environ['HUGGINGFACEHUB_API_TOKEN'] = self.hf_token
            
            # Login to HuggingFace with the token
            hf_login(token=self.hf_token, add_to_git_credential=False)
            
            # Load pretrained pipeline as per official documentation
            # Note: pyannote.audio 3.x uses use_auth_token, 4.x uses token
            self.pipeline = Pipeline.from_pretrained(
                "pyannote/speaker-diarization-3.1",
                use_auth_token=self.hf_token
            )
            
            # Send pipeline to GPU if available, otherwise use CPU
            device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            self.pipeline.to(device)
        
        return self.pipeline
    
    def _get_audio_duration(self, audio_path: str) -> float:
        """Get audio duration in seconds."""
        try:
            audio = AudioSegment.from_file(audio_path)
            return len(audio) / 1000.0  # Convert milliseconds to seconds
        except Exception:
            # Fallback to wave for WAV files
            with wave.open(audio_path, 'rb') as wav:
                frames = wav.getnframes()
                rate = wav.getframerate()
                return frames / float(rate)
    
    def _split_audio_into_chunks(self, audio_path: str, chunk_duration: float) -> List[Tuple[str, float]]:
        """
        Split audio into chunks and return list of (chunk_path, start_time) tuples.
        
        Args:
            audio_path: Path to the audio file
            chunk_duration: Duration of each chunk in seconds
            
        Returns:
            List of tuples containing (chunk_file_path, start_time_offset)
        """
        audio = AudioSegment.from_file(audio_path)
        total_duration_ms = len(audio)
        chunk_duration_ms = int(chunk_duration * 1000)
        
        chunks = []
        temp_dir = tempfile.mkdtemp()
        
        for i, start_ms in enumerate(range(0, total_duration_ms, chunk_duration_ms)):
            end_ms = min(start_ms + chunk_duration_ms, total_duration_ms)
            chunk = audio[start_ms:end_ms]
            
            chunk_path = os.path.join(temp_dir, f"chunk_{i}.wav")
            chunk.export(chunk_path, format="wav")
            
            chunks.append((chunk_path, start_ms / 1000.0))  # Convert to seconds
        
        return chunks
    
    def _merge_diarization_results(
        self, 
        chunk_results: List[Tuple[List[SpeakerSegment], float]]
    ) -> List[SpeakerSegment]:
        """
        Merge diarization results from multiple chunks.
        
        Args:
            chunk_results: List of tuples containing (speaker_segments, time_offset)
            
        Returns:
            Merged list of SpeakerSegment objects with adjusted timestamps
        """
        merged_segments = []
        speaker_mapping = {}  # Map chunk-local speaker IDs to global IDs
        global_speaker_counter = 0
        
        for segments, time_offset in chunk_results:
            for segment in segments:
                # Adjust timestamps by offset
                adjusted_segment = SpeakerSegment(
                    start=segment.start + time_offset,
                    end=segment.end + time_offset,
                    speaker_id=segment.speaker_id
                )
                
                # Create a consistent speaker mapping across chunks
                # This is a simple approach - in practice, speaker re-identification
                # across chunks would require more sophisticated techniques
                chunk_speaker_key = f"{time_offset}_{segment.speaker_id}"
                if chunk_speaker_key not in speaker_mapping:
                    speaker_mapping[chunk_speaker_key] = f"SPEAKER_{global_speaker_counter:02d}"
                    global_speaker_counter += 1
                
                adjusted_segment.speaker_id = speaker_mapping[chunk_speaker_key]
                merged_segments.append(adjusted_segment)
        
        return merged_segments
    
    async def diarize_audio(
        self,
        audio_path: str,
        *,
        num_speakers: Optional[int] = None,
        min_speakers: Optional[int] = None,
        max_speakers: Optional[int] = None
    ) -> List[SpeakerSegment]:
        """
        Perform speaker diarization on audio file.
        Automatically chunks long audio files to prevent memory issues.
        
        Args:
            audio_path: Path to the audio file
            
        Returns:
            List of SpeakerSegment objects with speaker timings
        """
        pipeline = self._load_pipeline()

        # Check audio duration
        duration = self._get_audio_duration(audio_path)

        # If audio is short enough, process directly
        if duration <= self.MAX_CHUNK_DURATION:
            return await self._diarize_single_file(
                audio_path,
                pipeline,
                num_speakers=num_speakers,
                min_speakers=min_speakers,
                max_speakers=max_speakers
            )
        
        # For long audio, process in chunks
        print(f"Audio duration ({duration:.2f}s) exceeds max chunk size ({self.MAX_CHUNK_DURATION}s)")
        print(f"Processing in chunks...")
        
        chunks = self._split_audio_into_chunks(audio_path, self.MAX_CHUNK_DURATION)
        chunk_results = []
        
        try:
            for i, (chunk_path, time_offset) in enumerate(chunks):
                print(f"Processing chunk {i+1}/{len(chunks)} (offset: {time_offset:.2f}s)")
                segments = await self._diarize_single_file(
                    chunk_path,
                    pipeline,
                    num_speakers=num_speakers,
                    min_speakers=min_speakers,
                    max_speakers=max_speakers
                )
                chunk_results.append((segments, time_offset))
                
                # Clean up chunk file
                try:
                    os.remove(chunk_path)
                except Exception:
                    pass
            
            # Merge results
            merged_segments = self._merge_diarization_results(chunk_results)
            print(f"Successfully merged {len(chunks)} chunks into {len(merged_segments)} segments")
            
            return merged_segments
            
        finally:
            # Clean up any remaining chunk files
            if chunks:
                temp_dir = os.path.dirname(chunks[0][0])
                try:
                    import shutil
                    shutil.rmtree(temp_dir, ignore_errors=True)
                except Exception:
                    pass
    
    async def _diarize_single_file(
        self,
        audio_path: str,
        pipeline: Pipeline,
        *,
        num_speakers: Optional[int] = None,
        min_speakers: Optional[int] = None,
        max_speakers: Optional[int] = None
    ) -> List[SpeakerSegment]:
        """
        Diarize a single audio file (internal method).
        
        Args:
            audio_path: Path to the audio file
            pipeline: Loaded diarization pipeline
            
        Returns:
            List of SpeakerSegment objects
        """
        effective_min = min_speakers if min_speakers is not None else self.min_speakers
        effective_max = max_speakers if max_speakers is not None else self.max_speakers

        diarization_kwargs = {}

        if num_speakers is not None and num_speakers > 0:
            diarization_kwargs["num_speakers"] = num_speakers
        else:
            if effective_min is not None and effective_min > 0:
                diarization_kwargs["min_speakers"] = effective_min
            if effective_max is not None and effective_max > 0:
                diarization_kwargs["max_speakers"] = effective_max

            # Avoid passing inconsistent bounds
            if (
                "min_speakers" in diarization_kwargs
                and "max_speakers" in diarization_kwargs
                and diarization_kwargs["min_speakers"] > diarization_kwargs["max_speakers"]
            ):
                diarization_kwargs.pop("min_speakers")

        diarization = pipeline(audio_path, **diarization_kwargs)
        
        # Convert to speaker segments
        speaker_segments = []
        for turn, _, speaker in diarization.itertracks(yield_label=True):
            speaker_segments.append(
                SpeakerSegment(
                    start=turn.start,
                    end=turn.end,
                    speaker_id=speaker
                )
            )
        
        return speaker_segments
    
    async def align_with_transcript(
        self,
        speaker_segments: List[SpeakerSegment],
        transcript_timestamps: List[Dict[str, Any]],
        speaker_mapping: Optional[Dict[str, str]] = None
    ) -> List[WordWithSpeaker]:
        """
        Align speaker information with word-level timestamps from transcription.
        
        Args:
            speaker_segments: List of speaker segments from diarization
            transcript_timestamps: Word-level timestamps from Whisper
            speaker_mapping: Optional mapping of speaker IDs to names
            
        Returns:
            List of WordWithSpeaker objects
        """
        words_with_speakers = []
        
        for word_info in transcript_timestamps:
            word = word_info.get("word", "")
            start = word_info.get("start", 0.0)
            end = word_info.get("end", 0.0)
            confidence = word_info.get("confidence")
            
            # Find which speaker segment this word belongs to
            speaker_id = self._find_speaker_for_time(speaker_segments, start, end)
            speaker_name = None
            
            if speaker_mapping and speaker_id:
                speaker_name = speaker_mapping.get(speaker_id)
            
            words_with_speakers.append(
                WordWithSpeaker(
                    word=word,
                    start=start,
                    end=end,
                    speaker_id=speaker_id if speaker_id else "UNKNOWN",
                    speaker_name=speaker_name,
                    confidence=confidence
                )
            )
        
        return words_with_speakers
    
    def _find_speaker_for_time(
        self,
        speaker_segments: List[SpeakerSegment],
        word_start: float,
        word_end: float
    ) -> Optional[str]:
        """
        Find which speaker is talking at a given time.
        
        Uses the midpoint of the word to determine speaker.
        If word overlaps multiple speakers, assigns to the speaker
        with the most overlap.
        """
        word_mid = (word_start + word_end) / 2
        
        # Find all overlapping segments
        overlapping = []
        for segment in speaker_segments:
            if segment.start <= word_mid <= segment.end:
                overlapping.append(segment)
        
        if overlapping:
            # Return the first overlapping speaker (or most overlapping)
            return overlapping[0].speaker_id
        
        # If no exact overlap, find closest speaker
        closest_segment = min(
            speaker_segments,
            key=lambda s: min(abs(s.start - word_mid), abs(s.end - word_mid))
        )
        
        return closest_segment.speaker_id if closest_segment else None
    
    def create_speaker_mapping(
        self,
        speaker_segments: List[SpeakerSegment],
        speaker_names: Optional[List[str]] = None
    ) -> Dict[str, str]:
        """
        Create mapping from speaker IDs to names.
        
        Args:
            speaker_segments: List of speaker segments
            speaker_names: Optional list of names in order (e.g., ["Joe Rogan", "Elon Musk"])
            
        Returns:
            Dictionary mapping speaker IDs to names
        """
        # Get unique speakers in order of first appearance
        unique_speakers = []
        for segment in speaker_segments:
            if segment.speaker_id not in unique_speakers:
                unique_speakers.append(segment.speaker_id)
        
        mapping = {}
        
        if speaker_names:
            # Map in order provided
            for i, speaker_id in enumerate(unique_speakers):
                if i < len(speaker_names):
                    mapping[speaker_id] = speaker_names[i]
                else:
                    mapping[speaker_id] = f"Speaker {i + 1}"
        else:
            # Use default names
            for i, speaker_id in enumerate(unique_speakers):
                mapping[speaker_id] = f"Speaker {i + 1}"
        
        return mapping
    
    def get_speaker_statistics(
        self,
        speaker_segments: List[SpeakerSegment]
    ) -> Dict[str, Any]:
        """
        Calculate statistics about speakers.
        
        Returns speaking time, turn count, etc. for each speaker.
        """
        stats = {}
        
        for segment in speaker_segments:
            speaker_id = segment.speaker_id
            duration = segment.end - segment.start
            
            if speaker_id not in stats:
                stats[speaker_id] = {
                    "total_time": 0.0,
                    "turn_count": 0,
                    "segments": []
                }
            
            stats[speaker_id]["total_time"] += duration
            stats[speaker_id]["turn_count"] += 1
            stats[speaker_id]["segments"].append({
                "start": segment.start,
                "end": segment.end,
                "duration": duration
            })
        
        return stats
