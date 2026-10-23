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
  ShieldAlert,
  Bot
} from 'lucide-react';
import { OptionIndicator5m } from '../types';
import { api } from '../services/api';
import { AIMarketStrategyCard } from './AIMarketStrategyCard';

interface OptionSignalCardProps {
  symbol?: string;
  initialSignal?: OptionIndicator5m;
  allowSymbolSelect?: boolean;
  onTradeAdded?: () => void;
}

export const OptionSignalCard: React.FC<OptionSignalCardProps> = ({
  symbol = 'NIFTY 50',
  initialSignal,
  allowSymbolSelect = false,
  onTradeAdded
}) => {
  const [currentSymbol, setCurrentSymbol] = useState(symbol);
  const [expiryType, setExpiryType] = useState<string>(
    initialSignal?.active_expiry || initialSignal?.active_expiry_type || 'current'
  );
  const [selectedStrike, setSelectedStrike] = useState<number | undefined>(initialSignal?.selected_strike);
  const [signal, setSignal] = useState<OptionIndicator5m | null>(initialSignal || null);
  const [allSignals, setAllSignals] = useState<Record<string, OptionIndicator5m> | null>(null);
  const [lastEvaluatedAt, setLastEvaluatedAt] = useState<string>('');
  const [lastValidUntil, setLastValidUntil] = useState<string>('');
  const [timeframe, setTimeframe] = useState<'5m' | '15m'>('5m');
  const [showAIAgent, setShowAIAgent] = useState(false);
  const [loading, setLoading] = useState(!initialSignal);
  const [refreshingAll, setRefreshingAll] = useState(false);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [isAddingSingleTrade, setIsAddingSingleTrade] = useState(false);
  const [tradeAddMessage, setTradeAddMessage] = useState<string | null>(null);
  const [selectedLots, setSelectedLots] = useState<number>(1);
  const [customLotSize, setCustomLotSize] = useState<number | null>(null);
  const [isEditingLotSize, setIsEditingLotSize] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [countdown, setCountdown] = useState<number>(30);

  const ALL_MARKET_KEYS = ['NIFTY 50', 'BANK NIFTY', 'SENSEX', 'FINNIFTY', 'MIDCPNIFTY'];

  const defaultLotSize = currentSymbol.includes('SENSEX')
    ? 20
    : currentSymbol.includes('BANK')
    ? 60
    : currentSymbol.includes('MID')
    ? 75
    : 65;

  const effectiveLotSize = customLotSize || signal?.trade_execution?.lot_size || defaultLotSize;
  const totalQuantity = selectedLots * effectiveLotSize;

  const entryPrice = signal?.trade_execution?.recommended_entry || 100;
  const stopLoss = signal?.trade_execution?.stop_loss || Math.round(entryPrice * 0.8);
  const target1 = signal?.trade_execution?.target_1 || Math.round(entryPrice * 1.25);
  const target2 = signal?.trade_execution?.target_2 || Math.round(entryPrice * 1.5);

  const calcCapitalRequired = Math.round(totalQuantity * entryPrice);
  const calcMaxRisk = Math.round(totalQuantity * Math.max(0, entryPrice - stopLoss));
  const calcTarget1Profit = Math.round(totalQuantity * Math.max(0, target1 - entryPrice));
  const calcTarget2Profit = Math.round(totalQuantity * Math.max(0, target2 - entryPrice));

  const handleAddSingleTrade = async () => {
    if (!signal) return;
    setIsAddingSingleTrade(true);
    setTradeAddMessage(null);
    try {
      const exec = signal.trade_execution;
      const ltp = exec?.current_ltp || entryPrice;

      await api.createTrade({
        symbol: currentSymbol,
        contract_name: exec?.contract_name || `${currentSymbol} ${signal.active_expiry || ''} ${signal.strike_suggestion || ''}`,
        exchange: currentSymbol.includes('SENSEX') ? 'BFO' : 'NFO',
        tradingsymbol: signal.contract_tradingsymbol,
        symboltoken: signal.contract_symboltoken,
        action: 'BUY',
        option_type: (signal.direction === 'CALL' ? 'CE' : 'PE') as any,
        strike_price: signal.selected_strike,
        expiry: signal.active_expiry,
        timeframe: timeframe,
        lots: selectedLots,
        lot_size: effectiveLotSize,
        entry_price: entryPrice,
        current_ltp: ltp,
        stop_loss: stopLoss,
        target_1: target1,
        target_2: target2,
        trade_mode: 'PAPER',
        notes: `${selectedLots} Lot (${totalQuantity} Qty @ ${effectiveLotSize}/lot) Trade from ${timeframe} Indicator Card (${signal.decision})`
      });

      setTradeAddMessage(`✅ Added ${selectedLots} Lot (${totalQuantity} Qty) to Active Portfolio!`);
      setTimeout(() => setTradeAddMessage(null), 4000);
      if (onTradeAdded) onTradeAdded();
    } catch (err: any) {
      setTradeAddMessage(`❌ ${err.message || 'Failed to add trade'}`);
      setTimeout(() => setTradeAddMessage(null), 4000);
    } finally {
      setIsAddingSingleTrade(false);
    }
  };

  // Fetch all markets in parallel from now till next horizon
  const fetchAllMarkets = async (expType = expiryType, tf = timeframe) => {
    try {
      setLoading(true);
      setRefreshingAll(true);
      const res = await api.getAllOptionIndicatorSignals(expType, tf);
      setAllSignals(res.signals);
      setLastEvaluatedAt(res.timestamp);
      setLastValidUntil(res.valid_until);
      setCountdown(30);

      // Select current market's signal, or default to NIFTY 50
      const activeSig = res.signals[currentSymbol] || res.signals['NIFTY 50'] || Object.values(res.signals)[0];
      if (activeSig) {
        setSignal(activeSig);
        if (activeSig.selected_strike) {
          setSelectedStrike(activeSig.selected_strike);
        }
        if (activeSig.active_expiry) {
          setExpiryType(activeSig.active_expiry);
        }
      }
    } catch (err) {
      console.error('Failed to fetch all-market option signals:', err);
      fetchSingleSignal(currentSymbol, expType, selectedStrike, tf);
    } finally {
      setLoading(false);
      setRefreshingAll(false);
    }
  };

  const fetchSingleSignal = async (sym: string, expType = expiryType, strike = selectedStrike, tf = timeframe) => {
    try {
      setLoading(true);
      const res = await api.getOptionIndicatorSignal(sym, expType, strike, undefined, tf);
      setSignal(res.signal);
      if (res.signal.selected_strike) {
        setSelectedStrike(res.signal.selected_strike);
      }
      if (res.signal.active_expiry) {
        setExpiryType(res.signal.active_expiry);
      } else if (res.signal.active_expiry_type) {
        setExpiryType(res.signal.active_expiry_type);
      }
      setAllSignals((prev) => (prev ? { ...prev, [sym]: res.signal } : { [sym]: res.signal }));
    } catch (err) {
      console.error('Failed to fetch option signal:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMarket = (sym: string) => {
    setCurrentSymbol(sym);
    if (allSignals && allSignals[sym]) {
      const targetSig = allSignals[sym];
      setSignal(targetSig);
      if (targetSig.selected_strike) {
        setSelectedStrike(targetSig.selected_strike);
      }
      if (targetSig.active_expiry) {
        setExpiryType(targetSig.active_expiry);
      }
    } else {
      fetchSingleSignal(sym, expiryType, undefined, timeframe);
    }
  };

  const handleExpiryChange = (type: string) => {
    setExpiryType(type);
    fetchSingleSignal(currentSymbol, type, selectedStrike, timeframe);
  };

  const handleStrikeChange = (strike: number) => {
    setSelectedStrike(strike);
    fetchSingleSignal(currentSymbol, expiryType, strike, timeframe);
  };

  const handleTimeframeChange = (tf: '5m' | '15m') => {
    setTimeframe(tf);
    fetchAllMarkets(expiryType, tf);
  };

  // Immediate mount + background live sync
  useEffect(() => {
    if (initialSignal) {
      setSignal(initialSignal);
      if (initialSignal.selected_strike) {
        setSelectedStrike(initialSignal.selected_strike);
      }
      if (initialSignal.active_expiry_type) {
        setExpiryType(initialSignal.active_expiry_type);
      }
    }
    // Always trigger live market refresh on mount to ensure real-time data
    fetchAllMarkets(expiryType, timeframe);
  }, [initialSignal]);

  // Periodic 30s Auto-Sync countdown
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchAllMarkets(expiryType, timeframe);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, expiryType, timeframe, currentSymbol]);

  // Update live elapsed time every 10 seconds
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
    const interval = setInterval(updateElapsed, 10000);
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

        {/* Timeframe Duration Switcher, AI Agent & Refresh Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 5m vs 15m Duration Toggle */}
          <div className="flex items-center bg-gray-900/90 p-1 rounded-xl border border-gray-700 text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleTimeframeChange('5m')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                timeframe === '5m'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <span>5m Scalp</span>
              <span className="text-[9px] opacity-75 font-mono">(15-30m)</span>
            </button>
            <button
              type="button"
              onClick={() => handleTimeframeChange('15m')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                timeframe === '15m'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <span>15m Swing</span>
              <span className="text-[9px] opacity-75 font-mono">(30-90m)</span>
            </button>
          </div>

          {/* Gemini AI Agent Toggle */}
          <button
            type="button"
            onClick={() => setShowAIAgent(!showAIAgent)}
            className={`px-3 py-2 rounded-xl border transition-all text-xs font-bold flex items-center gap-1.5 ${
              showAIAgent
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400 shadow-lg shadow-purple-950/40'
                : 'bg-purple-950/30 text-purple-300 border-purple-500/30 hover:bg-purple-900/40'
            }`}
            title="Institutional Gemini AI Market Strategy Agent"
          >
            <Bot className="w-4 h-4 text-purple-300" />
            <span>{showAIAgent ? 'Hide AI Agent' : 'Gemini AI Strategy'}</span>
          </button>

          {/* Auto-Sync Toggle & Countdown */}
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 rounded-xl border transition-all text-xs font-semibold flex items-center gap-1.5 ${
              autoRefresh
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/40 shadow-sm shadow-emerald-950/30'
                : 'bg-gray-800/80 text-gray-400 border-gray-700 hover:text-gray-200'
            }`}
            title="Toggle Live 30-Second Auto Refresh"
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
            <span>{autoRefresh ? `Live Sync: ${countdown}s` : 'Live Sync: OFF'}</span>
          </button>

          <button
            onClick={() => fetchAllMarkets(expiryType, timeframe)}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold transition-all shadow-lg shadow-blue-600/30 active:scale-95 flex items-center gap-2 text-xs"
            title={`Recalculate ${timeframe} Horizon for All 5 Indian Markets in Parallel`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshingAll ? 'animate-spin' : ''}`} />
            <span>{refreshingAll ? 'Scanning...' : 'Refresh All'}</span>
          </button>

          <button
            onClick={() => fetchSingleSignal(currentSymbol, expiryType, selectedStrike, timeframe)}
            disabled={loading}
            className="p-2 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-300 transition-colors border border-gray-700 flex items-center gap-1.5 text-xs font-semibold"
            title={`Refresh only ${currentSymbol} (${timeframe})`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading && !refreshingAll ? 'animate-spin text-cyan-400' : ''}`} />
            <span className="hidden sm:inline">Active</span>
          </button>
        </div>
      </div>

      {/* Embedded Gemini AI Market Strategy Agent Panel if active */}
      {showAIAgent && (
        <div className="mb-5 animate-in fade-in duration-300">
          <AIMarketStrategyCard symbol={currentSymbol} timeframe={timeframe} expiryType={expiryType} />
        </div>
      )}

      {/* ALL MARKETS LIVE HORIZON STRIP */}
      <div className="mb-5 p-3.5 rounded-2xl bg-gray-950/60 border border-gray-800/90">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 px-1">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-white tracking-wide uppercase font-mono">
              All Major Markets • {timeframe === '15m' ? '15-Min (60m Horizon)' : '5-Min (30m Horizon)'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
            <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Live Feed
            </span>
            <span>{lastEvaluatedAt ? `Synced at ${lastEvaluatedAt}` : 'Live Parallel Evaluation'}</span>
            <span className="hidden md:inline text-gray-500">• Click to select</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {ALL_MARKET_KEYS.map((symKey) => {
            const mSignal = allSignals ? allSignals[symKey] : (symKey === currentSymbol ? signal : null);
            const isSelected = currentSymbol === symKey;
            const isMSigCall = mSignal?.direction === 'CALL';
            const isMSigPut = mSignal?.direction === 'PUT';
            const decisionLabel = isMSigCall ? 'BUY CALL' : isMSigPut ? 'BUY PUT' : 'WAIT';
            const ltp = mSignal?.trade_execution?.current_ltp;
            const strikeText = mSignal?.strike_suggestion || '--';
            const conf = mSignal?.confidence || mSignal?.confluence_score?.percentage;

            return (
              <button
                key={symKey}
                type="button"
                onClick={() => handleSelectMarket(symKey)}
                className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? isMSigCall
                      ? 'bg-emerald-950/70 border-emerald-400 shadow-md ring-2 ring-emerald-500/40'
                      : isMSigPut
                      ? 'bg-rose-950/70 border-rose-400 shadow-md ring-2 ring-rose-500/40'
                      : 'bg-blue-950/70 border-blue-400 shadow-md ring-2 ring-blue-500/40'
                    : 'bg-gray-900/80 border-gray-800 hover:border-gray-700 hover:bg-gray-850'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-white truncate">{symKey}</span>
                    {mSignal ? (
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                        isMSigCall
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : isMSigPut
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {decisionLabel}
                      </span>
                    ) : (
                      <span className="text-[9px] text-gray-500 font-mono">...</span>
                    )}
                  </div>

                  <div className="text-[11px] font-mono text-gray-200 font-semibold truncate">
                    {strikeText}
                  </div>
                </div>

                <div className="mt-2 pt-1.5 border-t border-gray-800/80 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-cyan-300 font-bold flex items-center gap-1">
                    {mSignal?.trade_execution?.is_live_angel_one && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block"></span>
                    )}
                    {ltp ? `₹${ltp}` : '--'}
                  </span>
                  <span className="text-gray-400 text-[9px]">
                    {conf ? `${conf}%` : ''}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* PROMINENT TIMEFRAME & EXECUTION TIMESTAMP BANNER */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 p-3.5 rounded-2xl bg-gray-900/80 border border-gray-800/90 text-xs">
        {/* Analyzed At Time */}
        <div className="flex items-center gap-2.5 px-2">
          <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
          <div>
            <span className="text-[10px] text-gray-400 block uppercase font-mono">Refresh Timestamp (Hit Time)</span>
            <strong className="text-sm font-mono text-cyan-200">
              {signal?.generated_at || lastEvaluatedAt || 'Just now'}
            </strong>
          </div>
        </div>

        {/* Validity Window (15 to 30 mins) */}
        <div className="flex items-center gap-2.5 px-2 border-t sm:border-t-0 sm:border-l border-gray-800 pt-2 sm:pt-0">
          <CalendarCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <span className="text-[10px] text-gray-400 block uppercase font-mono">Next Horizon (Valid Till)</span>
            <strong className="text-sm font-mono text-emerald-300">
              {signal?.valid_until || lastValidUntil || 'Next 30 Mins'}
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
                  <span className="text-[10px] font-mono text-cyan-400 font-bold">1 Lot = {effectiveLotSize} Qty</span>
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

            {/* Interactive Lot Count & Quantity Adjuster Toolbar */}
            <div className="mb-2 p-2 rounded-xl bg-gray-900/80 border border-gray-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-400 font-medium text-[11px]">Lots:</span>
                <div className="flex items-center bg-gray-800 rounded-lg p-0.5 border border-gray-700">
                  <button
                    type="button"
                    onClick={() => setSelectedLots(Math.max(1, selectedLots - 1))}
                    className="w-5 h-5 rounded bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center font-bold text-xs"
                  >
                    -
                  </button>
                  <span className="px-2 font-mono font-bold text-white text-xs">{selectedLots} Lot{selectedLots > 1 ? 's' : ''}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedLots(selectedLots + 1)}
                    className="w-5 h-5 rounded bg-gray-700 hover:bg-gray-600 text-white flex items-center justify-center font-bold text-xs"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-gray-400 font-medium text-[11px]">Qty/Lot:</span>
                {isEditingLotSize ? (
                  <input
                    type="number"
                    value={effectiveLotSize}
                    onChange={(e) => setCustomLotSize(Math.max(1, parseInt(e.target.value) || 1))}
                    onBlur={() => setIsEditingLotSize(false)}
                    autoFocus
                    className="w-14 bg-gray-800 text-center font-mono font-bold text-emerald-300 rounded border border-emerald-500 text-xs py-0.5"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingLotSize(true)}
                    title="Click to customize quantity per lot"
                    className="px-2 py-0.5 rounded bg-blue-950/70 border border-blue-700 text-cyan-300 font-mono font-bold text-xs hover:border-cyan-400 flex items-center gap-1"
                  >
                    <span>{effectiveLotSize} Qty</span>
                    <span className="text-[10px] text-gray-400">✎</span>
                  </button>
                )}
                <span className="text-gray-400 font-mono text-[10px]">(= {totalQuantity})</span>
              </div>
            </div>

            {/* Dynamic Capital & Max Risk Calculator */}
            <div className="p-2.5 rounded-xl bg-gray-900/70 border border-gray-800/80 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-medium">
                  Capital Required ({selectedLots} Lot{selectedLots > 1 ? 's' : ''} • {totalQuantity} Qty):
                </span>
                <strong className="font-mono text-cyan-200 font-bold text-xs">
                  ₹{calcCapitalRequired.toLocaleString('en-IN')}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-medium">
                  Max Risk ({selectedLots} Lot{selectedLots > 1 ? 's' : ''} Loss Limit):
                </span>
                <strong className="font-mono text-rose-400 font-bold text-xs">
                  -₹{calcMaxRisk.toLocaleString('en-IN')}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-medium">
                  Target 1 Profit ({selectedLots} Lot{selectedLots > 1 ? 's' : ''}):
                </span>
                <strong className="font-mono text-emerald-400 font-bold text-xs">
                  +₹{calcTarget1Profit.toLocaleString('en-IN')}
                </strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 font-medium">
                  Target 2 Profit ({selectedLots} Lot{selectedLots > 1 ? 's' : ''}):
                </span>
                <strong className="font-mono text-emerald-300 font-bold text-xs">
                  +₹{calcTarget2Profit.toLocaleString('en-IN')}
                </strong>
              </div>
            </div>

            {/* Individual Add Trade Button */}
            <div className="mt-2.5">
              <button
                type="button"
                disabled={isAddingSingleTrade}
                onClick={handleAddSingleTrade}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40 transition disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>
                  {isAddingSingleTrade
                    ? 'Adding Trade...'
                    : `⚡ Add ${currentSymbol} Trade (${selectedLots} Lot = ${totalQuantity} Qty)`}
                </span>
              </button>
              {tradeAddMessage && (
                <div className="text-[10px] text-center font-bold mt-1 text-emerald-300">
                  {tradeAddMessage}
                </div>
              )}
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

      {/* MULTI-INDICATOR OBSERVATION CONFLUENCE CHECKLIST */}
      <div className="mt-4 bg-[#1e293b]/60 border border-gray-800 rounded-2xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              {signal?.indicator_checklist?.length || 10}-Indicator Confluence Checklist ({signal?.timeframe || '5 Minute'})
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              {signal?.confluence_score?.confirmed || 7} / {signal?.confluence_score?.total || 10} Confirmed ({signal?.confluence_score?.percentage || 70}%)
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
