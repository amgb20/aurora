import { AudioUploader } from './components/AudioUploader';
import { WaveformPlayer } from './components/WaveformPlayer';
import { TranscriptViewer } from './components/TranscriptViewer';
import { CompatibilityDashboard } from './components/CompatibilityDashboard';
import { SpeakerAnalysis } from './components/SpeakerAnalysis';
import { EmotionalMetrics } from './components/EmotionalMetrics';
import { ProcessingWheel } from './components/ProcessingWheel';
import { SummaryCard } from './components/SummaryCard';
import { TranscriptionCard } from './components/TranscriptionCard';
import { useAudioStore } from './store/audioStore';
import { Waves } from 'lucide-react';

function App() {
  const { audioMetadata, diarizedData, matchData, processingState } = useAudioStore();

  const hasData = audioMetadata && diarizedData;

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Colorful Gradient */}
      <header className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 shadow-lg">
        <div className="container mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
              <Waves className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-md">
                Aurora Audio Analyzer
              </h1>
              <p className="text-sm md:text-base text-white/90">
                AI-powered speaker diarization, emotional insights, and compatibility analytics
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-7xl px-4 py-10">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Left Sidebar - Upload & Config */}
          <div className="xl:col-span-3 space-y-6">
            <AudioUploader />
            
            {hasData && (
              <div className="space-y-6">
                <SpeakerAnalysis />
                <EmotionalMetrics />
              </div>
            )}
          </div>

          {/* Main Content - Waveform & Transcript */}
          <div className="xl:col-span-5 space-y-6">
            {/* Processing Wheel */}
            {processingState.isProcessing && <ProcessingWheel />}
            
            {hasData ? (
              <>
                <WaveformPlayer />
                <TranscriptViewer />
                <SummaryCard />
                <TranscriptionCard />
              </>
            ) : (
              <div className="rounded-3xl border-2 border-gray-100 bg-gradient-to-br from-gray-50 to-white shadow-xl p-12 text-center">
                <div className="inline-block p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
                  <Waves className="h-16 w-16 text-white" />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                  Get Started
                </h2>
                <p className="text-slate-600 max-w-2xl mx-auto text-lg">
                  Upload an audio file to see Aurora map each voice, generate rich transcripts,
                  and surface compatibility, emotion, and conversational flow insights within seconds.
                </p>
                <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-5 max-w-3xl mx-auto">
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-blue-400 shadow-lg hover:shadow-xl transition-all">
                    <div className="font-bold text-white text-lg">Step 1</div>
                    <div className="text-blue-50 text-sm mt-1">Upload audio</div>
                  </div>
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 border-2 border-purple-400 shadow-lg hover:shadow-xl transition-all">
                    <div className="font-bold text-white text-lg">Step 2</div>
                    <div className="text-purple-50 text-sm mt-1">View waveform</div>
                  </div>
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-pink-500 to-pink-600 border-2 border-pink-400 shadow-lg hover:shadow-xl transition-all">
                    <div className="font-bold text-white text-lg">Step 3</div>
                    <div className="text-pink-50 text-sm mt-1">Read transcript</div>
                  </div>
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 border-2 border-green-400 shadow-lg hover:shadow-xl transition-all">
                    <div className="font-bold text-white text-lg">Step 4</div>
                    <div className="text-green-50 text-sm mt-1">Get insights</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Compatibility */}
          <div className="xl:col-span-4">
            {matchData ? (
              <CompatibilityDashboard />
            ) : hasData ? (
              <div className="rounded-3xl border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 shadow-lg p-8 text-center">
                <div className="inline-block p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-3">
                  <div className="animate-pulse text-3xl">⚡</div>
                </div>
                <p className="text-orange-900 font-semibold">
                  Analyzing compatibility...
                </p>
                <p className="text-orange-700 text-sm mt-2">
                  Computing personality match scores
                </p>
              </div>
            ) : (
              <div className="rounded-3xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg p-8 text-center">
                <div className="inline-block p-3 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full mb-3">
                  <div className="text-2xl">💡</div>
                </div>
                <p className="text-indigo-900 font-semibold">
                  Ready for Insights
                </p>
                <p className="text-indigo-700 text-sm mt-2">
                  Compatibility scores will appear after processing
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 text-center text-sm text-slate-600 border-t border-gray-200 bg-gray-50">
        <p className="tracking-wide">
          Built with React, TypeScript, Tailwind CSS, Vite, and FastAPI
        </p>
      </footer>
    </div>
  );
}

export default App;
