import { useEffect } from 'react';
import { FileText, Download, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useAudioStore } from '../store/audioStore';
import { transcribeBasic } from '../lib/api';
import { formatDuration } from '../lib/utils';

export function TranscriptionCard() {
  const { audioMetadata, transcriptData, setTranscriptData } = useAudioStore();

  useEffect(() => {
    if (audioMetadata && !transcriptData) {
      // Fetch basic transcription when audio is uploaded
      transcribeBasic(audioMetadata.file)
        .then((data) => setTranscriptData(data))
        .catch((error) => console.error('Transcription failed:', error));
    }
  }, [audioMetadata, transcriptData, setTranscriptData]);

  const handleDownload = () => {
    if (!transcriptData) return;

    const dataStr = JSON.stringify(transcriptData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'full-transcription.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!transcriptData) {
    return (
      <Card className="w-full">
        <CardContent className="py-12 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50 animate-pulse" />
          <p>Generating full transcription...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Full Transcription
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            JSON
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          {transcriptData.duration && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">
                Duration: {formatDuration(transcriptData.duration)}
              </span>
            </div>
          )}
          {transcriptData.chunks_processed && (
            <div className="text-sm text-blue-700">
              {transcriptData.chunks_processed} chunk{transcriptData.chunks_processed > 1 ? 's' : ''} processed
            </div>
          )}
        </div>

        {/* Transcript Text */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Transcript</h4>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
            <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
              {transcriptData.transcript}
            </p>
          </div>
        </div>

        {/* Word Count */}
        <div className="text-xs text-muted-foreground text-right">
          {transcriptData.transcript.split(/\s+/).length} words
        </div>
      </CardContent>
    </Card>
  );
}

