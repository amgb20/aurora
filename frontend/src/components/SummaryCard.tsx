import { useEffect } from 'react';
import { FileText, Download, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useAudioStore } from '../store/audioStore';
import { summariseAudio } from '../lib/api';

export function SummaryCard() {
  const { audioMetadata, summaryData, setSummaryData } = useAudioStore();

  useEffect(() => {
    if (audioMetadata && !summaryData) {
      // Fetch summary when audio is uploaded
      summariseAudio(audioMetadata.file)
        .then((data) => setSummaryData(data))
        .catch((error) => console.error('Summary failed:', error));
    }
  }, [audioMetadata, summaryData, setSummaryData]);

  const handleDownload = () => {
    if (!summaryData) return;

    const dataStr = JSON.stringify(summaryData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'conversation-summary.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!summaryData) {
    return (
      <Card className="w-full">
        <CardContent className="py-12 text-center text-muted-foreground">
          <Sparkles className="h-12 w-12 mx-auto mb-2 opacity-50 animate-pulse" />
          <p>Generating conversation summary...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Conversation Summary
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            JSON
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Topics */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Top Topics
          </h4>
          <div className="space-y-3">
            {summaryData.topics.map((topic, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200"
              >
                <div className="flex items-start gap-2">
                  <Badge className="bg-purple-600 text-white">
                    {index + 1}
                  </Badge>
                  <div className="flex-1">
                    <h5 className="font-semibold text-gray-900">{topic.topic}</h5>
                    <p className="text-sm text-gray-700 mt-1">{topic.description}</p>
                    {topic.relevance_score !== undefined && (
                      <p className="text-xs text-purple-600 mt-1">
                        Relevance: {(topic.relevance_score * 100).toFixed(0)}%
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conversational Cues */}
        {summaryData.conversational_cues && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-semibold mb-3">Conversation Dynamics</h4>
            <div className="grid grid-cols-2 gap-3">
              {summaryData.conversational_cues.enthusiasm_level && (
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-xs text-orange-700">Enthusiasm</div>
                  <div className="font-semibold text-orange-900 capitalize">
                    {summaryData.conversational_cues.enthusiasm_level}
                  </div>
                </div>
              )}
              {summaryData.conversational_cues.agreement_level && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-xs text-green-700">Agreement</div>
                  <div className="font-semibold text-green-900 capitalize">
                    {summaryData.conversational_cues.agreement_level}
                  </div>
                </div>
              )}
              {summaryData.conversational_cues.interruptions !== undefined && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-xs text-blue-700">Interruptions</div>
                  <div className="font-semibold text-blue-900">
                    {summaryData.conversational_cues.interruptions}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

