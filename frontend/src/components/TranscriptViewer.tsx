import { useMemo } from 'react';
import { Download, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useAudioStore } from '../store/audioStore';
import { formatTime, getSpeakerColor, downloadAsText } from '../lib/utils';
import type { SpeakerSegment } from '../lib/types';

export function TranscriptViewer() {
  const {
    diarizedData,
    currentTime,
    searchQuery,
    setSearchQuery,
  } = useAudioStore();

  // Group words by speaker segments
  const segments = useMemo(() => {
    if (!diarizedData) return [];

    const grouped: Array<{
      segment: SpeakerSegment;
      text: string;
      isActive: boolean;
      matchesSearch: boolean;
    }> = [];

    diarizedData.speaker_segments.forEach((segment) => {
      // Get words for this segment
      const wordsInSegment = diarizedData.words_with_speakers.filter(
        (word) => word.start >= segment.start && word.end <= segment.end
      );

      const text = wordsInSegment.map((w) => w.word).join(' ');
      const isActive = currentTime >= segment.start && currentTime <= segment.end;
      const matchesSearch = !searchQuery || 
        text.toLowerCase().includes(searchQuery.toLowerCase());

      grouped.push({
        segment,
        text,
        isActive,
        matchesSearch,
      });
    });

    return grouped;
  }, [diarizedData, currentTime, searchQuery]);

  const handleExport = () => {
    if (!diarizedData) return;

    let content = 'Audio Transcript\n';
    content += '='.repeat(50) + '\n\n';

    diarizedData.speaker_segments.forEach((segment) => {
      const wordsInSegment = diarizedData.words_with_speakers.filter(
        (word) => word.start >= segment.start && word.end <= segment.end
      );
      const text = wordsInSegment.map((w) => w.word).join(' ');
      const speakerName = segment.speaker_name || segment.speaker_id;
      
      content += `[${formatTime(segment.start)} - ${formatTime(segment.end)}] ${speakerName}:\n`;
      content += `${text}\n\n`;
    });

    downloadAsText(content, 'transcript.txt');
  };

  if (!diarizedData) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Upload and process an audio file to see the transcript
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Transcript</CardTitle>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transcript..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Transcript Segments */}
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
          {segments
            .filter((s) => s.matchesSearch)
            .map((item, index) => {
              const speakerColor = getSpeakerColor(item.segment.speaker_id);
              const speakerName = item.segment.speaker_name || item.segment.speaker_id;

              return (
                <div
                  key={index}
                  className={`
                    p-4 rounded-lg border transition-colors
                    ${item.isActive ? 'border-primary bg-primary/5' : 'border-border'}
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-1 h-full rounded-full flex-shrink-0"
                      style={{ backgroundColor: speakerColor }}
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          style={{
                            backgroundColor: speakerColor + '20',
                            color: speakerColor,
                            borderColor: speakerColor,
                          }}
                        >
                          {speakerName}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(item.segment.start)} - {formatTime(item.segment.end)}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed">
                        {item.text}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
          <span>{segments.length} segments</span>
          <span>{diarizedData.speakers_detected} speakers detected</span>
        </div>
      </CardContent>
    </Card>
  );
}
