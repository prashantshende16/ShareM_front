import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Target,
  Clock,
  Compass,
  AlertTriangle,
  RefreshCw,
  Layers,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { AIMarketStrategyResponse } from '../types';

interface AIMarketStrategyCardProps {
  symbol?: string;
  timeframe?: string;
  expiryType?: string;
}

export const AIMarketStrategyCard: React.FC<AIMarketStrategyCardProps> = ({
  symbol = 'NIFTY 50',
  timeframe = '5m',
  expiryType = 'current'
}) => {
  const [strategy, setStrategy] = useState<AIMarketStrategyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAgent = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getAIMarketStrategy(symbol, timeframe, expiryType);
      setStrategy(res);
    } catch (err: any) {
      console.error('Failed to execute AI Market Strategy Agent:', err);
      setError(err.message || 'Failed to synthesize market strategy');
    } finally {
      setLoading(false);
    }
  };

  const isCall = strategy?.agent_strategy?.verdict?.includes('CALL');
  const isPut = strategy?.agent_strategy?.verdict?.includes('PUT');

  return (
    <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-blue-950/40 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-80 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30">
            <Bot className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white tracking-wide">
                Google Gemini AI Live Market Strategy Agent
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold uppercase">
                Angel One + Global US/UK + Technicals
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Deep institutional synthesis blending Angel One real-time contracts, 5m/15m technical confluence, world cues, and current news
            </p>
          </div>
        </div>

        <button
          onClick={runAgent}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold transition-all shadow-lg shadow-purple-600/30 active:scale-95 flex items-center gap-2 text-xs disabled:opacity-50"
        >
          <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Synthesizing Market Intelligence...' : 'Run Gemini Strategy Agent'}</span>
        </button>
      </div>

      {error && (
        <div className="p-3 mb-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!strategy && !loading && (
        <div className="p-6 rounded-2xl bg-gray-900/50 border border-gray-800/80 text-center">
          <Bot className="w-8 h-8 text-indigo-400 mx-auto mb-2 opacity-70" />
          <h4 className="text-sm font-bold text-gray-200">Institutional Strategy Ready to Run</h4>
          <p className="text-xs text-gray-400 mt-1 max-w-lg mx-auto">
            Click <strong>"Run Gemini Strategy Agent"</strong> to collate live Angel One quotes for {symbol}, 5m vs 15m duration alignment, US & UK market moves, and live news into a comprehensive trade setup.
          </p>
        </div>
      )}

      {strategy && (
        <div className="space-y-4">
          {/* Top Verdict & Harmony Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Verdict */}
            <div className={`p-4 rounded-2xl border ${
              isCall
                ? 'bg-emerald-950/40 border-emerald-500/40'
                : isPut
                ? 'bg-rose-950/40 border-rose-500/40'
                : 'bg-amber-950/30 border-amber-500/30'
            }`}>
              <span className="text-[10px] font-mono uppercase text-gray-400 block mb-1">
                Strategy Verdict ({strategy.timeframe})
              </span>
              <div className={`text-xl font-black flex items-center gap-2 ${
                isCall ? 'text-emerald-400' : isPut ? 'text-rose-400' : 'text-amber-400'
              }`}>
                {isCall ? <TrendingUp className="w-6 h-6" /> : isPut ? <TrendingDown className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                <span>{strategy.agent_strategy.verdict}</span>
              </div>
              <div className="mt-2 text-[11px] font-mono text-gray-400 flex items-center justify-between">
                <span>Conviction: <strong className="text-white">{strategy.agent_strategy.conviction}</strong></span>
                <span>Score: <strong className="text-cyan-400">{strategy.agent_strategy.confidence_score}%</strong></span>
              </div>
            </div>

            {/* Dual Timeframe Harmony */}
            <div className="p-4 rounded-2xl bg-gray-900/70 border border-gray-800">
              <span className="text-[10px] font-mono uppercase text-gray-400 block mb-1">
                Dual Timeframe Alignment (5m vs 15m)
              </span>
              <div className="text-xs font-bold text-cyan-200 leading-snug">
                {strategy.timeframe_alignment.label}
              </div>
              <div className="mt-2 text-[11px] font-mono text-gray-400 flex items-center justify-between">
                <span>5m: {strategy.signal_5m_summary.decision.split(' ')[0]} ({strategy.signal_5m_summary.confidence}%)</span>
                <span>15m: {strategy.signal_15m_summary.decision.split(' ')[0]} ({strategy.signal_15m_summary.confidence}%)</span>
              </div>
            </div>

            {/* Global Stance */}
            <div className="p-4 rounded-2xl bg-gray-900/70 border border-gray-800">
              <span className="text-[10px] font-mono uppercase text-gray-400 block mb-1">
                Global World Bias
              </span>
              <div className="text-xs font-bold text-gray-200 leading-snug">
                {strategy.global_radar.global_verdict}
              </div>
              <div className="mt-2 text-[11px] font-mono text-gray-400 flex items-center justify-between">
                <span>US: {strategy.global_radar.us_market_stance}</span>
                <span>UK: {strategy.global_radar.uk_market_stance}</span>
              </div>
            </div>
          </div>

          {/* Macro & Technical Explanations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-1.5">
              <div className="text-[10px] font-mono uppercase text-cyan-400 font-bold flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" /> Macro Context & Global Tailwinds
              </div>
              <p className="text-gray-300 leading-relaxed">
                {strategy.agent_strategy.macro_global_context}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-900/80 border border-gray-800 space-y-1.5">
              <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Technical Indicators Confluence
              </div>
              <p className="text-gray-300 leading-relaxed">
                {strategy.agent_strategy.technical_edge}
              </p>
            </div>
          </div>

          {/* Actionable Trade Execution Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/70 to-indigo-950/50 border border-blue-500/30">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-blue-500/20">
              <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5">
                <Target className="w-4 h-4 text-cyan-400" />
                Actionable Contract Execution: {strategy.agent_strategy.recommended_contract}
              </span>
              <span className="text-[11px] font-mono text-cyan-300 font-bold">
                Horizon: {strategy.agent_strategy.holding_horizon}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
              <div className="bg-gray-900/70 p-2.5 rounded-xl border border-gray-800">
                <span className="text-[10px] text-gray-400 block">Current LTP</span>
                <strong className="text-sm text-cyan-300">₹{strategy.agent_strategy.live_ltp}</strong>
              </div>
              <div className="bg-gray-900/70 p-2.5 rounded-xl border border-gray-800">
                <span className="text-[10px] text-gray-400 block">Trigger Entry</span>
                <strong className="text-sm text-emerald-400">₹{strategy.agent_strategy.trigger_entry}</strong>
              </div>
              <div className="bg-gray-900/70 p-2.5 rounded-xl border border-gray-800">
                <span className="text-[10px] text-gray-400 block">Stop Loss</span>
                <strong className="text-sm text-rose-400">₹{strategy.agent_strategy.stop_loss}</strong>
              </div>
              <div className="bg-gray-900/70 p-2.5 rounded-xl border border-gray-800">
                <span className="text-[10px] text-gray-400 block">Target 1</span>
                <strong className="text-sm text-emerald-300">₹{strategy.agent_strategy.target_1}</strong>
              </div>
              <div className="bg-gray-900/70 p-2.5 rounded-xl border border-gray-800">
                <span className="text-[10px] text-gray-400 block">Risk / Reward</span>
                <strong className="text-sm text-amber-300">{strategy.agent_strategy.risk_reward}</strong>
              </div>
            </div>

            {/* Key Catalysts & Watchouts */}
            {strategy.agent_strategy.key_catalysts_and_watchouts && (
              <div className="mt-3 pt-2.5 border-t border-blue-500/20">
                <span className="text-[10px] font-mono uppercase text-gray-400 font-bold block mb-1">
                  Key Catalysts & Invalidation Watchouts
                </span>
                <ul className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[11px] text-gray-300">
                  {strategy.agent_strategy.key_catalysts_and_watchouts.map((w, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>
                      <span className="truncate">{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

