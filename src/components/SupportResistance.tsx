import React, { useState } from 'react';
import { Layers, Copy, Check, Info } from 'lucide-react';
import { SupportResistanceLevel } from '../types';

interface SupportResistanceProps {
  currentPrice?: number;
  supports: SupportResistanceLevel[];
  resistances: SupportResistanceLevel[];
}

export const SupportResistance: React.FC<SupportResistanceProps> = ({
  currentPrice,
  supports,
  resistances,
}) => {
  const [copiedPrice, setCopiedPrice] = useState<number | null>(null);

  const copyToClipboard = (price: number) => {
    navigator.clipboard.writeText(price.toString());
    setCopiedPrice(price);
    setTimeout(() => setCopiedPrice(null), 2000);
  };

  // Sort resistances descending so highest is on top
  const sortedResistances = [...resistances].sort((a, b) => b.price - a.price);
  // Sort supports descending so closest to CMP is on top
  const sortedSupports = [...supports].sort((a, b) => b.price - a.price);

  const cmp = currentPrice || (sortedSupports[0]?.price ? sortedSupports[0].price + 100 : 25000);

  return (
    <div className="bg-[#111827] rounded-2xl border border-gray-800 p-5 shadow-xl">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center space-x-2">
          <Layers className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-gray-100 text-base">Key Support & Resistance Ladder</h3>
        </div>
        <span className="text-xs text-gray-400 bg-gray-900 px-2.5 py-1 rounded-full border border-gray-800">
          Click any level to copy price
        </span>
      </div>

      <div className="space-y-2.5">
        {/* Resistances (Top) */}
        {sortedResistances.map((r, idx) => {
          const diff = cmp ? ((r.price - cmp) / cmp) * 100 : 0;
          return (
            <div
              key={`res-${idx}`}
              onClick={() => copyToClipboard(r.price)}
              className="group relative flex items-center justify-between p-3 rounded-xl bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 hover:border-red-500/60 transition-all cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50"></span>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-red-300">{r.label}</span>
                    {r.strength && (
                      <span className="text-[10px] bg-red-900/60 text-red-300 px-1.5 py-0.5 rounded border border-red-800">
                        {r.strength}
                      </span>
                    )}
                  </div>
                  {r.description && <p className="text-[11px] text-gray-400 mt-0.5">{r.description}</p>}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {cmp && (
                  <span className="text-xs font-mono text-red-400/80">
                    +{diff.toFixed(2)}%
                  </span>
                )}
                <div className="font-mono text-base font-bold text-red-200 bg-gray-900/80 px-3 py-1 rounded-lg border border-gray-800 flex items-center space-x-1.5">
                  <span>{r.price.toLocaleString('en-IN')}</span>
                  {copiedPrice === r.price ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300" />
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Current Market Price (Center Divider) */}
        <div className="my-3 p-3.5 rounded-xl bg-gradient-to-r from-blue-900/40 via-blue-800/30 to-blue-900/40 border border-blue-500/50 flex items-center justify-between shadow-lg shadow-blue-950/50">
          <div className="flex items-center space-x-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            <div>
              <span className="text-sm font-bold text-blue-200">Current Market Price (CMP)</span>
              <p className="text-[11px] text-blue-300/80">Reference baseline for pivots</p>
            </div>
          </div>
          <div className="font-mono text-lg font-extrabold text-blue-100 bg-blue-950/80 px-4 py-1.5 rounded-xl border border-blue-600/50 shadow-inner">
            {cmp.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Supports (Bottom) */}
        {sortedSupports.map((s, idx) => {
          const diff = cmp ? ((cmp - s.price) / cmp) * 100 : 0;
          return (
            <div
              key={`sup-${idx}`}
              onClick={() => copyToClipboard(s.price)}
              className="group relative flex items-center justify-between p-3 rounded-xl bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-900/30 hover:border-emerald-500/60 transition-all cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></span>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-emerald-300">{s.label}</span>
                    {s.strength && (
                      <span className="text-[10px] bg-emerald-900/60 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800">
                        {s.strength}
                      </span>
                    )}
                  </div>
                  {s.description && <p className="text-[11px] text-gray-400 mt-0.5">{s.description}</p>}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {cmp && (
                  <span className="text-xs font-mono text-emerald-400/80">
                    -{diff.toFixed(2)}%
                  </span>
                )}
                <div className="font-mono text-base font-bold text-emerald-200 bg-gray-900/80 px-3 py-1 rounded-lg border border-gray-800 flex items-center space-x-1.5">
                  <span>{s.price.toLocaleString('en-IN')}</span>
                  {copiedPrice === s.price ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
