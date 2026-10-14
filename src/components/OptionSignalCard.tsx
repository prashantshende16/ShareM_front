import React, { useEffect, useState } from 'react';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Clock,
  ShieldCheck,
  Target,
  Sparkles,
  RefreshCw,
  Layers,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Timer,
  CalendarCheck
} from 'lucide-react';
import { OptionIndicator5m } from '../types';
import { api } from '../services/api';

interface OptionSignalCardProps {
  symbol?: string;
  initialSignal?: OptionIndicator5m;
  allowSymbolSelect?: boolean;
}

export const OptionSignalCard: React.FC<OptionSignalCardProps> = ({
  symbol = 'NIFTY 50',
  initialSignal,
  allowSymbolSelect = false
}) => {
  const [currentSymbol, setCurrentSymbol] = useState(symbol);
  const [signal, setSignal] = useState<OptionIndicator5m | null>(initialSignal || null);
  const [loading, setLoading] = useState(!initialSignal);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  const fetchSignal = async (sym: string) => {
    try {
      setLoading(true);
      const res = await api.getOptionIndicatorSignal(sym);
      setSignal(res.signal);
    } catch (err) {
      console.error('Failed to fetch option signal:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialSignal) {
      fetchSignal(currentSymbol);
    } else {
      setSignal(initialSignal);
    }
  }, [currentSymbol, initialSignal]);

  // Update live elapsed time every 30 seconds
  useEffect(() => {
    const updateElapsed = () => {
      if (!signal?.generated_at_iso) {
        setElapsedMinutes(0);
        return;
      }
      const genTime = new Date(signal.generated_at_iso).getTime();
      const diffMs = Date.now() - genTime;
      const mins = Math.max(0, Math.floor(diffMs / 60000));
      setElapsedMinutes(mins);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 30000);
    return () => clearInterval(interval);
  }, [signal]);

  const isCall = signal?.direction === 'CALL';
  const isPut = signal?.direction === 'PUT';
  const isWait = !isCall && !isPut;

  // Has signal expired past 30 minutes?
  const isExpired = elapsedMinutes >= 30;
  const isExpiringSoon = elapsedMinutes >= 20 && elapsedMinutes < 30;

  return (
    <div className={`rounded-3xl border p-6 shadow-2xl relative overflow-hidden transition-all ${
      isCall
        ? 'bg-gradient-to-br from-[#064e3b]/40 via-[#0f172a] to-[#022c22]/50 border-emerald-500/40 shadow-emerald-950/20'
        : isPut
        ? 'bg-gradient-to-br from-[#7f1d1d]/40 via-[#0f172a] to-[#450a0a]/50 border-rose-500/40 shadow-rose-950/20'
        : 'bg-gradient-to-br from-[#1e293b]/70 via-[#0f172a] to-[#334155]/40 border-amber-500/30 shadow-amber-950/10'
    }`}>
      {/* Background radial glow */}
      <div className={`absolute top-0 right-0 w-96 h-40 rounded-full blur-3xl pointer-events-none ${
        isCall ? 'bg-emerald-500/10' : isPut ? 'bg-rose-500/10' : 'bg-amber-500/10'
      }`} />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-4 border-b border-gray-800/80">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl border ${
            isCall
              ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
              : isPut
              ? 'bg-rose-500/20 border-rose-500/30 text-rose-300'
              : 'bg-amber-500/20 border-amber-500/30 text-amber-300'
          }`}>
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white tracking-wide flex items-center gap-2">
                <span>5-Minute Intraday Option Decision Indicator</span>
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 uppercase">
                Pattern + Indicator Confluence
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Accurate 5-min candlestick patterns, EMA 9/21 trend ribbon, VWAP position, and RSI momentum
            </p>
          </div>
        </div>

        {/* Quick Instrument Buttons if selector enabled */}
        <div className="flex items-center gap-2">
          {allowSymbolSelect && (
            <div className="flex items-center gap-1.5 bg-[#1e293b]/80 p-1 rounded-xl border border-gray-700">
              {['NIFTY 50', 'BANKNIFTY', 'FINNIFTY'].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setCurrentSymbol(s);
                    fetchSignal(s);
                  }}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    currentSymbol === s
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => fetchSignal(currentSymbol)}
            disabled={loading}
            className="p-2 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-300 transition-colors border border-gray-700 flex items-center gap-1.5 text-xs font-semibold"
            title="Recalculate 5-min Option Signal"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
            <span className="hidden sm:inline">Refresh Signal</span>
          </button>
        </div>
      </div>

      {/* PROMINENT TIMEFRAME & EXECUTION TIMESTAMP BANNER */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 p-3.5 rounded-2xl bg-gray-900/80 border border-gray-800/90 text-xs">
        {/* Analyzed At Time */}
        <div className="flex items-center gap-2.5 px-2">
          <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
          <div>
            <span className="text-[10px] text-gray-400 block uppercase font-mono">Analyzed At (Hit Time)</span>
            <strong className="text-sm font-mono text-cyan-200">
              {signal?.generated_at || 'Just now'}
            </strong>
          </div>
        </div>

        {/* Validity Window (15 to 30 mins) */}
        <div className="flex items-center gap-2.5 px-2 border-t sm:border-t-0 sm:border-l border-gray-800 pt-2 sm:pt-0">
          <CalendarCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <span className="text-[10px] text-gray-400 block uppercase font-mono">Valid Window (15 - 30m)</span>
            <strong className="text-sm font-mono text-emerald-300">
              Until {signal?.valid_until || 'Next 30 Mins'}
            </strong>
          </div>
        </div>

        {/* Elapsed / Freshness Status */}
        <div className="flex items-center gap-2.5 px-2 border-t sm:border-t-0 sm:border-l border-gray-800 pt-2 sm:pt-0 justify-between">
          <div className="flex items-center gap-2.5">
            <Timer className={`w-4 h-4 shrink-0 ${
              isExpired ? 'text-rose-400' : isExpiringSoon ? 'text-amber-400' : 'text-blue-400'
            }`} />
            <div>
              <span className="text-[10px] text-gray-400 block uppercase font-mono">Signal Age</span>
              <strong className={`text-sm font-mono ${
                isExpired ? 'text-rose-400' : isExpiringSoon ? 'text-amber-400' : 'text-blue-300'
              }`}>
                {elapsedMinutes === 0 ? '< 1 minute ago' : `${elapsedMinutes} min(s) ago`}
              </strong>
            </div>
          </div>

          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono border ${
            isExpired
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              : isExpiringSoon
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}>
            {isExpired ? 'Needs Refresh' : isExpiringSoon ? 'Expiring' : 'Live / Active'}
          </span>
        </div>
      </div>

      {/* Main Signal Decision Box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        {/* Left: Huge Decision Badge */}
        <div className={`p-5 rounded-2xl border flex flex-col justify-between ${
          isCall
            ? 'bg-emerald-950/40 border-emerald-500/30'
            : isPut
            ? 'bg-rose-950/40 border-rose-500/30'
            : 'bg-amber-950/30 border-amber-500/20'
        }`}>
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400 block mb-1">
              5-Min Engine Decision
            </span>
            <div className={`text-2xl font-black tracking-tight flex items-center gap-2.5 ${
              isCall ? 'text-emerald-400' : isPut ? 'text-rose-400' : 'text-amber-400'
            }`}>
              {isCall ? <TrendingUp className="w-7 h-7" /> : isPut ? <TrendingDown className="w-7 h-7" /> : <Clock className="w-7 h-7" />}
              <span>{signal?.decision || 'ANALYZING...'}</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Recommended Strike:</span>
            <span className="text-sm font-mono font-bold text-gray-100 bg-gray-800/90 px-2.5 py-1 rounded-lg border border-gray-700">
              {signal?.strike_suggestion || 'ATM Strike'}
            </span>
          </div>
        </div>

        {/* Center: Probability Bar & Scores */}
        <div className="bg-[#1e293b]/70 border border-gray-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-300">Option Bias Score</span>
              <span className="text-xs font-mono font-bold text-blue-400">{signal?.confidence || 50}% Accuracy Confluence</span>
            </div>

            {/* Split Progress Bar */}
            <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden flex mb-2">
              <div
                className="bg-emerald-500 transition-all duration-500"
                style={{ width: `${signal?.call_score || 50}%` }}
                title={`Call Score: ${signal?.call_score}%`}
              />
              <div
                className="bg-rose-500 transition-all duration-500"
                style={{ width: `${signal?.put_score || 50}%` }}
                title={`Put Score: ${signal?.put_score}%`}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-emerald-400 font-bold">CALL: {signal?.call_score || 50}%</span>
              <span className="text-rose-400 font-bold">PUT: {signal?.put_score || 50}%</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-800 text-[11px] text-gray-400 flex items-center justify-between">
            <span>Duration: <strong className="text-gray-200">5-Min Candle</strong></span>
            <span>Holding Time: <strong className="text-gray-200">{signal?.expected_holding_time || '15 to 30 Minutes'}</strong></span>
          </div>
        </div>

        {/* Right: Entry, SL, Target Setup */}
        <div className="bg-[#1e293b]/70 border border-gray-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-blue-400" />
                Current Base (CMP):
              </span>
              <strong className="font-mono text-gray-100">{signal?.entry_price || '0'}</strong>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                Stop Loss (SL):
              </span>
              <strong className="font-mono text-rose-400">{signal?.stop_loss || '0'}</strong>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                Target 1 / 2:
              </span>
              <strong className="font-mono text-emerald-400">{signal?.target_1} / {signal?.target_2}</strong>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-gray-800 flex items-center justify-between text-[11px]">
            <span className="text-gray-400">Risk/Reward:</span>
            <span className="font-mono font-bold text-amber-400">{signal?.risk_reward || '1 : 2.0'}</span>
          </div>
        </div>
      </div>

      {/* Candlestick Patterns & Indicator Badges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Candlestick Patterns */}
        <div className="bg-[#1e293b]/50 border border-gray-800/80 rounded-xl p-3.5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-gray-200">5-Min Candlestick Patterns Detected</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {signal?.patterns_detected?.length ? (
              signal.patterns_detected.map((pat, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-500/10 border border-blue-500/20 text-blue-300"
                >
                  {pat}
                </span>
              ))
            ) : (
              <span className="text-xs text-gray-400 italic">No aggressive reversal candle pattern in last 3 bars (Trend following mode).</span>
            )}
          </div>
        </div>

        {/* Technical Confluence Badges */}
        <div className="bg-[#1e293b]/50 border border-gray-800/80 rounded-xl p-3.5">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-gray-200">Live Indicator Readings</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
            <div className="bg-gray-900/60 p-1.5 rounded-lg border border-gray-800">
              <span className="text-gray-500 block text-[9px]">EMA 9 / 21</span>
              <span className={signal?.indicators?.trend_ribbon === 'BULLISH' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {signal?.indicators?.ema_9} / {signal?.indicators?.ema_21}
              </span>
            </div>
            <div className="bg-gray-900/60 p-1.5 rounded-lg border border-gray-800">
              <span className="text-gray-500 block text-[9px]">RSI (14)</span>
              <span className="text-gray-200 font-bold">{signal?.indicators?.rsi_14 || 50}</span>
            </div>
            <div className="bg-gray-900/60 p-1.5 rounded-lg border border-gray-800">
              <span className="text-gray-500 block text-[9px]">VWAP Base</span>
              <span className="text-gray-200 font-bold">{signal?.indicators?.vwap || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Explanation */}
      {signal?.summary && (
        <div className="mt-4 p-3.5 rounded-xl bg-gray-900/70 border border-gray-800 text-xs text-gray-300 leading-relaxed flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div>{signal.summary}</div>
        </div>
      )}
    </div>
  );
};
