import { useRef, useEffect } from 'react';
import { Download, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useAudioStore } from '../store/audioStore';
import { formatTime, getSpeakerColor, downloadAsText } from '../lib/utils';

export function TranscriptViewer() {
  const {
    diarizedData,
    currentTime,
    searchQuery,
    setSearchQuery,
  } = useAudioStore();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const currentWordRef = useRef<HTMLSpanElement>(null);

  // Debug speaker IDs on mount
  useEffect(() => {
    if (diarizedData && diarizedData.words_with_speakers.length > 0) {
      const uniqueSpeakers = new Set(
        diarizedData.words_with_speakers.map(w => w.speaker_id)
      );
      console.log('🎤 Speaker IDs detected:', Array.from(uniqueSpeakers));
      console.log('🎨 Speaker mapping:', diarizedData.speaker_mapping);
      
      // Log first few words with their colors
      diarizedData.words_with_speakers.slice(0, 5).forEach(word => {
        const color = getSpeakerColor(word.speaker_id);
        console.log(`Word: "${word.word}" | Speaker: ${word.speaker_id} | Color: ${color}`);
      });
    }
  }, [diarizedData]);

  // Auto-scroll to current word
  useEffect(() => {
    if (currentWordRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const word = currentWordRef.current;
      const containerRect = container.getBoundingClientRect();
      const wordRect = word.getBoundingClientRect();

      // Check if word is out of view
      if (
        wordRect.top < containerRect.top ||
        wordRect.bottom > containerRect.bottom
      ) {
        word.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [currentTime]);

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

  // Filter words based on search
  const filteredWords = diarizedData.words_with_speakers.filter((word) =>
    searchQuery ? word.word.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Karaoke Transcript</CardTitle>
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

        {/* Karaoke-style Transcript */}
        <div
          ref={scrollContainerRef}
          className="relative p-6 bg-gradient-to-br from-gray-50 to-white rounded-lg border-2 border-gray-200 max-h-[500px] overflow-y-auto shadow-inner"
        >
          <div className="text-lg leading-relaxed space-x-1">
            {filteredWords.map((word, index) => {
              const isCurrentWord =
                currentTime >= word.start && currentTime <= word.end;
              const speakerColor = getSpeakerColor(word.speaker_id);

              return (
                <motion.span
                  key={`${word.start}-${index}`}
                  ref={isCurrentWord ? currentWordRef : null}
                  className="inline-block transition-all duration-200 cursor-pointer rounded px-1.5 py-0.5 mx-0.5"
                  style={{
                    backgroundColor: isCurrentWord
                      ? speakerColor
                      : speakerColor + '20', // Always show speaker color background
                    color: isCurrentWord ? 'white' : speakerColor,
                    fontWeight: isCurrentWord ? 'bold' : '600',
                    border: isCurrentWord ? `2px solid ${speakerColor}` : `1px solid ${speakerColor}40`,
                    boxShadow: isCurrentWord ? `0 0 10px ${speakerColor}80` : 'none',
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: isCurrentWord ? 1.15 : 1,
                  }}
                  transition={{
                    duration: 0.2,
                    ease: 'easeOut',
                  }}
                  whileHover={{
                    scale: 1.08,
                    backgroundColor: speakerColor + '60',
                  }}
                  title={`${word.speaker_name || word.speaker_id} - ${formatTime(word.start)}`}
                >
                  {word.word}
                </motion.span>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 items-center justify-between pt-2 border-t">
          <div className="flex flex-wrap gap-2">
            {Object.entries(diarizedData.speaker_mapping || {}).map(([id, name]) => {
              const color = getSpeakerColor(id);
              return (
                <div
                  key={id}
                  className="flex items-center gap-2 px-3 py-1 rounded-full border-2"
                  style={{
                    borderColor: color,
                    backgroundColor: color + '10',
                  }}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm font-medium" style={{ color }}>
                    {name}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="text-xs text-muted-foreground">
            {filteredWords.length} words • {diarizedData.speakers_detected} speakers
          </div>
        </div>

        {/* Tip */}
        <div className="text-xs text-center text-muted-foreground bg-blue-50 p-2 rounded border border-blue-200">
          💡 Words highlight in speaker colors as audio plays. Hover over any word to see speaker and timestamp.
        </div>
      </CardContent>
    </Card>
  );
}
