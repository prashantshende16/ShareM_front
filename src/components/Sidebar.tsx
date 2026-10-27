import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Zap,
  PlusCircle,
  History,
  GitCompare,
  ListOrdered,
  Settings as SettingsIcon,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export const Sidebar: React.FC = () => {
  const { data: surgeData } = useQuery({
    queryKey: ['surge-radar'],
    queryFn: () => api.getSurgeRadar(),
    refetchInterval: 6000,
  });

  const hotCount = surgeData?.suggestions?.filter((s: any) => s.is_hot || s.surge_pct >= 15)?.length || 0;

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/surge-radar', label: 'Surge Radar', icon: Zap, badge: hotCount > 0 ? `${hotCount} Hot` : undefined },
    { to: '/new', label: 'New Analysis', icon: PlusCircle },
    { to: '/history', label: 'Analysis History', icon: History },
    { to: '/compare', label: 'Compare Analyses', icon: GitCompare },
    { to: '/watchlist', label: 'Watchlist', icon: ListOrdered },
    { to: '/settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <aside className="w-64 bg-[#0d1322] border-r border-gray-800/80 flex flex-col justify-between p-4 shrink-0">
      <div className="space-y-6">
        <div className="px-2">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider font-mono">Navigation</p>
        </div>
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <div className="flex items-center justify-between flex-1">
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </div>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Prominent Educational Disclaimer in Sidebar */}
      <div className="p-3 bg-gray-900/90 rounded-xl border border-gray-800 text-[11px] text-gray-400 space-y-2">
        <div className="flex items-center space-x-1.5 text-amber-400 font-semibold">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Probabilistic Rule</span>
        </div>
        <p className="leading-relaxed text-gray-400">
          This system produces strictly probability-based technical scenarios. Future market movement is never guaranteed. Always practice strict risk management.
        </p>
      </div>
    </aside>
  );
};
