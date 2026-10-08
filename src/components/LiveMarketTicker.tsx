import React, { useEffect, useState } from 'react';
import {
  Globe2,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Layers,
  Building2
} from 'lucide-react';
import { api } from '../services/api';
import { LiveMarketOverviewResponse, LiveIndexOverview, HeavyweightStock } from '../types';

export const LiveMarketTicker: React.FC = () => {
  const [data, setData] = useState<LiveMarketOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'global' | 'heavyweights' | 'incidents'>('global');

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await api.getLiveOverview();
      setData(res);
    } catch (err) {
      console.error('Failed to load live overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 60000); // 1 minute auto-refresh
    return () => clearInterval(interval);
  }, []);

  const sentimentColor = (sentiment?: string) => {
    if (!sentiment) return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    if (sentiment.toLowerCase().includes('bullish')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (sentiment.toLowerCase().includes('bearish')) return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  };

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5 mb-8 shadow-xl relative overflow-hidden">
      {/* Background glow accent */}
      <div className="absolute top-0 right-0 w-80 h-32 bg-blue-500/5 rounded-full blur-3xl -z-0 pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
            <Globe2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-100">Live Global Market Cues & Sector Drivers</h2>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Real-time world indices, Nifty heavyweight impact, and macro news feeding into AI scenarios
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {data?.global_sentiment && (
            <span className={`text-xs px-3 py-1 rounded-full font-medium border flex items-center gap-1.5 ${sentimentColor(data.global_sentiment)}`}>
              <Activity className="w-3.5 h-3.5" />
              World Mood: {data.global_sentiment}
            </span>
          )}
          <button
            onClick={fetchOverview}
            disabled={loading}
            className="p-2 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors border border-gray-700"
            title="Refresh Live Market Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('global')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'global'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'text-gray-400 hover:text-gray-200 bg-gray-800/40 hover:bg-gray-800'
          }`}
        >
          <Globe2 className="w-3.5 h-3.5" />
          World Indices ({data?.indices?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('heavyweights')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'heavyweights'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'text-gray-400 hover:text-gray-200 bg-gray-800/40 hover:bg-gray-800'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          Nifty 50 Top Heavyweights ({data?.heavyweights?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('incidents')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'incidents'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'text-gray-400 hover:text-gray-200 bg-gray-800/40 hover:bg-gray-800'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          Market Incidents & Drivers
        </button>
      </div>

      {/* Tab 1: Global Indices */}
      {activeTab === 'global' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {data?.indices?.map((idx) => {
            const isPos = idx.change_pct >= 0;
            return (
              <div
                key={idx.symbol}
                className="bg-[#1e293b]/70 border border-gray-800 rounded-xl p-3 hover:border-gray-700 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium text-gray-400 truncate" title={idx.name}>
                    {idx.name}
                  </span>
                  <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-gray-800 text-gray-500">
                    {idx.region}
                  </span>
                </div>
                <div className="text-sm font-bold font-mono text-gray-100">
                  {idx.price.toLocaleString()}
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium mt-1 ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>{isPos ? `+${idx.change_pct}%` : `${idx.change_pct}%`}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Heavyweights Heatmap */}
      {activeTab === 'heavyweights' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {data?.heavyweights?.map((stock) => {
            const isPos = stock.change_pct >= 0;
            return (
              <div
                key={stock.symbol}
                className="bg-[#1e293b]/70 border border-gray-800 rounded-xl p-3 hover:border-gray-700 transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-gray-200 truncate">{stock.name}</span>
                  <span className="text-[10px] text-blue-400 font-mono bg-blue-500/10 px-1.5 py-0.5 rounded">
                    {stock.weight}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-gray-100">₹{stock.price}</span>
                    <span className="text-[10px] text-gray-500 ml-1.5">({stock.sector})</span>
                  </div>
                  <div className={`text-xs font-medium font-mono ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isPos ? `+${stock.change_pct}%` : `${stock.change_pct}%`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: Incidents & Drivers */}
      {activeTab === 'incidents' && (
        <div className="space-y-2">
          {data?.recent_incidents?.length ? (
            data.recent_incidents.map((inc, i) => (
              <div
                key={i}
                className="flex items-start justify-between gap-3 p-3 bg-[#1e293b]/50 border border-gray-800/80 rounded-xl hover:bg-[#1e293b] transition-all"
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-xs font-mono text-gray-500 mt-0.5">0{i + 1}</span>
                  <div>
                    <p className="text-xs font-medium text-gray-200 leading-relaxed">{inc.title}</p>
                    <span className="text-[10px] text-gray-500 mt-1 block">{inc.date}</span>
                  </div>
                </div>
                {inc.url && (
                  <a
                    href={inc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-blue-400 p-1"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ))
          ) : (
            <div className="text-xs text-gray-500 p-4 text-center">No major market alert feeds found.</div>
          )}
        </div>
      )}
    </div>
  );
};

