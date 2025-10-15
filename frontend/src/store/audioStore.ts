import { create } from 'zustand';
import type {
  DiarizedTranscriptResponse,
  MatchResponse,
  AudioMetadata,
  ProcessingState,
} from '../lib/types';
import type { TranscribeBasicResponse, SummariseResponse } from '../lib/api';

interface AudioStore {
  // Audio file state
  audioMetadata: AudioMetadata | null;
  setAudioMetadata: (metadata: AudioMetadata | null) => void;

  // API response data
  diarizedData: DiarizedTranscriptResponse | null;
  setDiarizedData: (data: DiarizedTranscriptResponse | null) => void;

  matchData: MatchResponse | null;
  setMatchData: (data: MatchResponse | null) => void;

  // Basic transcription and summary
  transcriptData: TranscribeBasicResponse | null;
  setTranscriptData: (data: TranscribeBasicResponse | null) => void;

  summaryData: SummariseResponse | null;
  setSummaryData: (data: SummariseResponse | null) => void;

  // Processing state
  processingState: ProcessingState;
  setProcessingState: (state: ProcessingState) => void;

  // Playback state
  currentTime: number;
  setCurrentTime: (time: number) => void;

  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;

  // Speaker configuration
  speakerNames: string;
  setSpeakerNames: (names: string) => void;

  numSpeakers: number | undefined;
  setNumSpeakers: (num: number | undefined) => void;

  // Transcript search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Error handling
  error: string | null;
  setError: (error: string | null) => void;

  // Reset function
  reset: () => void;
}

const initialState = {
  audioMetadata: null,
  diarizedData: null,
  matchData: null,
  transcriptData: null,
  summaryData: null,
  processingState: { isProcessing: false },
  currentTime: 0,
  isPlaying: false,
  speakerNames: '',
  numSpeakers: undefined,
  searchQuery: '',
  error: null,
};

export const useAudioStore = create<AudioStore>((set) => ({
  ...initialState,

  setAudioMetadata: (metadata) => set({ audioMetadata: metadata }),
  setDiarizedData: (data) => set({ diarizedData: data }),
  setMatchData: (data) => set({ matchData: data }),
  setTranscriptData: (data) => set({ transcriptData: data }),
  setSummaryData: (data) => set({ summaryData: data }),
  setProcessingState: (state) => set({ processingState: state }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setSpeakerNames: (names) => set({ speakerNames: names }),
  setNumSpeakers: (num) => set({ numSpeakers: num }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));

