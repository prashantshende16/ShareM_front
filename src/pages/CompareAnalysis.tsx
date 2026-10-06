import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  GitCompare,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Layers,
  ShieldCheck,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { Analysis } from '../types';

export const CompareAnalysis: React.FC = () => {
  const [searchParams] = useSearchParams();
  const baseParam = searchParams.get('base');

  const { data: allAnalyses } = useQuery({
    queryKey: ['all-analyses-for-compare'],
    queryFn: () => api.getAnalyses({}),
  });

  const [id1, setId1] = useState<number | ''>(baseParam ? Number(baseParam) : '');
  const [id2, setId2] = useState<number | ''>('');

  const { data: compareResult, isLoading, error } = useQuery({
    queryKey: ['compare', id1, id2],
    queryFn: () => api.compareAnalyses(Number(id1), Number(id2)),
    enabled: Boolean(id1 && id2 && id1 !== id2),
  });

  const validAnalyses = allAnalyses?.filter((a) => a.result) || [];

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Compare Market Analyses</h1>
        <p className="text-sm text-gray-400 mt-1">
          Detect structural shifts, bias migrations, confidence adjustments, and evolving support/resistance boundaries between two chart evaluations.
        </p>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-[#111827] p-6 rounded-2xl border border-gray-800 shadow-xl">
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-2 font-mono">
            Analysis A (Baseline / Prior)
          </label>
          <select
            value={id1}
            onChange={(e) => setId1(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full bg-[#1e293b] border border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-gray-100 focus:outline-none focus:border-blue-500 font-mono"
          >
            <option value="">Select Analysis A</option>
            {validAnalyses.map((a) => (
              <option key={a.id} value={a.id}>
                #{a.id} - {a.symbol} ({a.result?.primary_scenario?.toUpperCase()}) -{' '}
                {new Date(a.created_at).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-2 font-mono">
            Analysis B (Current / Later)
          </label>
          <select
            value={id2}
            onChange={(e) => setId2(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full bg-[#1e293b] border border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-gray-100 focus:outline-none focus:border-blue-500 font-mono"
          >
            <option value="">Select Analysis B</option>
            {validAnalyses.map((a) => (
              <option key={a.id} value={a.id}>
                #{a.id} - {a.symbol} ({a.result?.primary_scenario?.toUpperCase()}) -{' '}
                {new Date(a.created_at).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Comparison View */}
      {isLoading ? (
        <div className="p-16 text-center text-gray-400 bg-[#111827] rounded-2xl border border-gray-800">
          Comparing technical parameters...
        </div>
      ) : compareResult ? (
        <div className="space-y-6">
          {/* Shift Highlights Card */}
          <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border border-blue-900/40 rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-gray-100 mb-4 flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <span>Structural Delta Summary</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800">
                <span className="text-gray-400 block mb-1">Primary Bias Shift</span>
                <strong className="text-sm font-bold text-blue-300 font-mono">
                  {compareResult.diff.bias_shift}
                </strong>
              </div>

              <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800">
                <span className="text-gray-400 block mb-1">Confidence Change</span>
                <strong className="text-sm font-bold text-emerald-300 font-mono">
                  {compareResult.diff.confidence_shift}
                </strong>
              </div>

              <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800">
                <span className="text-gray-400 block mb-1">Support Evolution</span>
                <strong className="text-sm font-bold text-gray-200 font-mono">
                  {compareResult.diff.primary_support_1} → {compareResult.diff.primary_support_2}
                </strong>
              </div>

              <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800">
                <span className="text-gray-400 block mb-1">Resistance Evolution</span>
                <strong className="text-sm font-bold text-gray-200 font-mono">
                  {compareResult.diff.primary_resistance_1} → {compareResult.diff.primary_resistance_2}
                </strong>
              </div>
            </div>
          </div>

          {/* Side by Side Detailed Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Analysis A Card */}
            <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 space-y-4">
              <div className="border-b border-gray-800 pb-3 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400 font-mono">Analysis #{compareResult.analysis_1.id}</span>
                  <h4 className="text-lg font-bold text-gray-100">{compareResult.analysis_1.symbol}</h4>
                </div>
                <span className="text-xs bg-gray-800 text-gray-300 px-2.5 py-1 rounded-lg font-mono">
                  {new Date(compareResult.analysis_1.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-gray-800/60">
                  <span className="text-gray-400">Primary Scenario</span>
                  <strong className="text-gray-100 uppercase font-mono">
                    {compareResult.analysis_1.result?.primary_scenario}
                  </strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-800/60">
                  <span className="text-gray-400">Confidence</span>
                  <strong className="text-gray-100 font-mono">
                    {compareResult.analysis_1.result?.confidence_score}%
                  </strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-800/60">
                  <span className="text-gray-400">Trend</span>
                  <strong className="text-gray-100">
                    {compareResult.analysis_1.result?.trend}
                  </strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-800/60">
                  <span className="text-gray-400">Setup Direction</span>
                  <strong className="text-gray-100 font-mono">
                    {compareResult.analysis_1.result?.trade_setup?.direction}
                  </strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-800/60">
                  <span className="text-gray-400">Risk Profile</span>
                  <strong className="text-gray-100">
                    {compareResult.analysis_1.result?.risk_analysis?.risk_level}
                  </strong>
                </div>
              </div>
            </div>

            {/* Analysis B Card */}
            <div className="bg-[#111827] border border-blue-900/50 rounded-2xl p-6 space-y-4">
              <div className="border-b border-gray-800 pb-3 flex items-center justify-between">
                <div>
                  <span className="text-xs text-blue-400 font-mono">Analysis #{compareResult.analysis_2.id}</span>
                  <h4 className="text-lg font-bold text-gray-100">{compareResult.analysis_2.symbol}</h4>
                </div>
                <span className="text-xs bg-gray-800 text-gray-300 px-2.5 py-1 rounded-lg font-mono">
                  {new Date(compareResult.analysis_2.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-gray-800/60">
                  <span className="text-gray-400">Primary Scenario</span>
                  <strong className="text-blue-300 uppercase font-mono">
                    {compareResult.analysis_2.result?.primary_scenario}
                  </strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-800/60">
                  <span className="text-gray-400">Confidence</span>
                  <strong className="text-gray-100 font-mono">
                    {compareResult.analysis_2.result?.confidence_score}%
                  </strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-800/60">
                  <span className="text-gray-400">Trend</span>
                  <strong className="text-gray-100">
                    {compareResult.analysis_2.result?.trend}
                  </strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-800/60">
                  <span className="text-gray-400">Setup Direction</span>
                  <strong className="text-gray-100 font-mono">
                    {compareResult.analysis_2.result?.trade_setup?.direction}
                  </strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-800/60">
                  <span className="text-gray-400">Risk Profile</span>
                  <strong className="text-gray-100">
                    {compareResult.analysis_2.result?.risk_analysis?.risk_level}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-[#111827] rounded-2xl border border-gray-800 text-gray-400 text-xs">
          Select two distinct completed analyses above to view side-by-side technical shifts.
        </div>
      )}
    </div>
  );
};
