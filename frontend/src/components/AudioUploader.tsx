import { useCallback, useState } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { useAudioStore } from '../store/audioStore';
import { cn, validateAudioFile } from '../lib/utils';
import { transcribeWithSpeakers, matchCompatibility } from '../lib/api';

export function AudioUploader() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const {
    setAudioMetadata,
    setDiarizedData,
    setMatchData,
    processingState,
    setProcessingState,
    speakerNames,
    setSpeakerNames,
    numSpeakers,
    setNumSpeakers,
    setError,
    error,
  } = useAudioStore();

  const handleFile = useCallback(async (file: File) => {
    // Validate file
    const validation = validateAudioFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setError(null);
    setUploadProgress(0);

    // Create audio URL for playback
    const audioUrl = URL.createObjectURL(file);
    setAudioMetadata({ file, url: audioUrl });

    // Start processing
    setProcessingState({ isProcessing: true, stage: 'uploading', progress: 0 });

    try {
      // Step 1: Transcribe with speakers
      setProcessingState({ isProcessing: true, stage: 'transcribing', progress: 20 });
      const diarizedResult = await transcribeWithSpeakers(file, {
        speakerNames: speakerNames || undefined,
        numSpeakers: numSpeakers || undefined,
        onProgress: (progress) => {
          setUploadProgress(progress);
        },
      });
      setDiarizedData(diarizedResult);

      // Step 2: Match compatibility
      setProcessingState({ isProcessing: true, stage: 'analyzing', progress: 60 });
      const matchResult = await matchCompatibility(file, {
        onProgress: (progress) => {
          setUploadProgress(progress);
        },
      });
      setMatchData(matchResult);

      // Complete
      setProcessingState({ isProcessing: true, stage: 'complete', progress: 100 });
      setTimeout(() => {
        setProcessingState({ isProcessing: false });
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
      setProcessingState({ isProcessing: false });
    }
  }, [
    speakerNames,
    numSpeakers,
    setAudioMetadata,
    setDiarizedData,
    setMatchData,
    setProcessingState,
    setError,
  ]);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0 && files[0].type.startsWith('audio/')) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  return (
    <Card className="w-full bg-white shadow-lg border-2">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Upload Audio</CardTitle>
        <CardDescription>
          Upload an audio file for speaker diarization and compatibility analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Speaker Configuration */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Speaker Names (optional)
          </label>
          <Input
            placeholder="Joe Rogan, Elon Musk"
            value={speakerNames}
            onChange={(e) => setSpeakerNames(e.target.value)}
            disabled={processingState.isProcessing}
          />
          <p className="text-xs text-muted-foreground">
            Comma-separated speaker names
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Number of Speakers (optional)
          </label>
          <Input
            type="number"
            min="1"
            max="10"
            placeholder="Auto-detect"
            value={numSpeakers || ''}
            onChange={(e) =>
              setNumSpeakers(e.target.value ? parseInt(e.target.value) : undefined)
            }
            disabled={processingState.isProcessing}
          />
        </div>

        {/* Upload Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'relative rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300',
            processingState.isProcessing
              ? 'pointer-events-none opacity-60 bg-gray-50'
              : 'cursor-pointer hover:shadow-xl hover:scale-[1.02]',
            isDragging
              ? 'border-blue-500 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 shadow-lg scale-[1.02]'
              : 'border-blue-300 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 shadow-md'
          )}
        >
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileInput}
            disabled={processingState.isProcessing}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          {processingState.isProcessing ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-14 w-14 animate-spin text-blue-600" />
              <div className="space-y-2 w-full">
                <p className="text-sm font-semibold text-gray-900">
                  {processingState.stage === 'uploading' && 'Uploading...'}
                  {processingState.stage === 'transcribing' && 'Transcribing with speaker detection...'}
                  {processingState.stage === 'analyzing' && 'Analyzing compatibility...'}
                  {processingState.stage === 'complete' && 'Complete!'}
                </p>
                {uploadProgress > 0 && (
                  <Progress value={uploadProgress} className="w-full" />
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                <Upload className="h-14 w-14 text-white" />
              </div>
              <p className="text-base font-semibold text-gray-900">
                Drop audio file here or click to browse
              </p>
              <p className="text-sm text-gray-600">
                Supports WAV, MP3, M4A (max 200MB)
              </p>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
