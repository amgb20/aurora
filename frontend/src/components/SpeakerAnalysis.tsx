import { Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useAudioStore } from '../store/audioStore';
import { formatDuration, getSpeakerColor } from '../lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export function SpeakerAnalysis() {
  const { diarizedData } = useAudioStore();

  if (!diarizedData || !diarizedData.speaker_statistics) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Speaker analysis will appear here</p>
        </CardContent>
      </Card>
    );
  }

  const stats = diarizedData.speaker_statistics;
  const mapping = diarizedData.speaker_mapping || {};

  // Prepare data for pie chart
  const pieData = Object.entries(stats).map(([speakerId, data]) => {
    const percentage = typeof data.percentage === 'number' ? data.percentage : 0;
    return {
      name: mapping[speakerId] || speakerId,
      value: percentage,
      color: getSpeakerColor(speakerId),
    };
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Speaker Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pie Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${(value as number).toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Speaker Details */}
        <div className="space-y-4">
          {Object.entries(stats).map(([speakerId, data]) => {
            const speakerName = mapping[speakerId] || speakerId;
            const color = getSpeakerColor(speakerId);
            const percentage = typeof data.percentage === 'number' ? data.percentage : 0;
            const avgSegment = typeof data.avg_segment_duration === 'number'
              ? data.avg_segment_duration
              : 0;
            const totalTime = typeof data.total_time === 'number' ? data.total_time : 0;
            const numSegments = typeof data.num_segments === 'number' ? data.num_segments : 0;

            return (
              <div key={speakerId} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <Badge
                    style={{
                      backgroundColor: color + '20',
                      color: color,
                      borderColor: color,
                    }}
                  >
                    {speakerName}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm ml-5">
                  <div>
                    <span className="text-muted-foreground">Speaking Time:</span>
                    <p className="font-medium">
                      {formatDuration(totalTime)} ({percentage.toFixed(1)}%)
                    </p>
                  </div>

                  <div>
                    <span className="text-muted-foreground">Segments:</span>
                    <p className="font-medium">{numSegments}</p>
                  </div>

                  <div className="col-span-2">
                    <span className="text-muted-foreground">Avg Segment:</span>
                    <p className="font-medium">
                      {formatDuration(avgSegment)}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="ml-5">
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="pt-4 border-t space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Duration:</span>
            <span className="font-medium">
              {diarizedData.duration ? formatDuration(diarizedData.duration) : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Speakers Detected:</span>
            <span className="font-medium">{diarizedData.speakers_detected}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Segments:</span>
            <span className="font-medium">{diarizedData.speaker_segments.length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
