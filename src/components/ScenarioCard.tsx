import React from 'react';
import { ArrowUpRight, ArrowDownRight, MoveHorizontal, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { ScenarioDetail } from '../types';

interface ScenarioCardProps {
  scenario: ScenarioDetail;
  isPrimary?: boolean;
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenario, isPrimary = false }) => {
  const type = scenario.type.toLowerCase();

  const isBull = type === 'bullish';
  const isBear = type === 'bearish';

  const theme = isBull
    ? {
        border: isPrimary ? 'border-emerald-500/80 shadow-emerald-950/40' : 'border-emerald-900/40',
        badgeBg: 'bg-emerald-950/80 text-emerald-400 border-emerald-800',
        cardBg: isPrimary ? 'bg-gradient-to-b from-[#0e231b] to-[#0c1815]' : 'bg-[#0f172a]/70',
        probColor: 'text-emerald-400',
        icon: ArrowUpRight,
        title: 'Possible Bullish Scenario',
      }
    : isBear
    ? {
        border: isPrimary ? 'border-red-500/80 shadow-red-950/40' : 'border-red-900/40',
        badgeBg: 'bg-red-950/80 text-red-400 border-red-800',
        cardBg: isPrimary ? 'bg-gradient-to-b from-[#2a1215] to-[#180e10]' : 'bg-[#0f172a]/70',
        probColor: 'text-red-400',
        icon: ArrowDownRight,
        title: 'Possible Bearish Scenario',
      }
    : {
        border: isPrimary ? 'border-amber-500/80 shadow-amber-950/40' : 'border-amber-900/40',
        badgeBg: 'bg-amber-950/80 text-amber-400 border-amber-800',
        cardBg: isPrimary ? 'bg-gradient-to-b from-[#241b0b] to-[#15120c]' : 'bg-[#0f172a]/70',
        probColor: 'text-amber-400',
        icon: MoveHorizontal,
        title: 'Sideways / Consolidation Scenario',
      };

  const Icon = theme.icon;

  return (
    <div
      className={`rounded-2xl border p-5 flex flex-col justify-between transition-all duration-300 relative overflow-hidden shadow-xl ${theme.cardBg} ${theme.border}`}
    >
      {isPrimary && (
        <div className="absolute top-0 right-0 bg-blue-600 text-[10px] font-bold text-white px-3 py-0.5 rounded-bl-lg tracking-wider uppercase">
          Primary Scenario
        </div>
      )}

      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2.5">
            <div className={`p-2 rounded-xl border ${theme.badgeBg}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-100 text-base">{theme.title}</h3>
              <p className="text-xs text-gray-400">Time Horizon: {scenario.time_horizon || '15-60 Min'}</p>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-3xl font-mono font-extrabold ${theme.probColor}`}>
              {scenario.probability}%
            </span>
            <p className="text-[10px] text-gray-400 font-medium">Estimated Probability</p>
          </div>
        </div>

        {/* Content Details */}
        <div className="space-y-3.5 text-xs">
          {/* Trigger */}
          <div className="bg-gray-900/60 p-3 rounded-xl border border-gray-800">
            <div className="flex items-center space-x-1.5 text-gray-300 font-semibold mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Trigger Condition</span>
            </div>
            <p className="text-gray-300 leading-relaxed font-mono">{scenario.trigger || 'Sustained level test'}</p>
          </div>

          {/* Confirmation */}
          <div className="bg-gray-900/60 p-3 rounded-xl border border-gray-800">
            <div className="flex items-center space-x-1.5 text-gray-300 font-semibold mb-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Confirmation Factor</span>
            </div>
            <p className="text-gray-300 leading-relaxed">{scenario.confirmation || 'Volume & indicator alignment'}</p>
          </div>

          {/* Potential Movement */}
          <div className="bg-gray-900/60 p-3 rounded-xl border border-gray-800">
            <div className="text-gray-400 font-medium mb-1">
              {isBull || isBear ? 'Potential Price Movement' : 'Expected Range Area'}
            </div>
            <p className="text-gray-100 font-mono font-bold text-sm tracking-wide">
              {scenario.potential_movement || scenario.expected_range || 'Technical channel expansion'}
            </p>
          </div>

          {/* Invalidation */}
          <div className="bg-red-950/20 p-3 rounded-xl border border-red-900/30">
            <div className="flex items-center space-x-1.5 text-red-400 font-semibold mb-1">
              <XCircle className="w-3.5 h-3.5" />
              <span>Invalidation Threshold</span>
            </div>
            <p className="text-red-300 font-mono leading-relaxed">{scenario.invalidation || 'Key level breach'}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between text-[11px] text-gray-400">
        <span>Risk Profile: <strong className="text-gray-200">{scenario.risk_level || 'Medium'}</strong></span>
        <span className="italic text-[10px]">Model estimation only</span>
      </div>
    </div>
  );
};
