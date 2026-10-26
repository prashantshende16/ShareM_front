import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Zap,
  ShieldAlert,
  Target,
  Trophy,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Wallet,
  Trash2,
  XCircle,
  AlertCircle,
  CheckCircle2,
  Lock,
  Clock,
  Calendar,
  Filter
} from 'lucide-react';
import { api } from '../services/api';
import type { TradePosition, ProfileMarginData } from '../types';

const formatDateTime = (isoString?: string | null) => {
  if (!isoString) return '--';
  try {
    const dateStr = isoString.endsWith('Z') || isoString.includes('+') ? isoString : `${isoString}Z`;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
};

const getLocalDateString = (isoString?: string | null) => {
  if (!isoString) return '';
  try {
    const sStr = isoString.endsWith('Z') || isoString.includes('+') ? isoString : `${isoString}Z`;
    const d = new Date(sStr);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
};

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getYesterdayDateString = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatReadableDateLabel = (dateKey: string) => {
  if (!dateKey || dateKey === 'ALL') return 'All Dates';
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();
  try {
    const parts = dateKey.split('-').map(Number);
    if (parts.length === 3) {
      const dt = new Date(parts[0], parts[1] - 1, parts[2]);
      const formatted = dt.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      if (dateKey === today) return `Today (${formatted})`;
      if (dateKey === yesterday) return `Yesterday (${formatted})`;
      return formatted;
    }
  } catch {
    // fallback
  }
  return dateKey;
};

const formatDuration = (startIso?: string | null, endIso?: string | null) => {
  if (!startIso) return null;
  try {
    const sStr = startIso.endsWith('Z') || startIso.includes('+') ? startIso : `${startIso}Z`;
    const start = new Date(sStr).getTime();
    const end = endIso
      ? new Date(endIso.endsWith('Z') || endIso.includes('+') ? endIso : `${endIso}Z`).getTime()
      : Date.now();
    const diffSec = Math.max(0, Math.floor((end - start) / 1000));
    if (diffSec < 60) return `${diffSec}s`;
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    if (mins < 60) return `${mins}m ${secs}s`;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m`;
  } catch {
    return null;
  }
};

interface ActiveTradesManagerProps {
  selectedTimeframe?: string;
  onRefreshSignals?: () => void;
  refreshTrigger?: number;
}

export const ActiveTradesManager: React.FC<ActiveTradesManagerProps> = ({
  selectedTimeframe = '5m',
  onRefreshSignals,
  refreshTrigger = 0,
}) => {
  const [profileMargin, setProfileMargin] = useState<ProfileMarginData | null>(null);
  const [trades, setTrades] = useState<TradePosition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecutingBatch, setIsExecutingBatch] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [tradeMode, setTradeMode] = useState<'PAPER' | 'LIVE'>('PAPER');
  const [batchTimeframe, setBatchTimeframe] = useState<string>(selectedTimeframe);
  const [lastTickTime, setLastTickTime] = useState<string>('Just now');
  const [selectedDate, setSelectedDate] = useState<string>('TODAY');

  const fetchData = useCallback(async () => {
    try {
      const [pmRes, tradesRes] = await Promise.all([
        api.getProfileMargin().catch(() => null),
        api.getTrades().catch(() => []),
      ]);
      if (pmRes) setProfileMargin(pmRes);
      setTrades(tradesRes);
      setLastTickTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch {
      // ignore background poll errors
    }
  }, []);

  // Fetch immediately on mount and on explicit refreshTrigger from card addition
  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  // Fast 3.5s real-time tick streaming for active trades
  useEffect(() => {
    const interval = setInterval(fetchData, 3500);
    return () => clearInterval(interval);
  }, [fetchData]);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  };

  const handle1ClickBatch = async () => {
    setIsExecutingBatch(true);
    try {
      const res = await api.oneClickBatchAddTrades({
        indices: ['NIFTY 50', 'BANK NIFTY', 'SENSEX', 'FINNIFTY'],
        timeframe: batchTimeframe,
        lots: 1,
        trade_mode: tradeMode,
      });

      showNotification('success', `⚡ ${res.message}! Required Margin: ₹${res.total_margin_required.toLocaleString('en-IN')}`);
      await fetchData();
      if (onRefreshSignals) onRefreshSignals();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to execute 1-Click batch trades');
    } finally {
      setIsExecutingBatch(false);
    }
  };

  const handleBookTarget1 = async (tradeId: number) => {
    setActionLoadingId(tradeId);
    try {
      const res = await api.bookTarget1(tradeId);
      showNotification('success', res.message);
      await fetchData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to book Target 1');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleBookTarget2 = async (tradeId: number) => {
    setActionLoadingId(tradeId);
    try {
      const res = await api.bookTarget2(tradeId);
      showNotification('success', res.message);
      await fetchData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to book Target 2');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleTrailSL = async (tradeId: number, entryPrice: number) => {
    setActionLoadingId(tradeId);
    try {
      const res = await api.trailStopLoss(tradeId, entryPrice);
      showNotification('success', `🛡️ ${res.message} (Risk-Free)`);
      await fetchData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to trail Stop Loss');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCloseTrade = async (tradeId: number) => {
    setActionLoadingId(tradeId);
    try {
      const res = await api.closeTrade(tradeId);
      showNotification('success', res.message);
      await fetchData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to close position');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteTrade = async (tradeId: number) => {
    try {
      await api.deleteTrade(tradeId);
      showNotification('success', 'Trade record deleted');
      await fetchData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to delete trade');
    }
  };

  const [isClosingAll, setIsClosingAll] = useState(false);

  const handleCloseAllActive = async () => {
    if (!window.confirm(`Are you sure you want to exit and close all ${activeTrades.length} active positions at current market prices?`)) return;
    setIsClosingAll(true);
    try {
      const res = await api.closeAllTrades();
      showNotification('success', res.message || `Closed ${res.closed_count} positions`);
      await fetchData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to close all trades');
    } finally {
      setIsClosingAll(false);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Clear all trade positions and history?')) return;
    try {
      await api.clearAllTrades();
      showNotification('success', 'Cleared all trade records');
      await fetchData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to clear trades');
    }
  };

  const todayKey = getTodayDateString();
  const yesterdayKey = getYesterdayDateString();

  const activeTrades = trades.filter((t) => t.status === 'ACTIVE' || t.status === 'TARGET_1_BOOKED');
  const pastTrades = trades.filter((t) => t.status !== 'ACTIVE' && t.status !== 'TARGET_1_BOOKED');

  const todayActiveTrades = useMemo(() => {
    return activeTrades.filter((t) => getLocalDateString(t.entry_time || t.created_at) === todayKey);
  }, [activeTrades, todayKey]);

  // Unique dates from all trades (active + past)
  const uniqueDates = useMemo(() => {
    const map = new Map<string, { activeCount: number; closedCount: number; totalCount: number }>();
    trades.forEach((t) => {
      const d = getLocalDateString(t.entry_time || t.created_at);
      if (!d) return;
      if (!map.has(d)) {
        map.set(d, { activeCount: 0, closedCount: 0, totalCount: 0 });
      }
      const item = map.get(d)!;
      item.totalCount += 1;
      if (t.status === 'ACTIVE' || t.status === 'TARGET_1_BOOKED') {
        item.activeCount += 1;
      } else {
        item.closedCount += 1;
      }
    });

    if (!map.has(todayKey)) {
      map.set(todayKey, { activeCount: 0, closedCount: 0, totalCount: 0 });
    }

    return Array.from(map.entries())
      .map(([dateKey, stats]) => ({
        dateKey,
        label: formatReadableDateLabel(dateKey),
        ...stats,
      }))
      .sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  }, [trades, todayKey]);

  const filteredActiveTrades = useMemo(() => {
    if (selectedDate === 'ALL') {
      return activeTrades;
    }
    const target = selectedDate === 'TODAY' ? todayKey : selectedDate === 'YESTERDAY' ? yesterdayKey : selectedDate;
    return activeTrades.filter((t) => getLocalDateString(t.entry_time || t.created_at) === target);
  }, [activeTrades, selectedDate, todayKey, yesterdayKey]);

  const filteredPastTrades = useMemo(() => {
    if (selectedDate === 'ALL') {
      return pastTrades;
    }
    const target = selectedDate === 'TODAY' ? todayKey : selectedDate === 'YESTERDAY' ? yesterdayKey : selectedDate;
    return pastTrades.filter((t) => getLocalDateString(t.entry_time || t.created_at) === target);
  }, [pastTrades, selectedDate, todayKey, yesterdayKey]);

  const groupedActiveTrades = useMemo(() => {
    const groups: { dateKey: string; label: string; trades: TradePosition[]; subtotalPnl: number }[] = [];
    const dateMap = new Map<string, TradePosition[]>();

    filteredActiveTrades.forEach((t) => {
      const d = getLocalDateString(t.entry_time || t.created_at) || 'Unknown';
      if (!dateMap.has(d)) {
        dateMap.set(d, []);
      }
      dateMap.get(d)!.push(t);
    });

    Array.from(dateMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .forEach(([dateKey, groupTrades]) => {
        const subtotalPnl = groupTrades.reduce((acc, t) => acc + (t.unrealized_pnl || 0), 0);
        groups.push({
          dateKey,
          label: formatReadableDateLabel(dateKey),
          trades: groupTrades,
          subtotalPnl,
        });
      });

    return groups;
  }, [filteredActiveTrades]);

  const totalUnrealized = activeTrades.reduce((acc, t) => acc + (t.unrealized_pnl || 0), 0);
  const filteredUnrealized = filteredActiveTrades.reduce((acc, t) => acc + (t.unrealized_pnl || 0), 0);
  const totalRealized = trades.reduce((acc, t) => acc + (t.realized_pnl || 0), 0);
  const filteredRealized = filteredPastTrades.reduce((acc, t) => acc + (t.realized_pnl || 0), 0);

  return (
    <div id="active-trades-section" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-8 shadow-xl scroll-mt-20">
      {/* Notifications */}
      {notification && (
        <div
          className={`mb-4 p-3 rounded-xl flex items-center justify-between text-xs font-semibold ${
            notification.type === 'success'
              ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/80 border border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
            <span>{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)} className="opacity-70 hover:opacity-100">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Profile & Margin Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pb-5 border-b border-slate-800">
        {/* User Account / Profile Details */}
        <div className="lg:col-span-4 flex items-center justify-between bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              {profileMargin?.client_name ? profileMargin.client_name[0] : 'P'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">
                  {profileMargin?.client_name || 'PRASHANT VISHNU SHENDE'}
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-mono bg-sky-950 text-sky-400 border border-sky-800 rounded">
                  {profileMargin?.client_code || 'P261591'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[11px] text-slate-400 font-medium">Angel One SmartAPI F&O Connected</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setIsLoading(true);
              fetchData().finally(() => setIsLoading(false));
            }}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/60 transition"
            title="Refresh Portfolio"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
          </button>
        </div>

        {/* Funds & Margin Metrics */}
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/40">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium">
              <Wallet className="w-3.5 h-3.5 text-sky-400" />
              <span>Available Margin</span>
            </div>
            <div className="text-base font-extrabold text-white mt-1">
              ₹{profileMargin?.paper_portfolio.available_balance.toLocaleString('en-IN') || '5,00,000'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Live Cash: ₹{(profileMargin?.live_rms.available_cash || 0.22).toFixed(2)}
            </div>
          </div>

          <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/40">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Margin Blocked</span>
            </div>
            <div className="text-base font-extrabold text-amber-300 mt-1">
              ₹{(profileMargin?.paper_portfolio.margin_blocked || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {activeTrades.length} Active {activeTrades.length === 1 ? 'Position' : 'Positions'}
            </div>
          </div>

          <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/40">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Live Unrealized P&L</span>
            </div>
            <div
              className={`text-base font-extrabold mt-1 ${
                totalUnrealized >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {totalUnrealized >= 0 ? '+' : ''}₹{totalUnrealized.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Real-time M2M</div>
          </div>

          <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/40">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium">
              <Trophy className="w-3.5 h-3.5 text-indigo-400" />
              <span>Realized Profit</span>
            </div>
            <div
              className={`text-base font-extrabold mt-1 ${
                totalRealized >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {totalRealized >= 0 ? '+' : ''}₹{totalRealized.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Booked Targets</div>
          </div>
        </div>
      </div>

      {/* 1-Click Add 4 Trades Hero Action Card */}
      <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-indigo-950/70 via-slate-800/80 to-emerald-950/70 border border-indigo-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-white text-sm sm:text-base tracking-wide">
                1-Click Add 4 Trades: NIFTY 50 • SENSEX • BANK NIFTY • FINNIFTY
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                1 Lot Each
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              1 Lot Each: SENSEX (20 Qty) • BANK NIFTY (60 Qty) • NIFTY 50 (65 Qty) • FINNIFTY (65 Qty). Pre-sets Trigger Entry, Stop Loss, and 1st & 2nd Target booking.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Timeframe selector */}
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setBatchTimeframe('5m')}
              className={`px-2.5 py-1 rounded font-bold transition ${
                batchTimeframe === '5m' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              5m Scalp
            </button>
            <button
              onClick={() => setBatchTimeframe('15m')}
              className={`px-2.5 py-1 rounded font-bold transition ${
                batchTimeframe === '15m' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              15m Swing
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setTradeMode('PAPER')}
              className={`px-2.5 py-1 rounded font-bold transition ${
                tradeMode === 'PAPER' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Paper
            </button>
            <button
              onClick={() => setTradeMode('LIVE')}
              className={`px-2.5 py-1 rounded font-bold transition ${
                tradeMode === 'LIVE' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Live SmartAPI
            </button>
          </div>

          {/* Execute 1-Click Button */}
          <button
            onClick={handle1ClickBatch}
            disabled={isExecutingBatch}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-500/25 transition disabled:opacity-50"
          >
            {isExecutingBatch ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Executing 4 Trades...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-current" />
                <span>⚡ Add 4 Trades Now</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Active Trades Section */}
      <div className="mt-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
          <div className="flex flex-wrap items-center gap-2.5">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              Active Positions
            </h4>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-800 text-sky-300 border border-slate-700">
              {filteredActiveTrades.length} {filteredActiveTrades.length === 1 ? 'trade' : 'trades'}
              {selectedDate !== 'ALL' && activeTrades.length !== filteredActiveTrades.length && (
                <span className="text-slate-400 font-normal"> of {activeTrades.length} total</span>
              )}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950/70 text-emerald-300 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Tick Streaming ({lastTickTime})
            </span>
          </div>

          {/* Date Selector Dropdown & Quick Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 shadow-inner">
              <Calendar className="w-3.5 h-3.5 text-sky-400 ml-1.5 shrink-0" />
              <label htmlFor="trade-date-select" className="text-[11px] text-slate-400 font-semibold sr-only sm:not-sr-only">
                Filter Date:
              </label>
              <select
                id="trade-date-select"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-900 border-none text-white text-xs font-bold rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-sky-400 cursor-pointer transition font-mono pr-6"
              >
                <option value="TODAY">
                  📅 Today ({formatReadableDateLabel(todayKey)}) — {todayActiveTrades.length} active
                </option>
                {uniqueDates.filter((d) => d.dateKey !== todayKey).map((d) => (
                  <option key={d.dateKey} value={d.dateKey}>
                    📅 {d.label} — {d.activeCount} active, {d.closedCount} closed
                  </option>
                ))}
                <option value="ALL">
                  🌐 All Dates (Show All {activeTrades.length} positions)
                </option>
              </select>
            </div>

            {/* Quick Toggle Buttons */}
            <div className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-xl border border-slate-700/60">
              <button
                type="button"
                onClick={() => setSelectedDate('TODAY')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                  selectedDate === 'TODAY'
                    ? 'bg-sky-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                Today ({todayActiveTrades.length})
              </button>
              {uniqueDates.find((d) => d.dateKey !== todayKey && d.activeCount > 0) && (
                <button
                  type="button"
                  onClick={() => {
                    const firstPast = uniqueDates.find((d) => d.dateKey !== todayKey && d.activeCount > 0);
                    if (firstPast) setSelectedDate(firstPast.dateKey);
                  }}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                    selectedDate !== 'TODAY' && selectedDate !== 'ALL'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                  }`}
                >
                  {uniqueDates.find((d) => d.dateKey !== todayKey && d.activeCount > 0)?.label.split(' ')[0] || 'Previous'} (
                  {uniqueDates.find((d) => d.dateKey !== todayKey && d.activeCount > 0)?.activeCount})
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedDate('ALL')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                  selectedDate === 'ALL'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                All ({activeTrades.length})
              </button>
            </div>

            <div className="flex items-center gap-2 ml-auto sm:ml-0">
              {activeTrades.length > 0 && (
                <button
                  onClick={handleCloseAllActive}
                  disabled={isClosingAll}
                  className="text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-semibold transition-all disabled:opacity-50"
                  title="Square off / close all active positions now"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  {isClosingAll ? 'Closing...' : `Exit All Active (${activeTrades.length})`}
                </button>
              )}

              {trades.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 hover:underline font-semibold"
                  title="Clear all trade history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {filteredActiveTrades.length === 0 ? (
          <div className="bg-slate-800/30 border border-dashed border-slate-700/60 rounded-2xl p-8 text-center space-y-3">
            <Calendar className="w-10 h-10 text-sky-400/60 mx-auto" />
            <h5 className="text-sm font-bold text-slate-200">
              {selectedDate === 'TODAY'
                ? `No active trades placed Today (${formatReadableDateLabel(todayKey)})`
                : `No active trades found for ${formatReadableDateLabel(selectedDate)}`}
            </h5>
            {activeTrades.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  You have <strong className="text-sky-300 font-bold">{activeTrades.length} open positions</strong> from previous trading sessions.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    onClick={() => setSelectedDate('ALL')}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-sky-950/40 transition"
                  >
                    View All {activeTrades.length} Active Positions
                  </button>
                  {uniqueDates.filter((d) => d.dateKey !== todayKey && d.activeCount > 0).map((d) => (
                    <button
                      key={d.dateKey}
                      onClick={() => setSelectedDate(d.dateKey)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-300 text-xs font-semibold transition"
                    >
                      View {d.label} ({d.activeCount})
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Click the <strong className="text-emerald-400">⚡ Add Trade</strong> or <strong className="text-emerald-400">⚡ Add 4 Trades Now</strong> button above to place recommended trades.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {groupedActiveTrades.map((group) => (
              <div key={group.dateKey} className="space-y-3">
                {/* Date Group Header */}
                <div className="flex items-center justify-between py-2 px-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-sky-400" />
                    <span className="font-extrabold text-white text-xs sm:text-sm font-mono">
                      {group.label}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      {group.trades.length} {group.trades.length === 1 ? 'Position' : 'Positions'}
                    </span>
                  </div>
                  <div className="text-xs font-mono">
                    <span className="text-slate-400">Date P&L: </span>
                    <strong className={group.subtotalPnl >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {group.subtotalPnl >= 0 ? '+' : ''}₹{group.subtotalPnl.toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {group.trades.map((trade) => {
                    const isCall = trade.option_type === 'CE' || trade.contract_name.includes('CE');
                    const isT1Booked = trade.status === 'TARGET_1_BOOKED';
                    const pnl = trade.unrealized_pnl || 0;
                    const isProfit = pnl >= 0;
                    const isActionLoading = actionLoadingId === trade.id;

                    return (
                      <div
                        key={trade.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isT1Booked
                            ? 'bg-emerald-950/30 border-emerald-500/50 shadow-lg shadow-emerald-950/40'
                            : trade.is_target_1_hit
                            ? 'bg-emerald-950/40 border-emerald-400 shadow-lg shadow-emerald-900/30'
                            : trade.is_sl_hit
                            ? 'bg-rose-950/40 border-rose-500 shadow-lg shadow-rose-900/30'
                            : 'bg-slate-800/70 border-slate-700/80 hover:border-slate-600'
                        }`}
                      >
                        {/* Real-time Target / SL Alerts */}
                        {trade.is_target_1_hit && !isT1Booked && (
                          <div className="mb-2.5 p-2 rounded-lg bg-emerald-500/20 border border-emerald-400 flex items-center justify-between text-xs animate-pulse">
                            <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                              <Target className="w-4 h-4 text-emerald-400" />
                              <span>🎯 Target 1 (₹{trade.target_1}) REACHED!</span>
                            </div>
                            <span className="text-[10px] text-emerald-200 font-mono">Book T1 for Risk-Free SL</span>
                          </div>
                        )}
                        {trade.is_sl_hit && (
                          <div className="mb-2.5 p-2 rounded-lg bg-rose-500/20 border border-rose-500 flex items-center gap-1.5 text-xs text-rose-300 font-bold">
                            <ShieldAlert className="w-4 h-4 text-rose-400" />
                            <span>⚠️ Stop Loss (₹{trade.stop_loss}) Breached! Exit recommended.</span>
                          </div>
                        )}

                        {/* Card Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider ${
                                  isCall
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                }`}
                              >
                                {trade.action} {trade.option_type}
                              </span>
                              <span className="text-xs font-mono font-bold text-slate-300">
                                {trade.timeframe} • {trade.lots} Lot ({trade.quantity} Qty)
                              </span>
                              {isT1Booked && (
                                <span className="px-2 py-0.5 bg-emerald-500/30 text-emerald-200 border border-emerald-400 rounded-full text-[10px] font-bold">
                                  🎯 1st Target Booked
                                </span>
                              )}
                            </div>
                            <h5 className="font-extrabold text-sm sm:text-base text-white mt-1">
                              {trade.contract_name}
                            </h5>

                            {/* Trade Added Date & Time */}
                            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] font-mono">
                              <span className="inline-flex items-center gap-1 bg-slate-900/90 text-sky-300 px-2 py-0.5 rounded border border-slate-700/80">
                                <Clock className="w-3 h-3 text-sky-400" />
                                <span>Added: <strong className="text-white">{formatDateTime(trade.entry_time || trade.created_at)}</strong></span>
                              </span>
                              {(trade.entry_time || trade.created_at) && (
                                <span className="text-[10px] text-slate-400">
                                  (Elapsed: {formatDuration(trade.entry_time || trade.created_at, null)})
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Live PnL Pill */}
                          <div className="text-right">
                            <div
                              className={`text-lg font-black flex items-center justify-end gap-1 ${
                                isProfit ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {isProfit ? <TrendingUp className="w-4 h-4 inline" /> : <TrendingDown className="w-4 h-4 inline" />}
                              <span>{isProfit ? '+' : ''}₹{pnl.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="text-[10px] font-mono flex items-center justify-end gap-1.5 mt-0.5">
                              <span className={isProfit ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                {trade.pnl_percentage !== undefined ? `${trade.pnl_percentage > 0 ? '+' : ''}${trade.pnl_percentage}%` : ''}
                              </span>
                              <span className="text-slate-400">• LTP: <strong className="text-white">₹{trade.current_ltp}</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Trade Numbers Grid */}
                        <div className="grid grid-cols-4 gap-2 my-3 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-center">
                          <div>
                            <div className="text-[10px] text-slate-400">Trigger Entry</div>
                            <div className="text-xs font-bold text-emerald-300 mt-0.5">₹{trade.entry_price}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400">Stop Loss (SL)</div>
                            <div className="text-xs font-bold text-rose-300 mt-0.5">
                              ₹{trade.stop_loss}
                              {isT1Booked && <span className="block text-[8px] text-sky-400 font-normal">Break-Even</span>}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400">Target 1</div>
                            <div className="text-xs font-bold text-sky-300 mt-0.5">₹{trade.target_1}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400">Target 2</div>
                            <div className="text-xs font-bold text-indigo-300 mt-0.5">₹{trade.target_2}</div>
                          </div>
                        </div>

                        {/* Profit Expectations & Capital */}
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pb-3 border-b border-slate-700/50">
                          <div>
                            Capital: <strong className="text-white">₹{trade.margin_required.toLocaleString('en-IN')}</strong>
                          </div>
                          <div>
                            Max Risk: <strong className="text-rose-400">-₹{trade.max_risk.toLocaleString('en-IN')}</strong>
                          </div>
                          <div>
                            T1 Profit: <strong className="text-emerald-400">+₹{trade.target_1_profit.toLocaleString('en-IN')}</strong>
                          </div>
                        </div>

                        {/* Interactive Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-1">
                          <div className="flex items-center gap-1.5">
                            {/* Book 1st Target */}
                            {!isT1Booked ? (
                              <button
                                onClick={() => handleBookTarget1(trade.id)}
                                disabled={isActionLoading}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow transition disabled:opacity-50"
                              >
                                <Target className="w-3.5 h-3.5" />
                                <span>Book 1st Target</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleBookTarget2(trade.id)}
                                disabled={isActionLoading}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow transition disabled:opacity-50"
                              >
                                <Trophy className="w-3.5 h-3.5" />
                                <span>Book 2nd Target</span>
                              </button>
                            )}

                            {/* Trail SL to Break-Even */}
                            {!isT1Booked && (
                              <button
                                onClick={() => handleTrailSL(trade.id, trade.entry_price)}
                                disabled={isActionLoading}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-sky-300 text-xs font-semibold transition disabled:opacity-50"
                                title="Trail Stop Loss to Entry price"
                              >
                                <ShieldAlert className="w-3.5 h-3.5" />
                                <span>Trail SL</span>
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Exit / Close */}
                            <button
                              onClick={() => handleCloseTrade(trade.id)}
                              disabled={isActionLoading}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 border border-rose-800 text-rose-200 text-xs font-semibold transition"
                            >
                              Exit Now
                            </button>

                            {/* Delete Record */}
                            <button
                              onClick={() => handleDeleteTrade(trade.id)}
                              disabled={isActionLoading}
                              className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-700/60 transition"
                              title="Delete trade"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Closed Positions Accordion */}
      {pastTrades.length > 0 && (
        <details className="mt-5 pt-4 border-t border-slate-800 group" open>
          <summary className="text-xs font-bold text-slate-400 cursor-pointer flex items-center justify-between hover:text-white">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>
                Closed / Realized Trades ({filteredPastTrades.length}
                {selectedDate !== 'ALL' && ` on ${formatReadableDateLabel(selectedDate)}`})
              </span>
              {selectedDate !== 'ALL' && pastTrades.length !== filteredPastTrades.length && (
                <span className="text-[10px] text-slate-500">
                  (Total {pastTrades.length} all-time)
                </span>
              )}
            </span>
            <span className="text-emerald-400 font-mono font-bold">
              {selectedDate !== 'ALL' ? 'Date' : 'Total'} Realized: {filteredRealized >= 0 ? '+' : ''}₹{filteredRealized.toLocaleString('en-IN')}
            </span>
          </summary>
          <div className="mt-3 space-y-2.5">
            {filteredPastTrades.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-500 bg-slate-800/30 rounded-xl border border-slate-700/40">
                No closed trades on {formatReadableDateLabel(selectedDate)}.
                <button
                  type="button"
                  onClick={() => setSelectedDate('ALL')}
                  className="ml-2 text-sky-400 hover:underline font-semibold"
                >
                  View All Closed ({pastTrades.length})
                </button>
              </div>
            ) : (
              filteredPastTrades.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 hover:border-slate-600 transition flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-sm">{t.contract_name}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.status === 'TARGET_2_BOOKED'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                            : t.realized_pnl >= 0
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {t.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {t.lots} Lot ({t.quantity} Qty)
                      </span>
                    </div>

                    {/* Added Date & Time and Exited Date & Time */}
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] font-mono">
                      <div className="flex items-center gap-1.5 text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                        <Clock className="w-3 h-3 text-emerald-400" />
                        <span className="text-slate-400">Added:</span>
                        <strong className="text-emerald-300">{formatDateTime(t.entry_time || t.created_at)}</strong>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                        <XCircle className="w-3 h-3 text-rose-400" />
                        <span className="text-slate-400">Exited:</span>
                        <strong className="text-rose-300">{formatDateTime(t.exit_time || t.created_at)}</strong>
                      </div>

                      {(t.entry_time || t.created_at) && (t.exit_time || t.created_at) && (
                        <span className="text-[10px] text-slate-400 font-sans">
                          (Held: <strong className="text-slate-300">{formatDuration(t.entry_time || t.created_at, t.exit_time || t.created_at)}</strong>)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-700/50">
                    <div className="text-left md:text-right">
                      <div
                        className={`font-mono font-black text-sm ${
                          t.realized_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {t.realized_pnl >= 0 ? '+' : ''}₹{t.realized_pnl.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Entry: ₹{t.entry_price} → Exit: ₹{t.current_ltp}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteTrade(t.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-700/60 transition"
                      title="Delete trade record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </details>
      )}
    </div>
  );
};

