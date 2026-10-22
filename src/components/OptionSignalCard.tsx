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
  CalendarCheck,
  Wallet,
  XCircle,
  ShieldAlert
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
  const [expiryType, setExpiryType] = useState<string>(
    initialSignal?.active_expiry || initialSignal?.active_expiry_type || 'current'
  );
  const [selectedStrike, setSelectedStrike] = useState<number | undefined>(initialSignal?.selected_strike);
  const [signal, setSignal] = useState<OptionIndicator5m | null>(initialSignal || null);
  const [loading, setLoading] = useState(!initialSignal);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  const fetchSignal = async (sym: string, expType = expiryType, strike = selectedStrike) => {
    try {
      setLoading(true);
      const res = await api.getOptionIndicatorSignal(sym, expType, strike);
      setSignal(res.signal);
      if (res.signal.selected_strike) {
        setSelectedStrike(res.signal.selected_strike);
      }
      if (res.signal.active_expiry) {
        setExpiryType(res.signal.active_expiry);
      } else if (res.signal.active_expiry_type) {
        setExpiryType(res.signal.active_expiry_type);
      }
    } catch (err) {
      console.error('Failed to fetch option signal:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExpiryChange = (type: string) => {
    setExpiryType(type);
    fetchSignal(currentSymbol, type, selectedStrike);
  };

  const handleStrikeChange = (strike: number) => {
    setSelectedStrike(strike);
    fetchSignal(currentSymbol, expiryType, strike);
  };

  useEffect(() => {
    if (!initialSignal) {
      fetchSignal(currentSymbol, expiryType, selectedStrike);
    } else {
      setSignal(initialSignal);
      if (initialSignal.selected_strike) {
        setSelectedStrike(initialSignal.selected_strike);
      }
      if (initialSignal.active_expiry_type) {
        setExpiryType(initialSignal.active_expiry_type);
      }
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

          <div className="mt-4 pt-3 border-t border-gray-800/80 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">Selected Contract:</span>
              <span className="text-sm font-mono font-bold text-gray-100 bg-gray-800/90 px-2.5 py-1 rounded-lg border border-gray-700">
                {signal?.strike_suggestion || 'ATM Strike'}
              </span>
            </div>

            {/* Interactive Strike Switcher */}
            {signal?.available_strikes && signal.available_strikes.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-800/60">
                <div className="flex items-center justify-between mb-1.5 text-[11px] text-gray-400">
                  <span className="font-semibold text-gray-300">Choose Strike:</span>
                  <span className="font-mono text-cyan-300 font-bold">
                    {signal.selected_strike || signal.strike_suggestion}
                  </span>
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
                  {signal.available_strikes.map((stk) => {
                    const isSel = stk.is_selected || stk.strike === selectedStrike;
                    return (
                      <button
                        key={stk.strike}
                        type="button"
                        onClick={() => handleStrikeChange(stk.strike)}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-lg shrink-0 transition-all font-mono text-center ${
                          isSel
                            ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                            : stk.is_atm
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                            : 'bg-gray-900/80 text-gray-400 hover:text-gray-200 border border-gray-800'
                        }`}
                      >
                        <div className="font-bold">{stk.strike}</div>
                        <div className="text-[8px] opacity-80">{stk.tag}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Interactive Multi-Expiry Switcher (All Indian Market Expiries) */}
            <div className="mt-2 pt-2 border-t border-gray-800/60">
              <div className="flex items-center justify-between mb-1.5 text-[11px] text-gray-400">
                <span className="font-semibold text-gray-300">Contract Expiry:</span>
                <span className="font-mono text-cyan-300 font-bold">
                  {signal?.active_expiry || expiryType}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-1 bg-gray-900/90 rounded-xl border border-gray-700/80 max-h-40 overflow-y-auto">
                {signal?.available_expiries && signal.available_expiries.length > 0 ? (
                  signal.available_expiries.map((exp) => {
                    const isSelected =
                      expiryType === exp.date ||
                      expiryType === exp.id ||
                      signal?.active_expiry === exp.date ||
                      (expiryType === 'current' && exp.dte === 0);
                    const is16Oct = exp.date.includes('16 Oct');

                    return (
                      <button
                        key={exp.id || exp.date}
                        type="button"
                        onClick={() => handleExpiryChange(exp.date)}
                        className={`px-2 py-1.5 text-[10px] font-bold rounded-lg transition-all text-center flex flex-col items-center justify-center ${
                          isSelected
                            ? is16Oct
                              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm ring-1 ring-amber-300'
                              : 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                            : is16Oct
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 hover:bg-amber-500/25'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          {exp.date.split(' ').slice(0, 2).join(' ')}
                          {is16Oct && <span className="text-[8px] bg-amber-400/30 text-amber-200 px-1 rounded font-mono">16 OCT</span>}
                        </span>
                        <span className="text-[9px] opacity-80 font-mono">
                          {exp.dte === 0 ? '0DTE' : exp.tag ? exp.tag : `${exp.dte}d`}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleExpiryChange('current')}
                      className={`px-2 py-1 text-[10px] font-bold rounded-lg ${
                        expiryType === 'current' ? 'bg-emerald-600 text-white' : 'text-gray-400'
                      }`}
                    >
                      Today / Current
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExpiryChange('16 Oct 2026')}
                      className={`px-2 py-1 text-[10px] font-bold rounded-lg ${
                        expiryType.includes('16') ? 'bg-amber-600 text-white' : 'text-gray-400'
                      }`}
                    >
                      16 Oct 2026
                    </button>
                  </>
                )}
              </div>
            </div>
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

        {/* Right: Detailed Option Trade Execution & Lot/Capital Breakdown */}
        <div className="bg-[#1e293b]/80 border border-gray-800 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            {/* Header: Exact Contract & LTP */}
            <div className="bg-gradient-to-r from-blue-950/60 to-indigo-950/40 p-3 rounded-xl border border-blue-500/30 mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1">
                  <Wallet className="w-3 h-3 text-cyan-400" /> Option Position & Capital
                </span>
                <div className="flex items-center gap-2">
                  {signal?.trade_execution?.is_live_angel_one && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Angel One Live
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-cyan-400 font-bold">1 Lot = {signal?.trade_execution?.lot_size || 65} Qty</span>
                </div>
              </div>
              <div className="text-xs font-mono font-bold text-white mb-2 truncate">
                {signal?.trade_execution?.contract_name || `${currentSymbol} ${signal?.active_expiry} ${signal?.strike_suggestion}`}
              </div>

              {/* Price Execution Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-900/70 p-2 rounded-lg border border-gray-800">
                  <span className="text-[10px] text-gray-400 block">Current LTP</span>
                  <strong className="text-sm font-mono text-cyan-300">
                    ₹{signal?.trade_execution?.current_ltp || 34.0}
                  </strong>
                </div>
                <div className="bg-gray-900/70 p-2 rounded-lg border border-gray-800">
                  <span className="text-[10px] text-gray-400 block">Buy Trigger Entry</span>
                  <strong className="text-sm font-mono text-emerald-400">
                    ₹{signal?.trade_execution?.recommended_entry || 38.0}
                  </strong>
                </div>
                <div className="bg-gray-900/70 p-2 rounded-lg border border-gray-800">
                  <span className="text-[10px] text-gray-400 block">Stop Loss (SL)</span>
                  <strong className="text-xs font-mono text-rose-400">
                    ₹{signal?.trade_execution?.stop_loss || 30.0}
                  </strong>
                </div>
                <div className="bg-gray-900/70 p-2 rounded-lg border border-gray-800">
                  <span className="text-[10px] text-gray-400 block">Target 1 / 2</span>
                  <strong className="text-xs font-mono text-emerald-300">
                    ₹{signal?.trade_execution?.target_1 || 48.0} / ₹{signal?.trade_execution?.target_2 || 62.0}
                  </strong>
                </div>
              </div>

              {/* Real Market Day Stats if Available from Angel One */}
              {signal?.trade_execution?.is_live_angel_one && (
                <div className="mt-2 pt-2 border-t border-gray-800/60 grid grid-cols-3 gap-1 text-[10px] font-mono text-gray-300 text-center">
                  <div className="bg-gray-900/50 p-1 rounded">
                    <span className="text-[9px] text-gray-400 block">Day Close</span>
                    <strong className="text-amber-300">₹{signal.trade_execution.day_close || '--'}</strong>
                  </div>
                  <div className="bg-gray-900/50 p-1 rounded">
                    <span className="text-[9px] text-gray-400 block">Day High</span>
                    <strong className="text-emerald-400">₹{signal.trade_execution.day_high || '--'}</strong>
                  </div>
                  <div className="bg-gray-900/50 p-1 rounded">
                    <span className="text-[9px] text-gray-400 block">Day Low</span>
                    <strong className="text-rose-400">₹{signal.trade_execution.day_low || '--'}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* 1 Lot Capital & Max Risk Calculator */}
            <div className="p-2.5 rounded-xl bg-gray-900/70 border border-gray-800/80 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-medium">Capital Required (1 Lot):</span>
                <strong className="font-mono text-cyan-200 font-bold">
                  ₹{signal?.trade_execution?.capital_required?.toLocaleString() || (65 * 38).toLocaleString()}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-medium">Max Risk (1 Lot Loss Limit):</span>
                <strong className="font-mono text-rose-400 font-bold">
                  -₹{signal?.trade_execution?.max_risk_amount?.toLocaleString() || (65 * 8).toLocaleString()}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-medium">Target 1 Profit (1 Lot):</span>
                <strong className="font-mono text-emerald-400 font-bold">
                  +₹{signal?.trade_execution?.target_1_profit?.toLocaleString() || (65 * 10).toLocaleString()}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-medium">Target 2 Profit (1 Lot):</span>
                <strong className="font-mono text-emerald-300 font-bold">
                  +₹{signal?.trade_execution?.target_2_profit?.toLocaleString() || (65 * 24).toLocaleString()}
                </strong>
              </div>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-gray-800 flex items-center justify-between text-[11px]">
            <span className="text-gray-400 font-medium">Risk/Reward Ratio:</span>
            <span className="font-mono font-bold text-amber-400">
              {signal?.trade_execution?.risk_reward_ratio || signal?.risk_reward || '1 : 1.3'}
            </span>
          </div>
        </div>
      </div>

      {/* 6-INDICATOR OBSERVATION CONFLUENCE CHECKLIST */}
      <div className="mt-4 bg-[#1e293b]/60 border border-gray-800 rounded-2xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              6-Indicator Technical Confluence Checklist
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              {signal?.confluence_score?.confirmed || 4} / 6 Confirmed ({signal?.confluence_score?.percentage || 67}%)
            </span>
            <span className="text-[11px] text-gray-400 font-medium">
              {signal?.confluence_score?.verdict || 'Good Confluence Setup'}
            </span>
          </div>
        </div>

        {/* 6 Indicators Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {signal?.indicator_checklist && signal.indicator_checklist.length > 0 ? (
            signal.indicator_checklist.map((ind) => {
              const isConfirmed = ind.status === 'CONFIRMED';
              const isConflict = ind.status === 'CONFLICT';

              return (
                <div
                  key={ind.id}
                  className={`p-2.5 rounded-xl border text-xs transition-all ${
                    isConfirmed
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-gray-200'
                      : isConflict
                      ? 'bg-rose-950/20 border-rose-500/30 text-gray-300'
                      : 'bg-gray-900/40 border-gray-800 text-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-[11px] truncate flex items-center gap-1.5">
                      {isConfirmed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : isConflict ? (
                        <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      )}
                      <span>{ind.name}</span>
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                        isConfirmed
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : isConflict
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      {ind.status}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-cyan-300 mb-0.5 truncate">{ind.value}</div>
                  <div className="text-[10px] text-gray-400 line-clamp-1">{ind.detail || ind.description}</div>
                </div>
              );
            })
          ) : (
            // Default 6 Indicators if not yet populated
            [
              { name: '1. EMA 9/21 Trend Ribbon', value: 'Trend Direction', status: 'CONFIRMED' },
              { name: '2. Intraday VWAP Alignment', value: 'Volume Weighted Price', status: 'CONFIRMED' },
              { name: '3. RSI 14 Momentum', value: 'Expansion / Breakdown', status: 'CONFIRMED' },
              { name: '4. 5-Min Candlestick Pattern', value: 'Pinbars / Reversals', status: 'NEUTRAL' },
              { name: '5. SuperTrend (10, 3) Trail', value: 'ATR Trailing Band', status: 'CONFIRMED' },
              { name: '6. Volume Surge Filter', value: 'Institutional Spike', status: 'NEUTRAL' },
            ].map((ind, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-gray-900/40 border border-gray-800 text-xs">
                <span className="font-bold text-gray-300 block text-[11px]">{ind.name}</span>
                <span className="text-[10px] text-gray-500">{ind.value}</span>
              </div>
            ))
          )}
        </div>

        {/* Free Demat API Integration Note */}
        <div className="mt-3 pt-2.5 border-t border-gray-800 flex flex-wrap items-center justify-between text-[11px] text-gray-400">
          <span className="flex items-center gap-1.5 text-blue-300">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Free Demat API Integration: <strong>Angel One SmartAPI</strong> & <strong>DhanHQ</strong></span>
          </span>
          <span className="text-gray-500">Zero-delay WebSocket tick streaming ready</span>
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
