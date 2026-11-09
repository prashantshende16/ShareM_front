import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Activity,
  Globe,
  Bell,
  RefreshCw,
  Clock,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
  Filter
} from 'lucide-react';
import { api } from '../services/api';

export const SurgeRadarPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<string>('TODAY');
  const [filterType, setFilterType] = useState<'ALL' | 'CE' | 'PE' | 'HOT'>('ALL');
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['surge-radar', selectedDate],
    queryFn: () => api.getSurgeRadar(selectedDate),
    refetchInterval: 5000, // Poll every 5s for rapid momentum tracking
  });

  const [minSurgeInput, setMinSurgeInput] = useState<string>('');
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);

  useEffect(() => {
    if (data?.min_surge_pct !== undefined) setMinSurgeInput(String(data.min_surge_pct));
  }, [data?.min_surge_pct]);

  const saveSettingsMutation = useMutation({
    mutationFn: (v: number) => api.setSurgeSettings(v),
    onSuccess: (res) => {
      setSettingsMsg(`✅ Showing only +${res.min_surge_pct}% momentum and above (from ${res.updated_at}).`);
      queryClient.invalidateQueries({ queryKey: ['surge-radar'] });
      setTimeout(() => setSettingsMsg(null), 6000);
    },
    onError: (e: any) => setSettingsMsg(`⚠️ ${e.message}`),
  });

  const applyMinSurge = (raw: string) => {
    const v = Number(raw);
    if (!Number.isFinite(v) || v < 0) {
      setSettingsMsg('⚠️ Enter a valid number (0 or more).');
      return;
    }
    saveSettingsMutation.mutate(v);
  };

  const createTradeMutation = useMutation({
    mutationFn: (tradePayload: any) => api.createTrade(tradePayload),
    onSuccess: (res, vars) => {
      setSuccessToast(`⚡ Successfully added 1 Lot (${vars.total_quantity || vars.quantity || 65} Qty) ${vars.contract_name} to Active Positions!`);
      queryClient.invalidateQueries({ queryKey: ['navbar-active-trades'] });
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      setTimeout(() => setSuccessToast(null), 5000);
      setExecutingId(null);
    },
    onError: (err: any) => {
      alert(`Failed to add trade: ${err?.message || err}`);
      setExecutingId(null);
    },
  });

  const handleExecuteTrade = (sugg: any) => {
    setExecutingId(sugg.id);
    createTradeMutation.mutate({
      symbol: sugg.symbol,
      contract_name: sugg.contract_name,
      exchange: sugg.symbol.includes('SENSEX') ? 'BFO' : 'NFO',
      tradingsymbol: sugg.tradingsymbol,
      symboltoken: sugg.symboltoken,
      action: 'BUY',
      option_type: sugg.option_type,
      strike_price: sugg.strike_price,
      expiry: sugg.expiry,
      timeframe: sugg.timeframe || '5m',
      lots: 1,
      lot_size: sugg.lot_size,
      quantity: sugg.total_quantity,
      entry_price: sugg.entry_price,
      current_ltp: sugg.current_ltp || sugg.entry_price,
      stop_loss: sugg.stop_loss,
      target_1: sugg.target_1,
      target_2: sugg.target_2,
      trade_mode: 'PAPER',
      notes: `Executed from Surge Radar (+${sugg.surge_pct}% sudden move | Δ ${sugg.delta})`,
    });
  };

  const macro = data?.macro_radar;
  // Strict: only show setups with profit chance / confidence >= 80%
  const MIN_CONFIDENCE = Number(data?.min_confidence ?? 80);
  const MIN_SURGE_PCT = Number(data?.min_surge_pct ?? 10); // follows backend setting
  const isHighConviction = (s: any) =>
    (Number(s?.confidence_score) || 0) >= MIN_CONFIDENCE && (Number(s?.surge_pct) || 0) >= MIN_SURGE_PCT;
  const suggestions = (data?.suggestions || []).filter(isHighConviction);
  const availableDates = data?.available_dates || [];
  const groupedByDate: Record<string, any[]> = Object.fromEntries(
    Object.entries(data?.grouped_by_date || {})
      .map(([k, items]: [string, any]) => [k, (items || []).filter(isHighConviction)])
      .filter(([, items]) => (items as any[]).length > 0)
  );

  const filteredSuggestions = suggestions.filter((s) => {
    if (filterType === 'CE') return s.option_type === 'CE';
    if (filterType === 'PE') return s.option_type === 'PE';
    if (filterType === 'HOT') return s.is_hot || s.surge_pct >= 15;
    return true;
  });

  const hotCount = suggestions.filter((s) => s.is_hot || s.surge_pct >= 15).length;
  const ceCount = suggestions.filter((s) => s.option_type === 'CE').length;
  const peCount = suggestions.filter((s) => s.option_type === 'PE').length;

  const renderCard = (sugg: any) => {
    const isCall = sugg.option_type === 'CE';
    const isExecuting = executingId === sugg.id;

    return (
      <div
        key={sugg.id}
        className={`p-5 rounded-2xl bg-slate-900/80 border transition-all hover:border-slate-600 flex flex-col justify-between ${
          sugg.is_hot
            ? 'border-amber-500/40 shadow-lg shadow-amber-500/5'
            : 'border-slate-800'
        }`}
      >
        <div>
          {/* Top Bar: Symbol, Type, Surge Badge */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span className="font-extrabold text-white text-base tracking-tight">{sugg.symbol}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-black uppercase ${
                    isCall
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  BUY {sugg.option_type}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {sugg.lots} Lot ({sugg.total_quantity} Qty)
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-black font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  💰 1 Lot: ₹{Math.round(Number(sugg.capital_required) || (Number(sugg.entry_price) * (Number(sugg.total_quantity) || Number(sugg.lot_size) || 1))).toLocaleString('en-IN')}
                </span>
                {sugg.detected_date_label && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {sugg.detected_date_label}
                  </span>
                )}
              </div>
              <div className="text-xs font-bold text-slate-300 mt-1">
                {sugg.contract_name}
              </div>
            </div>

            <div className="flex flex-col items-end space-y-1 shrink-0">
              <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-amber-300 border border-amber-500/40 shadow-sm animate-pulse">
                {sugg.surge_badge}
              </span>
              <span className="text-[10px] font-mono text-slate-400 flex items-center space-x-1">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>{sugg.detected_at}</span>
              </span>
            </div>
          </div>

          {/* Greeks & Surge Metrics Row */}
          <div className="grid grid-cols-3 gap-2 mt-4 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Option Delta</span>
              <span className="font-extrabold text-sky-400">Δ {sugg.delta}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Volume Ratio</span>
              <span className="font-extrabold text-purple-400">{sugg.volume_ratio}x Spike</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Confidence</span>
              <span className="font-extrabold text-emerald-400">{sugg.confidence_score}% Score</span>
            </div>
          </div>

          {/* Levels Grid: Entry, SL, Targets */}
          <div className="grid grid-cols-4 gap-2 mt-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 text-center">
            <div>
              <span className="text-[10px] text-slate-400 block font-mono">Trigger Entry</span>
              <span className="text-xs font-bold text-white">₹{sugg.entry_price}</span>
            </div>
            <div>
              <span className="text-[10px] text-rose-400 block font-mono">Stop Loss</span>
              <span className="text-xs font-bold text-rose-300">₹{sugg.stop_loss}</span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-400 block font-mono">Target 1</span>
              <span className="text-xs font-bold text-emerald-300">₹{sugg.target_1}</span>
            </div>
            <div>
              <span className="text-[10px] text-indigo-400 block font-mono">Target 2</span>
              <span className="text-xs font-bold text-indigo-300">₹{sugg.target_2}</span>
            </div>
          </div>

          {/* Price & 1-Lot Cost: what you pay if you buy at the entry price */}
          {(() => {
            const qty = Number(sugg.total_quantity) || Number(sugg.lot_size) || 1;
            const entry = Number(sugg.entry_price) || 0;
            const money = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
            const capital = Number(sugg.capital_required) || entry * qty;
            const maxRisk = Number(sugg.max_risk_amount) || Math.max(0, entry - Number(sugg.stop_loss)) * qty;
            const t1Profit = Number(sugg.target_1_profit) || (Number(sugg.target_1) - entry) * qty;
            const t2Profit = Number(sugg.target_2_profit) || (Number(sugg.target_2) - entry) * qty;
            return (
              <div className="mt-2 p-3 rounded-xl bg-slate-950/60 border border-slate-700/50 space-y-2">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">Price at Signal</span>
                    <span className="text-xs font-bold text-slate-200">₹{sugg.signal_ltp ?? sugg.current_ltp}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">Live LTP</span>
                    <span className="text-xs font-bold text-sky-300">₹{sugg.current_ltp}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">Buy At (Entry)</span>
                    <span className="text-xs font-bold text-white">₹{sugg.entry_price}</span>
                  </div>
                </div>
                <div className="text-[11px] font-mono text-slate-300 text-center">
                  1 Lot = ₹{sugg.entry_price} × {qty} Qty = <strong className="text-amber-300">{money(capital)}</strong>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-[10px] text-rose-400 block font-mono">Max Risk (SL)</span>
                    <span className="text-xs font-bold text-rose-300">-{money(maxRisk)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-400 block font-mono">T1 Profit</span>
                    <span className="text-xs font-bold text-emerald-300">+{money(t1Profit)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-indigo-400 block font-mono">T2 Profit</span>
                    <span className="text-xs font-bold text-indigo-300">+{money(t2Profit)}</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Summary / Reasoning */}
          <p className="text-xs text-slate-400 mt-3 leading-relaxed">
            {sugg.summary}
          </p>
        </div>

        {/* Bottom Actions */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-400">
            R:R Ratio <strong className="text-white">{sugg.risk_reward}</strong>
          </span>

          <button
            onClick={() => handleExecuteTrade(sugg)}
            disabled={isExecuting}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition shadow-lg active:scale-95 ${
              isCall
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/50'
                : 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-rose-950/50'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>
              {isExecuting
                ? 'Adding to Positions...'
                : `⚡ Add 1 Lot (₹${Math.round(Number(sugg.capital_required) || (Number(sugg.entry_price) * (Number(sugg.total_quantity) || Number(sugg.lot_size) || 1))).toLocaleString('en-IN')})`}
            </span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Success Notification Banner */}
      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-between text-emerald-300 text-sm font-semibold shadow-lg shadow-emerald-950/40 animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-400 hover:text-white text-xs font-mono">
            Dismiss
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-white tracking-tight">RAPID SURGE TRADE RADAR</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                  10% - 20%+ Sudden High Move
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  ≥ {MIN_CONFIDENCE}% Profit Chance • ≥ +{MIN_SURGE_PCT}% Surge Only
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated continuous Call & Put detection with Delta Greeks, Volume ratio, and Global Macro Confluence.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-amber-400' : ''}`} />
            <span>{isFetching ? 'Scanning...' : 'Scan Now'}</span>
          </button>
          <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-400">
            Last scan: <span className="text-slate-200 font-bold">{data?.last_scanned_at || '--:--'}</span>
          </div>
        </div>
      </div>

      {/* Minimum Momentum Range Setting (user adjustable, saved on server) */}
      <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
            <Filter className="w-4 h-4 text-amber-400" />
            <span>MINIMUM MOMENTUM % (show only above this)</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Active: <span className="text-amber-300 font-bold">+{data?.min_surge_pct ?? '--'}%</span>
            {' • '}applies to new signals from the moment you save
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[10, 50, 250, 500, 800].map((v) => (
            <button
              key={v}
              onClick={() => { setMinSurgeInput(String(v)); applyMinSurge(String(v)); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                Number(data?.min_surge_pct) === v
                  ? 'bg-amber-600 text-white border-amber-400/50'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border-slate-700'
              }`}
            >
              {v}%+
            </button>
          ))}
          <input
            type="number"
            min={0}
            value={minSurgeInput}
            onChange={(e) => setMinSurgeInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') applyMinSurge(minSurgeInput); }}
            placeholder="Custom %"
            className="w-28 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
          />
          <button
            onClick={() => applyMinSurge(minSurgeInput)}
            disabled={saveSettingsMutation.isPending}
            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-60"
          >
            {saveSettingsMutation.isPending ? 'Saving...' : 'Apply'}
          </button>
        </div>
        {settingsMsg && <p className="text-[11px] font-mono text-slate-300">{settingsMsg}</p>}
      </div>

      {/* Global Macro Observation Bar (Dow Jones, Nasdaq 100, India VIX) */}
      {macro && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Nasdaq 100 */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">Nasdaq 100</span>
              <div className="text-lg font-extrabold text-white mt-0.5">
                {macro.nasdaq.price ? macro.nasdaq.price.toLocaleString('en-US') : '--'}
              </div>
            </div>
            <div className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
              macro.nasdaq.change_pct >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
            }`}>
              {macro.nasdaq.change_pct >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              <span>{macro.nasdaq.change_pct >= 0 ? '+' : ''}{macro.nasdaq.change_pct.toFixed(2)}%</span>
            </div>
          </div>

          {/* Dow Jones */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">Dow Jones</span>
              <div className="text-lg font-extrabold text-white mt-0.5">
                {macro.dow_jones.price ? macro.dow_jones.price.toLocaleString('en-US') : '--'}
              </div>
            </div>
            <div className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
              macro.dow_jones.change_pct >= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
            }`}>
              {macro.dow_jones.change_pct >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              <span>{macro.dow_jones.change_pct >= 0 ? '+' : ''}{macro.dow_jones.change_pct.toFixed(2)}%</span>
            </div>
          </div>

          {/* India VIX */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">India VIX</span>
              <div className="text-lg font-extrabold text-white mt-0.5">
                {macro.india_vix.price ? macro.india_vix.price.toFixed(2) : '--'}
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{macro.india_vix.status}</p>
            </div>
            <div className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
              macro.india_vix.change_pct <= 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
            }`}>
              <span>{macro.india_vix.change_pct >= 0 ? '+' : ''}{macro.india_vix.change_pct.toFixed(2)}%</span>
            </div>
          </div>

          {/* Macro Confluence Verdict */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-800/40 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider font-mono">Macro Confluence</span>
            <div className="text-xs font-extrabold text-white mt-1 leading-snug">
              {macro.macro_verdict}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                US Stance: {macro.us_trend}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Date-Wise Selector Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>DATE-WISE SURGE SIGNALS</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Select a date to view current or historical surges
          </span>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setSelectedDate('TODAY')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center space-x-1.5 ${
              selectedDate === 'TODAY'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 border border-amber-400/50'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Today's Surges</span>
          </button>

          {availableDates.map((d: any) => {
            const isSelected = selectedDate === d.date;
            return (
              <button
                key={d.date}
                onClick={() => setSelectedDate(d.date)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 border border-blue-400/50'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                <span>{d.label}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950/60 text-slate-300 font-mono">
                  {d.count}
                </span>
              </button>
            );
          })}

          <button
            onClick={() => setSelectedDate('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center space-x-1.5 ${
              selectedDate === 'ALL'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 border border-purple-400/50'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-300" />
            <span>All Dates (History)</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs (CE, PE, HOT) */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setFilterType('ALL')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
            filterType === 'ALL'
              ? 'bg-blue-600 text-white shadow'
              : 'bg-slate-800/60 text-slate-400 hover:text-white'
          }`}
        >
          All Signals ({suggestions.length})
        </button>
        <button
          onClick={() => setFilterType('HOT')}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
            filterType === 'HOT'
              ? 'bg-amber-600 text-white shadow'
              : 'bg-slate-800/60 text-slate-400 hover:text-white'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-amber-300" />
          <span>High Momentum ({hotCount})</span>
        </button>
        <button
          onClick={() => setFilterType('CE')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
            filterType === 'CE'
              ? 'bg-emerald-600 text-white shadow'
              : 'bg-slate-800/60 text-slate-400 hover:text-white'
          }`}
        >
          Calls Only ({ceCount})
        </button>
        <button
          onClick={() => setFilterType('PE')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
            filterType === 'PE'
              ? 'bg-rose-600 text-white shadow'
              : 'bg-slate-800/60 text-slate-400 hover:text-white'
          }`}
        >
          Puts Only ({peCount})
        </button>
      </div>

      {/* Suggestions List */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 font-mono space-y-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p>Scanning index options for sudden 10% - 20%+ movement & Greeks...</p>
        </div>
      ) : filteredSuggestions.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800 font-mono space-y-2">
          <AlertCircle className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm">No sudden momentum surges found for selected date.</p>
          <p className="text-xs text-slate-600">Try switching to another date or 'All Dates' to view historical surge records.</p>
          <div className="pt-2 text-left inline-block text-[11px] text-slate-400 space-y-1">
            {(data?.scan_diagnostics || []).map((d) => (
              <div key={d.symbol}>
                <span className="text-slate-300 font-bold">{d.symbol}:</span> {d.reason}
              </div>
            ))}
          </div>
        </div>
      ) : selectedDate === 'ALL' ? (
        /* Grouped by Date View */
        <div className="space-y-8">
          {Object.entries(groupedByDate).map(([dateKey, items]: [string, any]) => {
            const dateFiltered = items.filter((s: any) => {
              if (filterType === 'CE') return s.option_type === 'CE';
              if (filterType === 'PE') return s.option_type === 'PE';
              if (filterType === 'HOT') return s.is_hot || s.surge_pct >= 15;
              return true;
            });
            if (dateFiltered.length === 0) return null;

            return (
              <div key={dateKey} className="space-y-4">
                <div className="flex items-center space-x-3 pb-2 border-b border-slate-800">
                  <div className="px-3 py-1 rounded-lg bg-slate-800 text-amber-300 font-mono text-xs font-extrabold flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>📅 {dateFiltered[0]?.detected_date_label || dateKey}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {dateFiltered.length} Surge Signals
                  </span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {dateFiltered.map(renderCard)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Standard Single Date Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredSuggestions.map(renderCard)}
        </div>
      )}
    </div>
  );
};
