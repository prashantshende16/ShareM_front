import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Trash2,
  ExternalLink,
  GitCompare,
  TrendingUp,
  TrendingDown,
  MoveHorizontal,
  Calendar,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { api } from '../services/api';

export const AnalysisHistory: React.FC = () => {
  const queryClient = useQueryClient();

  const [symbolFilter, setSymbolFilter] = useState('');
  const [marketFilter, setMarketFilter] = useState('');
  const [biasFilter, setBiasFilter] = useState('');
  const [minConfidence, setMinConfidence] = useState<number | ''>('');

  const { data: analyses, isLoading } = useQuery({
    queryKey: ['analyses-history', symbolFilter, marketFilter, biasFilter, minConfidence],
    queryFn: () =>
      api.getAnalyses({
        symbol: symbolFilter || undefined,
        market: marketFilter || undefined,
        bias: biasFilter || undefined,
        min_confidence: minConfidence !== '' ? Number(minConfidence) : undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteAnalysis(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analyses-history'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['recent-analyses'] });
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => api.deleteAllAnalyses(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['analyses-history'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['recent-analyses'] });
      alert(data.message || 'All analyses deleted successfully');
    },
  });

  const handleDelete = (id: number, symbol: string) => {
    if (window.confirm(`Are you sure you want to delete analysis for ${symbol} (#${id})?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleDeleteAll = () => {
    if (window.confirm('Are you sure you want to delete ALL past analysis records? This action cannot be undone.')) {
      deleteAllMutation.mutate();
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Analysis History</h1>
          <p className="text-sm text-gray-400 mt-1">
            Review, filter, compare, and manage past F&O chart evaluations.
          </p>
        </div>
        {analyses && analyses.length > 0 && (
          <button
            onClick={handleDeleteAll}
            disabled={deleteAllMutation.isPending}
            className="inline-flex items-center space-x-2 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-500/50 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-md shadow-red-950/40 active:scale-95"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
            <span>{deleteAllMutation.isPending ? 'Deleting All...' : 'Delete All Records'}</span>
          </button>
        )}
      </div>

      {/* Filters (Section 24) */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center space-x-2 text-xs font-semibold text-gray-300">
          <Filter className="w-4 h-4 text-blue-400" />
          <span>Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Symbol Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
            <input
              type="text"
              value={symbolFilter}
              onChange={(e) => setSymbolFilter(e.target.value)}
              placeholder="Search symbol (e.g. NIFTY)"
              className="w-full bg-[#1e293b] border border-gray-700 rounded-xl pl-9 pr-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          {/* Market Filter */}
          <div>
            <select
              value={marketFilter}
              onChange={(e) => setMarketFilter(e.target.value)}
              className="w-full bg-[#1e293b] border border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Markets</option>
              <option value="NIFTY">NIFTY</option>
              <option value="BANKNIFTY">BANKNIFTY</option>
              <option value="FINNIFTY">FINNIFTY</option>
              <option value="SENSEX">SENSEX</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Bias Filter */}
          <div>
            <select
              value={biasFilter}
              onChange={(e) => setBiasFilter(e.target.value)}
              className="w-full bg-[#1e293b] border border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Scenarios / Biases</option>
              <option value="bullish">Bullish</option>
              <option value="bearish">Bearish</option>
              <option value="sideways">Sideways</option>
            </select>
          </div>

          {/* Minimum Confidence */}
          <div>
            <input
              type="number"
              value={minConfidence}
              onChange={(e) => setMinConfidence(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Min Confidence % (e.g. 70)"
              className="w-full bg-[#1e293b] border border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-100 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#0f172a] text-gray-400 uppercase text-[11px] font-mono border-b border-gray-800">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Date & Time</th>
                <th className="px-5 py-3.5 font-semibold">Instrument</th>
                <th className="px-5 py-3.5 font-semibold">Timeframe</th>
                <th className="px-5 py-3.5 font-semibold">Primary Bias</th>
                <th className="px-5 py-3.5 font-semibold">Confidence</th>
                <th className="px-5 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/80">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                    Loading history...
                  </td>
                </tr>
              ) : !analyses || analyses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-400">
                    No analyses match the current filter criteria.
                  </td>
                </tr>
              ) : (
                analyses.map((a) => {
                  const res = a.result;
                  const bias = res?.primary_scenario?.toLowerCase() || 'pending';
                  const isBull = bias.includes('bull');
                  const isBear = bias.includes('bear');
                  const tf = a.screenshots[0]?.timeframe || '15 Min';

                  return (
                    <tr key={a.id} className="hover:bg-gray-800/40 transition-colors">
                      {/* Date */}
                      <td className="px-5 py-4 font-mono text-gray-400 whitespace-nowrap">
                        {new Date(a.created_at).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        {new Date(a.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Instrument */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-bold text-gray-100 text-sm font-mono">{a.symbol}</div>
                        <div className="text-[10px] text-gray-400 font-mono">
                          {a.market} • {a.instrument_type}
                        </div>
                      </td>

                      {/* Timeframe */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-mono bg-gray-900 px-2 py-0.5 rounded border border-gray-800 text-gray-300">
                          {tf}
                        </span>
                        {a.screenshots.length > 1 && (
                          <span className="ml-1 text-[10px] text-blue-400 font-mono">
                            +{a.screenshots.length - 1}
                          </span>
                        )}
                      </td>

                      {/* Primary Bias */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {res ? (
                          <span
                            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase ${
                              isBull
                                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                                : isBear
                                ? 'bg-red-950/80 text-red-400 border border-red-800'
                                : 'bg-amber-950/80 text-amber-400 border border-amber-800'
                            }`}
                          >
                            {isBull ? <TrendingUp className="w-3 h-3" /> : isBear ? <TrendingDown className="w-3 h-3" /> : <MoveHorizontal className="w-3 h-3" />}
                            <span>{res.primary_scenario}</span>
                          </span>
                        ) : (
                          <span className="text-gray-500 font-mono">Pending</span>
                        )}
                      </td>

                      {/* Confidence */}
                      <td className="px-5 py-4 whitespace-nowrap font-mono font-bold">
                        {res ? (
                          <span className={res.confidence_score >= 70 ? 'text-emerald-400' : 'text-amber-400'}>
                            {res.confidence_score}%
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                            a.status === 'completed'
                              ? 'bg-emerald-950 text-emerald-400'
                              : a.status === 'analyzing'
                              ? 'bg-blue-950 text-blue-400 animate-pulse'
                              : a.status === 'failed'
                              ? 'bg-red-950 text-red-400'
                              : 'bg-gray-800 text-gray-400'
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 whitespace-nowrap text-right space-x-2">
                        <Link
                          to={`/analyses/${a.id}`}
                          className="inline-flex items-center space-x-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/40 px-2.5 py-1 rounded-lg transition-colors font-medium text-xs"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>

                        <button
                          onClick={() => handleDelete(a.id, a.symbol)}
                          disabled={deleteMutation.isPending}
                          className="inline-flex items-center space-x-1.5 bg-red-950/60 hover:bg-red-900/80 text-red-300 hover:text-white border border-red-500/60 hover:border-red-400 px-3 py-1 rounded-lg transition-all font-semibold text-xs shadow-sm hover:shadow-red-950/50 active:scale-95 ml-2"
                          title="Delete this analysis record"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
