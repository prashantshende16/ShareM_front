import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TrendingUp, PlusCircle, Settings } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export const Navbar: React.FC = () => {
  const location = useLocation();

  const { data: settings } = useQuery({
    queryKey: ['settings-status'],
    queryFn: () => api.getSettings(),
    staleTime: 60000,
  });

  const isConnected = settings?.market_data_connected ?? true;

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

      <div className="flex items-center space-x-4">
        {/* Dynamic Market Data status pill */}
        <div className="hidden md:flex items-center space-x-2 bg-gray-900/80 px-3 py-1.5 rounded-full border border-gray-800 text-xs">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></span>
          <span className="text-gray-400">Market Data:</span>
          <span className={`font-medium ${isConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isConnected ? 'Live Feed Connected' : 'Not Connected (Vision Mode)'}
          </span>
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
