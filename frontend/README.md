# Aurora Audio Analyzer - Frontend

A modern React frontend for audio analysis with speaker diarization and compatibility scoring.

## Features

- 🎵 **Interactive Audio Waveform** - Visual playback with speaker-colored regions
- 🎙️ **Speaker Diarization** - Automatic speaker detection and labeling
- 📝 **Synchronized Transcript** - Real-time transcript highlighting during playback
- 💝 **Compatibility Analysis** - AI-powered personality compatibility scoring
- 📊 **Rich Analytics** - Speaker statistics, emotional metrics, and conversational dynamics
- 🎨 **Modern UI** - Beautiful, responsive design with Tailwind CSS

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **WaveSurfer.js** - Interactive audio waveform
- **Recharts** - Data visualization
- **Zustand** - Lightweight state management
- **React Query** - Server state management
- **Axios** - HTTP client

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running on `http://localhost:8000`

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Usage

1. **Upload Audio File**
   - Drag and drop or click to browse
   - Optionally enter speaker names
   - Specify number of speakers if known

2. **View Waveform**
   - Colored regions represent different speakers
   - Click regions to jump to that segment
   - Use playback controls (play/pause, seek, speed)

3. **Read Transcript**
   - Automatically synchronized with audio playback
   - Click timestamps to seek audio
   - Search through transcript

4. **Analyze Results**
   - View speaker statistics and speaking time
   - See compatibility score and personality traits
   - Explore conversational dynamics

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/                    # Reusable UI components
│   │   ├── AudioUploader.tsx      # File upload component
│   │   ├── WaveformPlayer.tsx     # Audio waveform with playback
│   │   ├── TranscriptViewer.tsx   # Synchronized transcript
│   │   ├── SpeakerAnalysis.tsx    # Speaker statistics
│   │   ├── CompatibilityDashboard.tsx  # Compatibility scoring
│   │   └── EmotionalMetrics.tsx   # Conversational dynamics
│   ├── lib/
│   │   ├── api.ts                 # API client
│   │   ├── types.ts               # TypeScript interfaces
│   │   └── utils.ts               # Utility functions
│   ├── store/
│   │   └── audioStore.ts          # Zustand state management
│   ├── App.tsx                    # Main app component
│   ├── main.tsx                   # Entry point
│   └── index.css                  # Global styles
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

## Build for Production

```bash
# Build static files
npm run build

# Preview production build
npm run preview
```

The build output will be in the `dist/` directory.

## API Integration

The frontend integrates with the following backend endpoints:

- `POST /transcribe_with_speakers` - Speaker diarization
- `POST /match` - Compatibility analysis
- `GET /` - Health check

See the backend documentation for more details.

## Development

```bash
# Run development server with hot reload
npm run dev

# Run type checking
npm run type-check

# Run linter
npm run lint
```

## License

Part of the Aurora Audio Analyzer project.
