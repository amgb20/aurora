"""
Fusion service for combining topic vectors with personality traits.
"""

import numpy as np
from typing import List, Tuple
from app.models import UserProfile


class FusionService:
    """Service for fusing topic embeddings with personality traits."""
    
    # Personality trait names for reference
    TRAIT_NAMES = [
        "openness",
        "conscientiousness", 
        "extraversion",
        "agreeableness",
        "neuroticism"
    ]
    
    def __init__(self):
        pass
    
    def fuse_topic_personality(
        self,
        topic_vector: np.ndarray,
        personality_traits: List[float],
        speaker_engagement: float = 1.0
    ) -> np.ndarray:
        """
        Fuse topic embeddings with personality traits.
        
        Args:
            topic_vector: The averaged topic embedding vector
            personality_traits: [openness, conscientiousness, extraversion, agreeableness, neuroticism]
            speaker_engagement: Engagement score for the speaker (0.0 to 1.0)
            
        Returns:
            Combined vector [weighted_topic_embedding, personality_traits]
        """
        # Apply personality-based weighting to topic vector
        weighted_topic_vector = self._apply_personality_weighting(
            topic_vector, 
            personality_traits,
            speaker_engagement
        )
        
        # Normalize the weighted topic vector
        norm = np.linalg.norm(weighted_topic_vector)
        if norm > 0:
            weighted_topic_vector = weighted_topic_vector / norm
        
        # Combine weighted topic vector with personality traits
        # This creates a hybrid vector that represents both what was discussed
        # and the personality characteristics of the speaker
        personality_array = np.array(personality_traits, dtype=np.float32)
        combined_vector = np.concatenate([weighted_topic_vector, personality_array])
        
        return combined_vector
    
    def _apply_personality_weighting(
        self,
        topic_vector: np.ndarray,
        personality_traits: List[float],
        engagement: float
    ) -> np.ndarray:
        """
        Apply personality-based modulation to topic vector.
        
        The weighting logic:
        - High openness (> 0.6): Amplify by 1.2x (more receptive to diverse topics)
        - High conscientiousness (> 0.6): Amplify by 1.15x (focused discussion)
        - High extraversion (> 0.6): Amplify by 1.1x (active participation)
        - High agreeableness (> 0.6): Slight boost 1.05x (collaborative discussion)
        - High neuroticism (> 0.6): Reduce by 0.9x (variable engagement)
        """
        openness, conscientiousness, extraversion, agreeableness, neuroticism = personality_traits
        
        # Base weight is speaker engagement
        weight = engagement
        
        # Modulate based on personality traits
        if openness > 0.6:
            weight *= 1.2
        if conscientiousness > 0.6:
            weight *= 1.15
        if extraversion > 0.6:
            weight *= 1.1
        if agreeableness > 0.6:
            weight *= 1.05
        if neuroticism > 0.6:
            weight *= 0.9
        
        # Apply weight to topic vector
        weighted_vector = topic_vector * weight
        
        return weighted_vector
    
    def calculate_engagement_from_speaking_time(
        self,
        speaking_time_ratio: float
    ) -> float:
        """
        Convert speaking time ratio to engagement score.
        
        Args:
            speaking_time_ratio: Ratio of speaking time (0.0 to 1.0)
            
        Returns:
            Engagement score (0.0 to 1.0)
        """
        # Simple linear mapping - more speaking time = higher engagement
        # But cap it to prevent extreme weighting
        return min(speaking_time_ratio * 1.5, 1.0)

