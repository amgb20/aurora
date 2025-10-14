"""
Output formatters for diarized transcripts.
"""

from typing import List
from datetime import timedelta
from app.models import SpeakerSegment, WordWithSpeaker


def format_time(seconds: float) -> str:
    """Format seconds as HH:MM:SS."""
    td = timedelta(seconds=seconds)
    total_seconds = int(td.total_seconds())
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    secs = total_seconds % 60
    return f"{hours:02d}:{minutes:02d}:{secs:02d}"


def format_diarized_transcript_txt(
    speaker_segments: List[SpeakerSegment],
    words_with_speakers: List[WordWithSpeaker]
) -> str:
    """
    Format diarized transcript as readable text with speaker labels and timestamps.
    
    Returns text in format:
    [00:00:00 - 00:00:05] Joe Rogan: Welcome to the show...
    """
    lines = []
    
    # Group words by speaker segments
    for segment in speaker_segments:
        # Get words in this segment
        segment_words = [
            w for w in words_with_speakers
            if w.start >= segment.start and w.end <= segment.end
        ]
        
        if segment_words:
            # Build the text for this segment
            text = " ".join(w.word for w in segment_words)
            
            # Format speaker name
            speaker = segment.speaker_name if segment.speaker_name else segment.speaker_id
            
            # Format timestamps
            time_range = f"[{format_time(segment.start)} - {format_time(segment.end)}]"
            
            # Combine
            lines.append(f"{time_range} {speaker}: {text}\n")
    
    return "\n".join(lines)


def format_diarized_transcript_srt(
    speaker_segments: List[SpeakerSegment],
    words_with_speakers: List[WordWithSpeaker]
) -> str:
    """
    Format diarized transcript as SRT subtitle format.
    
    Returns SRT format:
    1
    00:00:00,000 --> 00:00:05,200
    [Joe Rogan] Welcome to the show...
    """
    lines = []
    counter = 1
    
    for segment in speaker_segments:
        # Get words in this segment
        segment_words = [
            w for w in words_with_speakers
            if w.start >= segment.start and w.end <= segment.end
        ]
        
        if segment_words:
            # Build the text for this segment
            text = " ".join(w.word for w in segment_words)
            
            # Format speaker name
            speaker = segment.speaker_name if segment.speaker_name else segment.speaker_id
            
            # Format SRT timestamps (HH:MM:SS,mmm)
            start_ms = int((segment.start % 1) * 1000)
            end_ms = int((segment.end % 1) * 1000)
            start_time = f"{format_time(int(segment.start))},{start_ms:03d}"
            end_time = f"{format_time(int(segment.end))},{end_ms:03d}"
            
            # SRT format
            lines.append(f"{counter}")
            lines.append(f"{start_time} --> {end_time}")
            lines.append(f"[{speaker}] {text}")
            lines.append("")  # Empty line between segments
            
            counter += 1
    
    return "\n".join(lines)


def format_speaker_summary(
    speaker_mapping: dict,
    speaker_statistics: dict
) -> str:
    """
    Format a summary of speaker statistics.
    
    Returns a formatted summary of speaking time and turn-taking.
    """
    lines = ["=== Speaker Summary ===\n"]
    
    total_time = sum(stats["total_time"] for stats in speaker_statistics.values())
    
    for speaker_id, stats in speaker_statistics.items():
        speaker_name = speaker_mapping.get(speaker_id, speaker_id)
        speaking_time = stats["total_time"]
        percentage = (speaking_time / total_time * 100) if total_time > 0 else 0
        turn_count = stats["turn_count"]
        
        lines.append(f"{speaker_name}:")
        lines.append(f"  Total speaking time: {format_time(speaking_time)} ({percentage:.1f}%)")
        lines.append(f"  Number of turns: {turn_count}")
        lines.append(f"  Average turn length: {format_time(speaking_time / turn_count) if turn_count > 0 else '0:00:00'}")
        lines.append("")
    
    return "\n".join(lines)

