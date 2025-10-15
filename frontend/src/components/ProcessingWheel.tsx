import { Loader2 } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { useAudioStore } from '../store/audioStore';

export function ProcessingWheel() {
  const { processingState } = useAudioStore();

  if (!processingState.isProcessing) return null;

  const getStageInfo = () => {
    switch (processingState.stage) {
      case 'uploading':
        return {
          title: 'Uploading Audio',
          subtitle: 'Transferring file to server...',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
        };
      case 'transcribing':
        return {
          title: 'Transcribing & Diarizing',
          subtitle: 'Detecting speakers and generating transcript...',
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
        };
      case 'analyzing':
        return {
          title: 'Analyzing Compatibility',
          subtitle: 'Computing personality match scores...',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
        };
      case 'complete':
        return {
          title: 'Complete!',
          subtitle: 'Processing finished successfully',
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
        };
      default:
        return {
          title: 'Processing',
          subtitle: 'Please wait...',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
        };
    }
  };

  const stageInfo = getStageInfo();
  const progress = processingState.progress || 0;

  return (
    <Card className={`border-2 ${stageInfo.borderColor} ${stageInfo.bgColor} shadow-lg`}>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center gap-4">
          {/* Animated Wheel */}
          <div className="relative">
            <svg className="w-24 h-24" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-gray-200"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                className={stageInfo.color}
                style={{
                  strokeDasharray: `${2 * Math.PI * 45}`,
                  strokeDashoffset: `${2 * Math.PI * 45 * (1 - progress / 100)}`,
                  transform: 'rotate(-90deg)',
                  transformOrigin: '50% 50%',
                  transition: 'stroke-dashoffset 0.5s ease',
                }}
              />
            </svg>
            {/* Spinning loader in center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className={`h-10 w-10 animate-spin ${stageInfo.color}`} />
            </div>
          </div>

          {/* Text Info */}
          <div className="text-center">
            <h3 className={`text-lg font-semibold ${stageInfo.color}`}>
              {stageInfo.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {stageInfo.subtitle}
            </p>
            {progress > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {progress}% complete
              </p>
            )}
          </div>

          {/* Progress bar */}
          {progress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full ${stageInfo.bgColor} transition-all duration-500`}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

