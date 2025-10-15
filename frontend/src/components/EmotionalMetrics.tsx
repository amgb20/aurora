import { Smile, MessageCircle, Zap, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useAudioStore } from '../store/audioStore';

export function EmotionalMetrics() {
  const { matchData } = useAudioStore();

  // Extract conversational cues from match data
  // Note: The match endpoint returns conversational cues in the topic extraction step
  // For this demo, we'll show placeholder data or extract it if available

  if (!matchData) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Smile className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Emotional metrics will appear here</p>
        </CardContent>
      </Card>
    );
  }

  // Mock conversational cues for now
  // In a real implementation, these would come from the backend
  const cues = {
    enthusiasm_level: 'high',
    agreement_level: 'agreeing',
    interruptions: 3,
    speaking_balance: 0.6, // 60/40 split
  };

  const getEnthusiasmEmoji = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high':
        return '🔥';
      case 'moderate':
        return '😊';
      case 'low':
        return '😐';
      default:
        return '❓';
    }
  };

  const getEnthusiasmColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'moderate':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getAgreementColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'agreeing':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'neutral':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'disagreeing':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Conversational Dynamics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enthusiasm Level */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Smile className="h-4 w-4" />
            <span>Enthusiasm Level</span>
          </div>
          <Badge className={`text-base ${getEnthusiasmColor(cues.enthusiasm_level)}`}>
            {getEnthusiasmEmoji(cues.enthusiasm_level)} {cues.enthusiasm_level}
          </Badge>
        </div>

        {/* Agreement Level */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageCircle className="h-4 w-4" />
            <span>Agreement Level</span>
          </div>
          <Badge className={`text-base ${getAgreementColor(cues.agreement_level)}`}>
            {cues.agreement_level}
          </Badge>
        </div>

        {/* Interruptions */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="h-4 w-4" />
            <span>Interruptions</span>
          </div>
          <div className="text-2xl font-bold">{cues.interruptions}</div>
          <p className="text-xs text-muted-foreground">
            {cues.interruptions < 5
              ? 'Respectful turn-taking'
              : cues.interruptions < 10
              ? 'Moderate overlap'
              : 'High energy discussion'}
          </p>
        </div>

        {/* Speaking Balance */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Speaking Balance</span>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-secondary rounded-full overflow-hidden flex">
              <div
                className="bg-speaker1 transition-all"
                style={{ width: `${cues.speaking_balance * 100}%` }}
              />
              <div
                className="bg-speaker2 transition-all"
                style={{ width: `${(1 - cues.speaking_balance) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-speaker1 font-medium">
                {(cues.speaking_balance * 100).toFixed(0)}%
              </span>
              <span className="text-speaker2 font-medium">
                {((1 - cues.speaking_balance) * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {Math.abs(cues.speaking_balance - 0.5) < 0.1
                ? 'Well balanced conversation'
                : cues.speaking_balance > 0.6
                ? 'Speaker 1 dominated'
                : 'Speaker 2 dominated'}
            </p>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="pt-4 border-t space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Conversation Style:</span>
            <span className="font-medium">
              {cues.interruptions > 8 ? 'Dynamic' : 'Structured'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Engagement:</span>
            <span className="font-medium">
              {cues.enthusiasm_level === 'high' ? 'High' : 'Moderate'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
