"""
Vectorization service using OpenAI embeddings.
"""

import numpy as np
from typing import List, Dict
from openai import OpenAI
from app.config import get_settings
from app.models import Topic


class VectorizationService:
    """Service for creating embeddings using OpenAI's embedding models."""
    
    def __init__(self):
        settings = get_settings()
        self.client = OpenAI(api_key=settings.openai_api_key)
        self.model = settings.embedding_model
        self.embedding_dimension = 1536  # text-embedding-3-small dimension
    
    async def embed_topics(self, topics: List[Topic]) -> np.ndarray:
        """
        Create embeddings for topics and return averaged vector.
        
        Args:
            topics: List of Topic objects
            
        Returns:
            Averaged embedding vector as numpy array
        """
        if not topics:
            # Return zero vector if no topics
            return np.zeros(self.embedding_dimension)
        
        # Create combined text for each topic
        topic_texts = [
            f"{topic.topic}: {topic.description}"
            for topic in topics
        ]
        
        # Get embeddings from OpenAI
        response = self.client.embeddings.create(
            model=self.model,
            input=topic_texts
        )
        
        # Extract embeddings and apply relevance weighting
        weighted_embeddings = []
        for i, topic in enumerate(topics):
            embedding = np.array(response.data[i].embedding)
            weight = topic.relevance_score if topic.relevance_score else 1.0
            weighted_embeddings.append(embedding * weight)
        
        # Average the weighted embeddings
        if weighted_embeddings:
            avg_embedding = np.mean(weighted_embeddings, axis=0)
            # Normalize to unit vector
            norm = np.linalg.norm(avg_embedding)
            if norm > 0:
                avg_embedding = avg_embedding / norm
        else:
            avg_embedding = np.zeros(self.embedding_dimension)
        
        return avg_embedding
    
    async def embed_text(self, text: str) -> np.ndarray:
        """
        Create embedding for a single text.
        
        Args:
            text: Input text
            
        Returns:
            Embedding vector as numpy array
        """
        response = self.client.embeddings.create(
            model=self.model,
            input=[text]
        )
        
        return np.array(response.data[0].embedding)

