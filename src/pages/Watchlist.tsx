import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ListOrdered,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  MoveHorizontal,
  ExternalLink,
  PlusCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';

export const Watchlist: React.FC = () => {
  const queryClient = useQueryClient();
  const [newSymbol, setNewSymbol] = useState('');
  const [newMarket, setNewMarket] = useState('NSE');

  const { data: watchlist, isLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => api.getWatchlist(),
  });

  const addMutation = useMutation({
    mutationFn: ({ symbol, market }: { symbol: string; market: string }) =>
      api.addToWatchlist(symbol, market),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      setNewSymbol('');
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to add symbol');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => api.removeFromWatchlist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSymbol.trim()) {
      addMutation.mutate({ symbol: newSymbol.trim().toUpperCase(), market: newMarket });
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">F&O Instrument Watchlist</h1>
          <p className="text-sm text-gray-400 mt-1">
            Track key benchmark indices and high-liquidity stock derivatives with live analysis status.
          </p>
        </div>

        {/* Add custom symbol form */}
        <form onSubmit={handleAdd} className="flex items-center space-x-2">
          <input
            type="text"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            placeholder="Add symbol (e.g. HDFCBANK)"
            className="bg-[#1e293b] border border-gray-700 rounded-xl px-3.5 py-2 text-xs text-gray-100 focus:outline-none focus:border-blue-500 font-mono"
          />
          <button
            type="submit"
            disabled={!newSymbol.trim()}
            className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-xl text-xs font-semibold disabled:opacity-50 transition-colors"
            title="Add to Watchlist"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Grid of Watchlist Cards (Section 26) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {isLoading ? (
          <div className="col-span-3 p-12 text-center text-gray-400 bg-[#111827] rounded-2xl border border-gray-800">
            Loading watchlist...
          </div>
        ) : (
          watchlist?.map((item) => {
            const hasAnalysis = Boolean(item.last_analysis_id && item.last_bias !== 'N/A');
            const bias = (item.last_bias || '').toLowerCase();
            const isBull = bias.includes('bull');
            const isBear = bias.includes('bear');

            return (
              <div
                key={item.id}
                className="bg-[#111827] rounded-2xl border border-gray-800 hover:border-gray-700 p-5 shadow-lg flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-black text-gray-100 font-mono tracking-tight">
                        {item.symbol}
                      </h3>
                      <span className="text-[10px] font-mono text-gray-400">
                        Market: {item.market}
                      </span>
                    </div>

                    <button
                      onClick={() => removeMutation.mutate(item.id)}
                      className="text-gray-500 hover:text-red-400 p-1.5 rounded-lg transition-colors"
                      title="Remove from watchlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Status Box */}
                  <div className="bg-gray-900/60 p-3.5 rounded-xl border border-gray-800/80 my-2 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Last Primary Bias</span>
                      {hasAnalysis ? (
                        <span
                          className={`font-bold font-mono uppercase px-2 py-0.5 rounded text-[11px] ${
                            isBull
                              ? 'bg-emerald-950 text-emerald-400'
                              : isBear
                              ? 'bg-red-950 text-red-400'
                              : 'bg-amber-950 text-amber-400'
                          }`}
                        >
                          {item.last_bias}
                        </span>
                      ) : (
                        <span className="text-gray-500 font-mono text-xs">No analysis yet</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Confidence</span>
                      <span className="font-mono font-bold text-gray-200">
                        {item.last_confidence !== undefined && item.last_confidence !== null
                          ? `${item.last_confidence}%`
                          : '-'}
                      </span>
                    </div>

                    {item.last_timeframe && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Timeframe</span>
                        <span className="font-mono text-gray-300">{item.last_timeframe}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer action buttons */}
                <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-gray-500 font-mono flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      {item.last_updated
                        ? new Date(item.last_updated).toLocaleDateString()
                        : 'Not evaluated'}
                    </span>
                  </span>

                  <div className="flex items-center space-x-2">
                    {hasAnalysis && (
                      <Link
                        to={`/analyses/${item.last_analysis_id}`}
                        className="p-1.5 rounded-lg text-blue-400 hover:text-white bg-blue-950/40 border border-blue-900 hover:bg-blue-600 transition-colors"
                        title="View Last Analysis"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    )}
                    <Link
                      to={`/new?symbol=${encodeURIComponent(item.symbol)}`}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold transition-colors"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Analyze</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
