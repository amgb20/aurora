import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useAudioStore } from '../store/audioStore';
import { formatTime, getSpeakerColor } from '../lib/utils';

export function WaveformPlayer() {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const regionsPluginRef = useRef<RegionsPlugin | null>(null);
  const hoverRef = useRef<HTMLDivElement>(null);

  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  const {
    audioMetadata,
    diarizedData,
    currentTime,
    setCurrentTime,
    isPlaying,
    setIsPlaying,
  } = useAudioStore();

  // Initialize WaveSurfer
  useEffect(() => {
    if (!waveformRef.current || !audioMetadata) return;

    // Create canvas for gradients
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas height for gradient calculations
    const height = 128;
    canvas.height = height;

    // Define the waveform gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height * 1.2);
    gradient.addColorStop(0, '#c7d2fe');
    gradient.addColorStop(0.5, '#a5b4fc');
    gradient.addColorStop(0.85, '#ede9fe');
    gradient.addColorStop(1, '#e0f2fe');

    const progressGradient = ctx.createLinearGradient(0, 0, 0, height * 1.2);
    progressGradient.addColorStop(0, '#a855f7');
    progressGradient.addColorStop(0.45, '#6366f1');
    progressGradient.addColorStop(0.8, '#ec4899');
    progressGradient.addColorStop(1, '#f97316');

    // Create regions plugin
    const regions = RegionsPlugin.create();
    regionsPluginRef.current = regions;

    // Initialize WaveSurfer with SoundCloud-style gradients
    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: gradient,
      progressColor: progressGradient,
      cursorColor: '#6366f1',
      barWidth: 2,
      barGap: 1,
      height: height,
      normalize: true,
      plugins: [regions],
    });

    wavesurferRef.current = wavesurfer;

    // Load audio
    wavesurfer.load(audioMetadata.url);

    // Event listeners
    wavesurfer.on('ready', () => {
      setDuration(wavesurfer.getDuration());
    });

    wavesurfer.on('play', () => {
      setIsPlaying(true);
    });

    wavesurfer.on('pause', () => {
      setIsPlaying(false);
    });

    wavesurfer.on('timeupdate', (time) => {
      setCurrentTime(time);
    });

    wavesurfer.on('finish', () => {
      setIsPlaying(false);
    });

    // Region click handler
    regions.on('region-clicked', (region) => {
      wavesurfer.setTime(region.start);
    });

    // Click to play/pause interaction
    wavesurfer.on('interaction', () => {
      wavesurfer.playPause();
    });

    return () => {
      wavesurfer.destroy();
    };
  }, [audioMetadata, setCurrentTime, setIsPlaying]);

  // Hover effect
  useEffect(() => {
    if (!waveformRef.current || !hoverRef.current) return;

    const waveform = waveformRef.current;
    const hover = hoverRef.current;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = waveform.getBoundingClientRect();
      const x = e.clientX - rect.left;
      hover.style.width = `${x}px`;
    };

    waveform.addEventListener('pointermove', handlePointerMove);

    return () => {
      waveform.removeEventListener('pointermove', handlePointerMove);
    };
  }, [audioMetadata]);

  // Add speaker regions
  useEffect(() => {
    if (!regionsPluginRef.current || !diarizedData) return;

    // Clear existing regions
    regionsPluginRef.current.clearRegions();

    // Add regions for each speaker segment
    diarizedData.speaker_segments.forEach((segment) => {
      const color = getSpeakerColor(segment.speaker_id);
      
      regionsPluginRef.current?.addRegion({
        start: segment.start,
        end: segment.end,
        color: color + '40', // Add transparency
        drag: false,
        resize: false,
        content: segment.speaker_name || segment.speaker_id,
      });
    });
  }, [diarizedData]);

  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const skipBackward = () => {
    if (wavesurferRef.current) {
      const currentTime = wavesurferRef.current.getCurrentTime();
      wavesurferRef.current.setTime(Math.max(0, currentTime - 5));
    }
  };

  const skipForward = () => {
    if (wavesurferRef.current) {
      const currentTime = wavesurferRef.current.getCurrentTime();
      const duration = wavesurferRef.current.getDuration();
      wavesurferRef.current.setTime(Math.min(duration, currentTime + 5));
    }
  };

  const changePlaybackRate = (rate: number) => {
    if (wavesurferRef.current) {
      wavesurferRef.current.setPlaybackRate(rate);
      setPlaybackRate(rate);
    }
  };

  if (!audioMetadata) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Upload an audio file to see the waveform
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Audio Waveform</CardTitle>
          <p className="text-xs text-muted-foreground">Click waveform to play/pause</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Waveform with SoundCloud-style overlay */}
        <div className="relative cursor-pointer group" style={{ position: 'relative' }}>
          <div ref={waveformRef} className="w-full" />
          
          {/* Hover overlay effect */}
          <div
            ref={hoverRef}
            className="absolute left-0 top-0 h-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{
              width: 0,
              zIndex: 10,
              mixBlendMode: 'overlay',
              background: 'rgba(255, 255, 255, 0.5)',
            }}
          />
          
          {/* Time display overlays */}
          <div
            className="absolute top-1/2 left-0 -translate-y-1/2 z-10 text-[11px] px-1 py-0.5"
            style={{
              background: 'rgba(0, 0, 0, 0.75)',
              color: '#ddd',
            }}
          >
            {formatTime(currentTime)}
          </div>
          <div
            className="absolute top-1/2 right-0 -translate-y-1/2 z-10 text-[11px] px-1 py-0.5"
            style={{
              background: 'rgba(0, 0, 0, 0.75)',
              color: '#ddd',
            }}
          >
            {formatTime(duration)}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={skipBackward}
            disabled={!wavesurferRef.current}
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            onClick={togglePlayPause}
            disabled={!wavesurferRef.current}
            className="h-12 w-12"
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6" />
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={skipForward}
            disabled={!wavesurferRef.current}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Playback Speed */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-muted-foreground">Speed:</span>
          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
            <Button
              key={rate}
              variant={playbackRate === rate ? 'default' : 'outline'}
              size="sm"
              onClick={() => changePlaybackRate(rate)}
            >
              {rate}x
            </Button>
          ))}
        </div>

        {/* Speaker Legend */}
        {diarizedData && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(diarizedData.speaker_mapping || {}).map(([id, name]) => (
              <div key={id} className="flex items-center gap-2 text-sm">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: getSpeakerColor(id) }}
                />
                <span>{name}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
