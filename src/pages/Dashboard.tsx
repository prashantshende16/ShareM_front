import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  MoveHorizontal,
  ShieldCheck,
  PlusCircle,
  Clock,
  ArrowRight,
  BarChart3,
  Search,
  Activity
} from 'lucide-react';
import { api } from '../services/api';
import { ConfidenceMeter } from '../components/ConfidenceMeter';
import { LiveMarketTicker } from '../components/LiveMarketTicker';

export const Dashboard: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.getStats(),
  });

  const { data: analyses, isLoading: analysesLoading } = useQuery({
    queryKey: ['recent-analyses'],
    queryFn: () => api.getAnalyses({}),
  });

  return (
    <div className="space-y-8">
      {/* Live Global Ticker & Sector Drivers */}
      <LiveMarketTicker />

      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/50 border border-blue-900/30 p-8 relative overflow-hidden shadow-2xl">
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center space-x-2 bg-blue-900/50 text-blue-300 text-xs px-3 py-1 rounded-full border border-blue-800 font-mono">
            <Activity className="w-3.5 h-3.5" />
            <span>F&O Technical Vision Engine</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            AI-Assisted Futures & Options Screenshot Analysis
          </h1>
          <p className="text-gray-300 text-sm leading-relaxed">
            Upload market charts across multiple timeframes to generate structured probabilistic scenarios, support/resistance ladders, and risk/reward setups.
          </p>
          <div className="pt-2 flex items-center space-x-4">
            <Link
              to="/new"
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/30 active:scale-95 text-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Analysis</span>
            </Link>
            <Link
              to="/history"
              className="inline-flex items-center space-x-2 bg-gray-800/80 hover:bg-gray-800 text-gray-200 font-medium px-4 py-2.5 rounded-xl border border-gray-700 text-sm transition-colors"
            >
              <span>View History</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Top KPI Cards (Section 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Analyses */}
        <div className="bg-[#111827] border border-gray-800 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold">Total Analyses</span>
            <BarChart3 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {statsLoading ? '...' : stats?.total_analyses ?? 0}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Processed chart evaluations</p>
        </div>

        {/* Bullish Scenarios */}
        <div className="bg-[#111827] border border-gray-800 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold">Bullish Scenarios</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {statsLoading ? '...' : stats?.bullish_scenarios ?? 0}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Primary upward setups</p>
        </div>

        {/* Bearish Scenarios */}
        <div className="bg-[#111827] border border-gray-800 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold">Bearish Scenarios</span>
            <TrendingDown className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-red-400">
            {statsLoading ? '...' : stats?.bearish_scenarios ?? 0}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Primary downward setups</p>
        </div>

        {/* Sideways Scenarios */}
        <div className="bg-[#111827] border border-gray-800 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold">Sideways Scenarios</span>
            <MoveHorizontal className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {statsLoading ? '...' : stats?.sideways_scenarios ?? 0}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Range-bound structures</p>
        </div>

        {/* High Confidence Analyses */}
        <div className="bg-[#111827] border border-gray-800 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-semibold">High Confidence</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-400">
            {statsLoading ? '...' : stats?.high_confidence_analyses ?? 0}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">&ge; 70% Confluence score</p>
        </div>
      </div>

      {/* Recent Analyses Section (Section 4) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-100">Recent Analyses</h2>
            <p className="text-xs text-gray-400">Latest multi-timeframe chart evaluations</p>
          </div>
          <Link
            to="/history"
            className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {analysesLoading ? (
          <div className="p-12 text-center text-gray-400 bg-[#111827] rounded-2xl border border-gray-800">
            Loading recent analyses...
          </div>
        ) : !analyses || analyses.length === 0 ? (
          <div className="p-12 text-center bg-[#111827] rounded-3xl border border-gray-800 space-y-4">
            <div className="w-12 h-12 rounded-full bg-blue-900/30 text-blue-400 flex items-center justify-center mx-auto">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-200">No analyses created yet</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Upload your first NIFTY, BANKNIFTY, or stock options chart screenshot to get started.
            </p>
            <Link
              to="/new"
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-xl text-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Analysis</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {analyses.slice(0, 6).map((item) => {
              const res = item.result;
              const primaryBias = res?.primary_scenario?.toLowerCase() || 'neutral';
              const isBull = primaryBias.includes('bull');
              const isBear = primaryBias.includes('bear');
              const tf = item.screenshots[0]?.timeframe || '15 Min';
              const cmp = item.current_price;

              return (
                <Link
                  key={item.id}
                  to={`/analyses/${item.id}`}
                  className="bg-[#111827] hover:bg-[#151f33] rounded-2xl border border-gray-800 hover:border-gray-700 p-5 transition-all duration-200 flex flex-col justify-between group shadow-lg"
                >
                  <div>
                    {/* Top row */}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-base font-bold text-gray-100 group-hover:text-blue-400 transition-colors">
                          {item.symbol}
                        </span>
                        <span className="ml-2 text-[10px] font-mono bg-gray-800 text-gray-300 px-2 py-0.5 rounded">
                          {item.instrument_type}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-400 flex items-center space-x-1 font-mono">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>
                    </div>

                    {/* Scenario Badge + Confidence */}
                    <div className="flex items-center justify-between my-3 bg-gray-900/60 p-3 rounded-xl border border-gray-800/80">
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-medium">Primary Scenario</span>
                        <span
                          className={`text-sm font-bold uppercase ${
                            isBull ? 'text-emerald-400' : isBear ? 'text-red-400' : 'text-amber-400'
                          }`}
                        >
                          {res?.primary_scenario || 'Pending'}
                        </span>
                      </div>
                      {res && (
                        <div className="text-right">
                          <span className="text-xs text-gray-400 block">Confidence</span>
                          <span className="text-base font-mono font-bold text-white">
                            {res.confidence_score}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Metadata Specs */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 pt-1">
                      <div>
                        <span>Timeframe: </span>
                        <strong className="text-gray-200">{tf}</strong>
                      </div>
                      <div>
                        <span>CMP: </span>
                        <strong className="text-gray-200 font-mono">
                          {cmp ? cmp.toLocaleString('en-IN') : 'N/A'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs">
                    <span className="text-gray-400">
                      Risk: <strong className="text-gray-200">{res?.risk_analysis?.risk_level || 'Medium'}</strong>
                    </span>
                    <span className="text-blue-400 font-medium group-hover:translate-x-1 transition-transform flex items-center space-x-1">
                      <span>View Analysis</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
