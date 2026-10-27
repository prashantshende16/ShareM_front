import React, { useState } from 'react';
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
  ArrowDownRight
} from 'lucide-react';
import { api } from '../services/api';

export const SurgeRadarPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<'ALL' | 'CE' | 'PE' | 'HOT'>('ALL');
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['surge-radar'],
    queryFn: () => api.getSurgeRadar(),
    refetchInterval: 5000, // Poll every 5s for rapid momentum tracking
  });

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
  const suggestions = data?.suggestions || [];

  const filteredSuggestions = suggestions.filter((s) => {
    if (filterType === 'CE') return s.option_type === 'CE';
    if (filterType === 'PE') return s.option_type === 'PE';
    if (filterType === 'HOT') return s.is_hot || s.surge_pct >= 15;
    return true;
  });

  const hotCount = suggestions.filter((s) => s.is_hot || s.surge_pct >= 15).length;
  const ceCount = suggestions.filter((s) => s.option_type === 'CE').length;
  const peCount = suggestions.filter((s) => s.option_type === 'PE').length;

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

      {/* Filter Tabs */}
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
          <p className="text-sm">No sudden momentum surges matching the current filter.</p>
          <p className="text-xs text-slate-600">The radar continuously scans every 5 seconds for new 10% - 20%+ price expansions.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredSuggestions.map((sugg) => {
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
                      <div className="flex items-center space-x-2">
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
                      </div>
                      <div className="text-xs font-bold text-slate-300 mt-1">
                        {sugg.contract_name}
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-1">
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
                    <span>{isExecuting ? 'Adding to Positions...' : '⚡ Add to Active Positions'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SurgeRadarPage;
