"""
Matching service for computing compatibility scores.
"""

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from typing import Dict, Tuple


class MatchingService:
    """Service for computing compatibility scores between users."""
    
    def __init__(self):
        pass
    
    def compute_compatibility(
        self,
        vector1: np.ndarray,
        vector2: np.ndarray
    ) -> Tuple[float, str]:
        """
        Compute compatibility score using cosine similarity.
        
        Args:
            vector1: Combined vector for user 1
            vector2: Combined vector for user 2
            
        Returns:
            Tuple of (compatibility_score, interpretation)
        """
        # Reshape vectors for sklearn
        v1 = vector1.reshape(1, -1)
        v2 = vector2.reshape(1, -1)
        
        # Compute cosine similarity
        similarity = cosine_similarity(v1, v2)[0][0]
        
        # Ensure score is between 0 and 1
        # Cosine similarity returns -1 to 1, so we normalize it
        compatibility_score = float((similarity + 1) / 2)
        
        # Generate interpretation
        interpretation = self._interpret_score(compatibility_score)
        
        return compatibility_score, interpretation
    
    def _interpret_score(self, score: float) -> str:
        """
        Interpret the compatibility score.
        
        Args:
            score: Compatibility score (0.0 to 1.0)
            
        Returns:
            Human-readable interpretation
        """
        if score >= 0.9:
            return (
                "Exceptional compatibility: The speakers demonstrate remarkable alignment "
                "in both discussion topics and personality traits. They likely share similar "
                "worldviews and communication styles, leading to highly engaging and productive "
                "conversations."
            )
        elif score >= 0.7:
            return (
                "High compatibility: The speakers show strong alignment in their interests "
                "and personality characteristics. They are likely to have meaningful and "
                "engaging conversations with mutual understanding, though some differences "
                "may add interesting perspectives."
            )
        elif score >= 0.5:
            return (
                "Moderate compatibility: The speakers have some common ground in topics "
                "and personality traits, but also notable differences. Conversations may "
                "be interesting due to diverse perspectives, though they might need to work "
                "to find common understanding."
            )
        elif score >= 0.3:
            return (
                "Low compatibility: The speakers show limited alignment in discussion topics "
                "and personality traits. While conversations are possible, they may require "
                "more effort to find common ground and mutual understanding. Differences in "
                "communication styles may present challenges."
            )
        else:
            return (
                "Minimal compatibility: The speakers demonstrate significant differences in "
                "their interests, discussion topics, and personality characteristics. "
                "Productive conversations may be challenging and require substantial effort "
                "to bridge the gap in perspectives and communication styles."
            )
    
    def get_detailed_analysis(
        self,
        vector1: np.ndarray,
        vector2: np.ndarray,
        trait_names: list = None
    ) -> Dict[str, any]:
        """
        Provide detailed analysis of compatibility components.
        
        Args:
            vector1: Combined vector for user 1
            vector2: Combined vector for user 2
            trait_names: Optional list of trait names
            
        Returns:
            Dictionary with detailed analysis
        """
        if trait_names is None:
            trait_names = ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"]
        
        # Assuming last 5 elements are personality traits
        personality1 = vector1[-5:]
        personality2 = vector2[-5:]
        
        # Topic vectors are everything except last 5
        topic1 = vector1[:-5]
        topic2 = vector2[:-5]
        
        # Calculate topic similarity
        topic_sim = cosine_similarity(topic1.reshape(1, -1), topic2.reshape(1, -1))[0][0]
        
        # Calculate personality similarity
        personality_sim = cosine_similarity(
            personality1.reshape(1, -1), 
            personality2.reshape(1, -1)
        )[0][0]
        
        # Trait-by-trait comparison
        trait_differences = {
            trait_names[i]: abs(float(personality1[i] - personality2[i]))
            for i in range(len(trait_names))
        }
        
        return {
            "topic_similarity": float((topic_sim + 1) / 2),
            "personality_similarity": float((personality_sim + 1) / 2),
            "trait_differences": trait_differences,
            "most_similar_trait": min(trait_differences, key=trait_differences.get),
            "most_different_trait": max(trait_differences, key=trait_differences.get)
        }

