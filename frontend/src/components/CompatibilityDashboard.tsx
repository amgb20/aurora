import { Heart, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useAudioStore } from '../store/audioStore';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const TRAIT_NAMES = [
  'Openness',
  'Conscientiousness',
  'Extraversion',
  'Agreeableness',
  'Neuroticism',
];

export function CompatibilityDashboard() {
  const { matchData } = useAudioStore();

  if (!matchData) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Heart className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Compatibility analysis will appear here</p>
        </CardContent>
      </Card>
    );
  }

  const score = matchData.compatibility_score;
  const scorePercent = (score * 100).toFixed(1);
  
  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.7) return 'text-blue-600';
    if (score >= 0.5) return 'text-yellow-600';
    if (score >= 0.3) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 0.9) return 'bg-green-100 border-green-300';
    if (score >= 0.7) return 'bg-blue-100 border-blue-300';
    if (score >= 0.5) return 'bg-yellow-100 border-yellow-300';
    if (score >= 0.3) return 'bg-orange-100 border-orange-300';
    return 'bg-red-100 border-red-300';
  };

  // Prepare radar chart data
  const users = Object.values(matchData.user_vectors);
  const radarData = TRAIT_NAMES.map((trait, index) => ({
    trait,
    user1: users[0]?.personality_traits[index] || 0,
    user2: users[1]?.personality_traits[index] || 0,
  }));

  // Prepare trait differences bar chart
  const traitDiffData = matchData.details?.trait_differences
    ? Object.entries(matchData.details.trait_differences).map(([trait, diff]) => ({
        trait: trait.charAt(0).toUpperCase() + trait.slice(1),
        difference: (1 - diff) * 100, // Convert to similarity percentage
      }))
    : [];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Compatibility Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Display */}
        <div className={`text-center p-6 rounded-lg border-2 ${getScoreBackground(score)}`}>
          <div className={`text-6xl font-bold ${getScoreColor(score)}`}>
            {scorePercent}%
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Compatibility Score
          </p>
        </div>

        {/* Interpretation */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm leading-relaxed">{matchData.interpretation}</p>
        </div>

        {/* Details Badges */}
        {matchData.details && (
          <div className="grid grid-cols-2 gap-2">
            {matchData.details.topic_similarity !== undefined && (
              <div className="text-center p-3 bg-speaker1/10 rounded-lg">
                <div className="text-2xl font-bold text-speaker1">
                  {(matchData.details.topic_similarity * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">Topic Similarity</div>
              </div>
            )}
            {matchData.details.personality_similarity !== undefined && (
              <div className="text-center p-3 bg-speaker2/10 rounded-lg">
                <div className="text-2xl font-bold text-speaker2">
                  {(matchData.details.personality_similarity * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  Personality Similarity
                </div>
              </div>
            )}
          </div>
        )}

        {/* Radar Chart */}
        {users.length >= 2 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Personality Comparison</h4>
            <div className="h-96 -mx-4 px-2">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                  <PolarGrid />
                  <PolarAngleAxis 
                    dataKey="trait" 
                    tick={{ fill: '#374151', fontSize: 12 }}
                    tickLine={false}
                  />
                  <PolarRadiusAxis angle={90} domain={[0, 1]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                  <Radar
                    name={users[0]?.user_id || 'User 1'}
                    dataKey="user1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                  />
                  <Radar
                    name={users[1]?.user_id || 'User 2'}
                    dataKey="user2"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.3}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Trait Differences */}
        {traitDiffData.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Trait Similarity Breakdown</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={traitDiffData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="trait" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Bar dataKey="difference" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Most Similar/Different Traits */}
        {matchData.details && (
          <div className="grid grid-cols-2 gap-3 pt-4 border-t">
            {matchData.details.most_similar_trait && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Most Similar</div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {matchData.details.most_similar_trait}
                </Badge>
              </div>
            )}
            {matchData.details.most_different_trait && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Most Different</div>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  {matchData.details.most_different_trait}
                </Badge>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
