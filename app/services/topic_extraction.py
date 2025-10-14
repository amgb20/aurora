"""
Topic extraction service using OpenAI GPT-4.
"""

import json
from typing import List, Dict, Any, Optional
from openai import OpenAI
from app.config import get_settings
from app.models import Topic, ConversationalCues


class TopicExtractionService:
    """Service for extracting topics from transcripts using GPT-4."""
    
    def __init__(self):
        settings = get_settings()
        self.client = OpenAI(api_key=settings.openai_api_key)
        self.model = settings.gpt_model
    
    async def extract_topics(
        self, 
        transcript: str,
        extract_cues: bool = True
    ) -> Dict[str, Any]:
        """
        Extract top 5 topics and optional conversational cues from transcript.
        
        Args:
            transcript: The transcript text
            extract_cues: Whether to extract conversational cues
            
        Returns:
            Dictionary containing topics and optional conversational cues
        """
        # Construct prompt for topic extraction
        prompt = self._build_extraction_prompt(transcript, extract_cues)
        
        # Call GPT-4
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert at analyzing conversations and extracting key discussion topics and conversational dynamics."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.3
        )
        
        # Parse response
        result = json.loads(response.choices[0].message.content)
        
        # Convert to Pydantic models
        topics = [Topic(**topic) for topic in result.get("topics", [])]
        
        conversational_cues = None
        if extract_cues and "conversational_cues" in result:
            cues_data = result["conversational_cues"]
            conversational_cues = ConversationalCues(**cues_data)
        
        return {
            "topics": topics,
            "conversational_cues": conversational_cues
        }
    
    def _build_extraction_prompt(self, transcript: str, extract_cues: bool) -> str:
        """Build the extraction prompt for GPT-4."""
        base_prompt = f"""Analyze the following conversation transcript and extract the top 5 discussion topics.

For each topic, provide:
- topic: A concise topic name (3-5 words)
- description: A brief description of what was discussed about this topic (1-2 sentences)
- relevance_score: A score from 0.0 to 1.0 indicating how prominent this topic was in the conversation

Transcript:
{transcript}

"""
        
        if extract_cues:
            base_prompt += """Additionally, analyze the conversational dynamics and provide:
- enthusiasm_level: Overall enthusiasm in the conversation (low, moderate, high)
- agreement_level: Overall agreement between speakers (conflicting, neutral, agreeing)
- interruptions: Approximate number of interruptions or overlaps
- speaking_time_ratio: Approximate ratio of speaking time per speaker as percentages (e.g., {"speaker_1": 0.6, "speaker_2": 0.4})

Return your response as a JSON object with the following structure:
{
    "topics": [
        {
            "topic": "topic name",
            "description": "description",
            "relevance_score": 0.0-1.0
        }
    ],
    "conversational_cues": {
        "enthusiasm_level": "low|moderate|high",
        "agreement_level": "conflicting|neutral|agreeing",
        "interruptions": 0,
        "speaking_time_ratio": {"speaker_1": 0.0, "speaker_2": 0.0}
    }
}
"""
        else:
            base_prompt += """Return your response as a JSON object with the following structure:
{
    "topics": [
        {
            "topic": "topic name",
            "description": "description",
            "relevance_score": 0.0-1.0
        }
    ]
}
"""
        
        return base_prompt

