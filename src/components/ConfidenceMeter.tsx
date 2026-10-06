import React from 'react';

interface ConfidenceMeterProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ConfidenceMeter: React.FC<ConfidenceMeterProps> = ({
  score,
  size = 'md',
  showLabel = true,
}) => {
  const clampedScore = Math.max(0, Math.min(100, score));

  // Determine color theme
  let color = '#3b82f6'; // blue
  let glow = 'rgba(59, 130, 246, 0.3)';
  let label = 'Moderate Confidence';

  if (clampedScore >= 70) {
    color = '#10b981'; // green
    glow = 'rgba(16, 185, 129, 0.4)';
    label = 'High Technical Confidence';
  } else if (clampedScore < 50) {
    color = '#ef4444'; // red
    glow = 'rgba(239, 68, 68, 0.4)';
    label = 'Low / Cautious Confidence';
  } else {
    color = '#f59e0b'; // amber
    glow = 'rgba(245, 158, 11, 0.4)';
    label = 'Moderate Confidence';
  }

  const radius = size === 'lg' ? 44 : size === 'md' ? 36 : 24;
  const stroke = size === 'lg' ? 8 : size === 'md' ? 6 : 4;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;
  const dimension = (radius + stroke) * 2;

  return (
    <div className="flex items-center space-x-3.5">
      <div className="relative flex items-center justify-center shrink-0">
        <svg
          width={dimension}
          height={dimension}
          className="transform -rotate-90 drop-shadow-md"
        >
          {/* Background Track */}
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            stroke="#1f2937"
            strokeWidth={stroke}
            fill="transparent"
          />
          {/* Progress Indicator */}
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{
              transition: 'stroke-dashoffset 1s ease-in-out',
              filter: `drop-shadow(0 0 6px ${glow})`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`font-mono font-bold text-white ${
              size === 'lg' ? 'text-xl' : size === 'md' ? 'text-base' : 'text-xs'
            }`}
          >
            {clampedScore}%
          </span>
        </div>
      </div>

      {showLabel && (
        <div>
          <p className="text-xs text-gray-400 font-medium">Confidence Score</p>
          <p className="text-sm font-semibold text-gray-200" style={{ color }}>
            {label}
          </p>
        </div>
      )}
    </div>
  );
};
