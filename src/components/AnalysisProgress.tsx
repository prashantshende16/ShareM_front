import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, Cpu, Brain, Layers, ShieldCheck } from 'lucide-react';

interface AnalysisProgressProps {
  isOpen: boolean;
  onComplete?: () => void;
}

const STEPS = [
  { label: 'Uploading screenshots...', desc: 'Verifying image resolution and format' },
  { label: 'Reading chart...', desc: 'Extracting price scales, candlesticks, and volume' },
  { label: 'Detecting technical structure...', desc: 'Identifying higher highs, swing lows, and trendlines' },
  { label: 'Analyzing multiple timeframes...', desc: 'Comparing higher timeframe bias with lower timeframe execution' },
  { label: 'Generating scenarios...', desc: 'Simulating bullish, bearish, and sideways probabilistic paths' },
  { label: 'Calculating confidence...', desc: 'Evaluating signal confluence and risk/reward ratios' },
  { label: 'Preparing analysis dashboard...', desc: 'Finalizing technical bands and trade setup parameters' },
];

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ isOpen }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1100);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const progressPercent = Math.min(100, Math.round(((currentStepIndex + 1) / STEPS.length) * 100));

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-gray-800 rounded-3xl p-7 max-w-lg w-full shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 animate-pulse" />

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Brain className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-100">AI Technical Vision Engine</h3>
            <p className="text-xs text-gray-400 font-mono">Probabilistic F&O Analysis in Progress</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-mono text-gray-400 mb-2">
            <span>Overall Progress</span>
            <span className="text-blue-400 font-bold">{progressPercent}%</span>
          </div>
          <div className="h-2 w-full bg-gray-900 rounded-full overflow-hidden border border-gray-800">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Steps progression */}
        <div className="space-y-3">
          {STEPS.map((step, index) => {
            const isDone = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isPending = index > currentStepIndex;

            return (
              <div
                key={index}
                className={`flex items-start space-x-3 p-2.5 rounded-xl border transition-all duration-300 ${
                  isCurrent
                    ? 'bg-blue-950/40 border-blue-500/40 shadow-sm'
                    : isDone
                    ? 'bg-emerald-950/20 border-emerald-900/30'
                    : 'bg-gray-900/20 border-transparent opacity-40'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-gray-700 bg-gray-800" />
                  )}
                </div>
                <div>
                  <p
                    className={`text-xs font-medium ${
                      isCurrent
                        ? 'text-blue-200 font-semibold'
                        : isDone
                        ? 'text-gray-300'
                        : 'text-gray-500'
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-800 flex items-center justify-between text-[11px] text-gray-400 font-mono">
          <span>Vision Provider: ACTIVE</span>
          <span className="text-amber-400/90 flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Probabilistic Model</span>
          </span>
        </div>
      </div>
    </div>
  );
};
