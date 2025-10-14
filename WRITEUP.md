# Audio Compatibility Pipeline: Technical Writeup

## Reasoning & Approach

This pipeline implements a novel approach to quantifying speaker compatibility by fusing conversational content with personality traits. The core insight is that compatibility emerges from both *what* people discuss and *how* their personalities influence engagement.

The architecture follows a clean, modular design with distinct services for each pipeline stage. Using OpenAI's ecosystem (Whisper, GPT-4, Embeddings) ensures high-quality results while keeping implementation complexity manageable. FastAPI provides production-ready REST endpoints with automatic documentation.

The fusion logic is the key innovation: topic embeddings are weighted by speaker engagement (derived from speaking time) and modulated by personality traits. For example, high openness amplifies topic vectors (1.2×) as open individuals engage more deeply with diverse topics. The final combined vector `[weighted_topics, personality_traits]` captures both content and psychological dimensions.

## Trade-offs

**OpenAI API vs. Local Models**: Chose OpenAI for speed and quality, accepting API costs and latency. Local models (Whisper.cpp, SentenceTransformers) would reduce costs but require more complex setup and GPU resources.

**Vector Fusion Strategy**: Simple weighted concatenation balances interpretability with effectiveness. More sophisticated approaches (attention mechanisms, learned weights) would improve accuracy but reduce explainability—critical for interview/demo contexts.

**Conversational Cues**: Relied on GPT-4 for extraction rather than acoustic analysis (pitch, pace, energy). This misses non-verbal signals but keeps the pipeline focused and implementable within scope.

**Synchronous Processing**: Each request processes sequentially. For production, we'd implement async queuing (Celery/Redis) for long audio files.

## Next Steps

1. **Evaluation Framework**: Add ground-truth compatibility scores to validate the matching algorithm
2. **Speaker Diarization**: Automatically identify who said what using Pyannote or AssemblyAI
3. **Temporal Analysis**: Track compatibility evolution throughout the conversation
4. **Multi-speaker Support**: Extend beyond two-speaker scenarios to group dynamics
5. **Caching Layer**: Cache embeddings and transcripts (Redis) to avoid redundant API calls
6. **A/B Testing**: Compare different fusion strategies using held-out conversations

