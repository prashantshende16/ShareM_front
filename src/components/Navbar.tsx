import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TrendingUp, PlusCircle, Settings, Bell, Zap, X, ChevronRight, Flame } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['settings-status'],
    queryFn: () => api.getSettings(),
    staleTime: 60000,
  });

  const { data: trades } = useQuery({
    queryKey: ['navbar-active-trades'],
    queryFn: () => api.getTrades(),
    refetchInterval: 3500,
  });

  const { data: surgeData } = useQuery({
    queryKey: ['surge-radar'],
    queryFn: () => api.getSurgeRadar(),
    refetchInterval: 5000,
  });

  const resetNotifMutation = useMutation({
    mutationFn: () => api.resetSurgeNotifications(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surge-radar'] });
    },
  });

  const activeTrades = trades?.filter((t) => t.status === 'ACTIVE' || t.status === 'TARGET_1_BOOKED') || [];
  const totalUnrealized = activeTrades.reduce((acc, t) => acc + (t.unrealized_pnl || 0), 0);
  const totalRealized = trades?.reduce((acc, t) => acc + (t.realized_pnl || 0), 0) || 0;

  const isConnected = settings?.market_data_connected ?? true;
  const unreadAlerts = surgeData?.unread_alerts_count || 0;
  const topSurges = surgeData?.suggestions?.slice(0, 4) || [];

  return (
    <header className="h-16 bg-[#0f172a] border-b border-gray-800 px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center space-x-3">
        <Link to="/" className="flex items-center space-x-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-lg text-white tracking-tight">F&O ANALYZER</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-blue-900/60 text-blue-400 px-1.5 py-0.5 rounded border border-blue-800">
                PROBABILISTIC AI
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-mono -mt-0.5">NSE/BSE Futures & Options Vision Engine</p>
          </div>
        </Link>
      </div>

      <div className="flex items-center space-x-3 relative">
        {/* Dynamic Market Data status pill */}
        <div className="hidden lg:flex items-center space-x-2 bg-gray-900/80 px-3 py-1.5 rounded-full border border-gray-800 text-xs">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></span>
          <span className="text-gray-400">Market Data:</span>
          <span className={`font-medium ${isConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isConnected ? 'Live Feed Connected' : 'Not Connected (Vision Mode)'}
          </span>
        </div>

        {/* Live Positions & PnL Header Pill */}
        {trades && trades.length > 0 && (
          <button
            onClick={() => {
              const el = document.getElementById('active-trades-section');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              } else {
                window.location.href = '/#active-trades-section';
              }
            }}
            className="flex items-center space-x-2 bg-slate-900/90 hover:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 hover:border-slate-500 text-xs font-mono transition shadow-lg cursor-pointer"
            title="Click to jump to your trade positions & realized history"
          >
            {activeTrades.length > 0 ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-white font-bold">{activeTrades.length} Active</span>
                <span className={totalUnrealized >= 0 ? "text-emerald-400 font-extrabold" : "text-rose-400 font-extrabold"}>
                  {totalUnrealized >= 0 ? '+' : ''}₹{totalUnrealized.toLocaleString('en-IN')}
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-slate-300 font-bold">Positions ({trades.length})</span>
                <span className={totalRealized >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {totalRealized >= 0 ? '+' : ''}₹{totalRealized.toLocaleString('en-IN')}
                </span>
              </>
            )}
          </button>
        )}

        {/* 🔔 Notification Icon with Surge Badge */}
        <div className="relative">
          <button
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              if (!isNotifOpen && unreadAlerts > 0) {
                resetNotifMutation.mutate();
              }
            }}
            className={`relative p-2 rounded-lg border transition-colors ${
              isNotifOpen
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
            title="Surge & Momentum Trade Alerts"
          >
            <Bell className="w-5 h-5" />
            {unreadAlerts > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-rose-600 text-white text-[10px] font-black border-2 border-[#0f172a] animate-bounce">
                {unreadAlerts}
              </span>
            )}
          </button>

          {/* Floating Notification Dropdown */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-4 z-50 animate-fade-in font-sans">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Sudden 10% - 20%+ Surge Alerts
                  </span>
                </div>
                <button
                  onClick={() => setIsNotifOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-2 space-y-2.5 max-h-72 overflow-y-auto">
                {topSurges.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500 font-mono">
                    No sudden surges detected right now. Scanning every 5s...
                  </div>
                ) : (
                  topSurges.map((sugg) => (
                    <Link
                      key={sugg.id}
                      to="/surge-radar"
                      onClick={() => setIsNotifOpen(false)}
                      className="block p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{sugg.symbol}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          {sugg.surge_badge}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 font-mono mt-0.5">
                        {sugg.contract_name}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-1.5">
                        <span>LTP: ₹{sugg.current_ltp} • Entry: ₹{sugg.entry_price}</span>
                        <span className="text-sky-400 font-bold">Δ {sugg.delta}</span>
                      </div>
                    </Link>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <Link
                  to="/surge-radar"
                  onClick={() => setIsNotifOpen(false)}
                  className="flex items-center space-x-1 text-sky-400 hover:text-sky-300 font-bold font-mono"
                >
                  <span>Open Full Surge Radar</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
                <span className="text-[10px] text-slate-500 font-mono">Auto 5s Refresh</span>
              </div>
            </div>
          )}
        </div>

        <Link
          to="/new"
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg transition-all shadow-md shadow-blue-600/20 text-sm active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Analysis</span>
        </Link>

        <Link
          to="/settings"
          className={`p-2 rounded-lg border transition-colors ${
            location.pathname === '/settings'
              ? 'bg-blue-600/20 border-blue-500/50 text-blue-400'
              : 'border-gray-800 text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </Link>
      </div>
    </header>
  );
};
