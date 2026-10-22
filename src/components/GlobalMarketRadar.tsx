import React, { useEffect, useState } from 'react';
import {
  Globe2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Flame,
  Clock,
  Newspaper,
  Compass,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { api } from '../services/api';
import { GlobalRadarData } from '../types';

export const GlobalMarketRadar: React.FC = () => {
  const [radar, setRadar] = useState<GlobalRadarData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRadar = async () => {
    try {
      setLoading(true);
      const res = await api.getGlobalRadar();
      setRadar(res.data);
    } catch (err) {
      console.error('Failed to load global market radar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRadar();
    const interval = setInterval(fetchRadar, 60000); // 1 min auto-refresh
    return () => clearInterval(interval);
  }, []);

  if (!radar && loading) {
    return (
      <div className="bg-[#111827] border border-gray-800 rounded-3xl p-6 animate-pulse text-center text-gray-500 text-xs">
        Loading Global Market Radar (US, UK/Europe, Crude Oil & News)...
      </div>
    );
  }

  if (!radar) return null;

  const isRiskOn = radar.global_score > 20;
  const isRiskOff = radar.global_score < -20;

  return (
    <div className="bg-[#0f172a]/90 border border-gray-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <Globe2 className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white tracking-wide">
                Global Market Radar & Live News Tally
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold uppercase">
                US • UK • Asia • Crude
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Live macro catalysts tracking Dow, Nasdaq, FTSE 100, DAX, Crude Oil, and breaking Indian market headlines
            </p>
          </div>
        </div>

        <button
          onClick={fetchRadar}
          disabled={loading}
          className="p-2 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-300 transition-colors border border-gray-700 flex items-center gap-1.5 text-xs font-semibold"
          title="Refresh Global Radar"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          <span className="hidden sm:inline">Refresh World Data</span>
        </button>
      </div>

      {/* Global Macro Verdict Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-5">
        <div className={`p-3.5 rounded-2xl border ${
          isRiskOn
            ? 'bg-emerald-950/40 border-emerald-500/40'
            : isRiskOff
            ? 'bg-rose-950/40 border-rose-500/40'
            : 'bg-slate-900/60 border-gray-800'
        }`}>
          <span className="text-[10px] uppercase font-mono text-gray-400 block mb-1">Global Stance</span>
          <div className="flex items-center gap-2">
            <Compass className={`w-4 h-4 ${isRiskOn ? 'text-emerald-400' : isRiskOff ? 'text-rose-400' : 'text-amber-400'}`} />
            <strong className={`text-xs font-black truncate ${isRiskOn ? 'text-emerald-300' : isRiskOff ? 'text-rose-300' : 'text-gray-200'}`}>
              {radar.global_verdict}
            </strong>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-gray-900/60 border border-gray-800">
          <span className="text-[10px] uppercase font-mono text-gray-400 block mb-1">US Markets Stance</span>
          <div className="flex items-center justify-between">
            <strong className={`text-xs font-black ${
              radar.us_market_stance === 'Bullish' ? 'text-emerald-400' : radar.us_market_stance === 'Bearish' ? 'text-rose-400' : 'text-gray-300'
            }`}>
              {radar.us_market_stance}
            </strong>
            <span className="text-[11px] font-mono font-bold text-gray-400">
              {radar.us_avg_change > 0 ? `+${radar.us_avg_change}%` : `${radar.us_avg_change}%`}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-gray-900/60 border border-gray-800">
          <span className="text-[10px] uppercase font-mono text-gray-400 block mb-1">UK & Europe Stance</span>
          <div className="flex items-center justify-between">
            <strong className={`text-xs font-black ${
              radar.uk_market_stance === 'Bullish' ? 'text-emerald-400' : radar.uk_market_stance === 'Bearish' ? 'text-rose-400' : 'text-gray-300'
            }`}>
              {radar.uk_market_stance}
            </strong>
            <span className="text-[11px] font-mono font-bold text-gray-400">
              {radar.uk_avg_change > 0 ? `+${radar.uk_avg_change}%` : `${radar.uk_avg_change}%`}
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-gray-900/60 border border-gray-800">
          <span className="text-[10px] uppercase font-mono text-gray-400 block mb-1">Crude Oil (WTI)</span>
          <div className="flex items-center gap-2">
            <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px] font-mono text-gray-300 truncate">
              {radar.crude_oil_status}
            </span>
          </div>
        </div>
      </div>

      {/* World Indices Grid */}
      <div className="mb-5">
        <h4 className="text-[11px] font-mono uppercase text-gray-400 font-bold mb-2.5">
          Major Indices & Drivers (US, UK, Asia, Commodities)
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {[
            ...radar.us_indices,
            ...radar.uk_europe_indices,
            ...radar.commodities_and_forex
          ].map((item) => {
            const isPos = item.change_pct > 0;
            const isZero = item.change_pct === 0;

            return (
              <div
                key={item.symbol}
                className="p-2.5 rounded-xl bg-gray-900/80 border border-gray-800/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                    <span className="font-bold text-gray-300 truncate">{item.name}</span>
                    <span className="font-mono text-[9px] text-gray-500">{item.region}</span>
                  </div>
                  <div className="text-xs font-mono font-bold text-white">
                    {item.price > 1000 ? item.price.toLocaleString() : item.price}
                  </div>
                </div>

                <div className={`mt-1.5 flex items-center justify-between text-[10px] font-mono font-bold ${
                  isPos ? 'text-emerald-400' : isZero ? 'text-gray-400' : 'text-rose-400'
                }`}>
                  <span className="flex items-center">
                    {isPos ? <ArrowUpRight className="w-3 h-3" /> : isZero ? <Minus className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    <span>{isPos ? `+${item.change_pct}%` : `${item.change_pct}%`}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Breaking News Tally */}
      {radar.news_tally && radar.news_tally.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-gray-950/70 border border-gray-800/90">
          <div className="flex items-center gap-2 mb-2">
            <Newspaper className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-white uppercase font-mono tracking-wide">
              Live News Tally at Current Timing
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {radar.news_tally.slice(0, 4).map((n, i) => (
              <a
                key={i}
                href={n.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-gray-900/60 hover:bg-gray-800/70 border border-gray-800 flex items-start gap-2 text-gray-300 hover:text-white transition-all group"
              >
                <Clock className="w-3.5 h-3.5 text-gray-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-xs leading-snug line-clamp-2 group-hover:text-cyan-300">
                    {n.title}
                  </div>
                  {n.date && (
                    <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                      {n.date}
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

