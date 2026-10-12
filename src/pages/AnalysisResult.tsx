import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  MoveHorizontal,
  ShieldAlert,
  ArrowRight,
  Clock,
  Layers,
  BarChart2,
  Sliders,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Share2,
  GitCompare,
  AlertTriangle,
  Flame,
  Activity
} from 'lucide-react';
import { api } from '../services/api';
import { ConfidenceMeter } from '../components/ConfidenceMeter';
import { ScenarioCard } from '../components/ScenarioCard';
import { SupportResistance } from '../components/SupportResistance';
import { ScreenshotOverlayViewer } from '../components/ScreenshotOverlayViewer';
import { OptionSignalCard } from '../components/OptionSignalCard';

export const AnalysisResult: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedScreenshotIndex, setSelectedScreenshotIndex] = useState(0);

  const { data: analysis, isLoading, error } = useQuery({
    queryKey: ['analysis', id],
    queryFn: () => api.getAnalysis(Number(id)),
    refetchInterval: (query) => {
      // Poll if status is analyzing
      return query.state.data?.status === 'analyzing' ? 2000 : false;
    },
  });

  if (isLoading) {
    return (
      <div className="p-16 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-300 font-medium">Loading analysis result...</p>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="p-12 text-center bg-[#111827] rounded-3xl border border-gray-800 space-y-4">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
        <h2 className="text-lg font-bold text-gray-200">Analysis Not Found</h2>
        <p className="text-xs text-gray-400">The requested analysis ID could not be loaded.</p>
        <Link to="/" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-semibold">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const res = analysis.result;
  const isPendingOrAnalyzing = analysis.status === 'analyzing' || analysis.status === 'pending';

  if (isPendingOrAnalyzing || !res) {
    return (
      <div className="p-16 text-center bg-[#111827] rounded-3xl border border-gray-800 space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <h2 className="text-lg font-bold text-gray-200">Processing Chart Vision...</h2>
        <p className="text-xs text-gray-400 max-w-md mx-auto">
          The AI engine is currently extracting candlestick patterns, multi-timeframe structures, and scenario probabilities.
        </p>
      </div>
    );
  }

  const primaryBias = res.primary_scenario.toLowerCase();
  const isBull = primaryBias === 'bullish';
  const isBear = primaryBias === 'bearish';

  const selectedScreenshot = analysis.screenshots[selectedScreenshotIndex] || analysis.screenshots[0];

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner (Section 16) */}
      <div className="bg-[#111827] border border-gray-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Instrument & Primary Scenario */}
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className="text-2xl font-black text-white tracking-tight font-mono">
                {analysis.symbol}
              </span>
              <span className="text-xs font-semibold uppercase bg-gray-800 text-gray-300 px-2.5 py-1 rounded-lg border border-gray-700">
                {analysis.instrument_type}
              </span>
              <span className="text-xs text-gray-500 font-mono">
                #{analysis.id}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div
                className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl border text-sm font-extrabold uppercase tracking-wide ${
                  isBull
                    ? 'bg-emerald-950/80 text-emerald-400 border-emerald-600/60 shadow-lg shadow-emerald-950/50'
                    : isBear
                    ? 'bg-red-950/80 text-red-400 border-red-600/60 shadow-lg shadow-red-950/50'
                    : 'bg-amber-950/80 text-amber-400 border-amber-600/60 shadow-lg shadow-amber-950/50'
                }`}
              >
                {isBull ? <TrendingUp className="w-4 h-4" /> : isBear ? <TrendingDown className="w-4 h-4" /> : <MoveHorizontal className="w-4 h-4" />}
                <span>Primary Bias: {res.primary_scenario}</span>
              </div>

              <div className="flex items-center space-x-1.5 text-xs text-gray-400 bg-gray-900/80 px-3 py-1.5 rounded-xl border border-gray-800 font-mono">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>Time Horizon: <strong>{res.time_horizon || '15-60 Min'}</strong></span>
              </div>

              {analysis.current_price && (
                <div className="flex items-center space-x-1.5 text-xs text-gray-300 bg-gray-900/80 px-3 py-1.5 rounded-xl border border-gray-800 font-mono">
                  <span>CMP: </span>
                  <strong className="text-blue-400 font-bold">{analysis.current_price.toLocaleString('en-IN')}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Right: Confidence Meter & Actions */}
          <div className="flex items-center space-x-6 border-t lg:border-t-0 lg:border-l border-gray-800 pt-4 lg:pt-0 lg:pl-6">
            <ConfidenceMeter score={res.confidence_score} size="lg" />

            <div className="flex flex-col space-y-2">
              <Link
                to={`/compare?base=${analysis.id}`}
                className="inline-flex items-center space-x-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold px-3.5 py-2 rounded-xl border border-gray-700 transition-colors"
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>Compare</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* AI Summary Banner */}
      {res.ai_summary && (
        <div className="bg-gradient-to-r from-blue-950/30 to-indigo-950/20 rounded-2xl border border-blue-900/40 p-4.5 text-xs text-gray-300 leading-relaxed flex items-start space-x-3">
          <Activity className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-blue-300">Technical Synthesis: </strong>
            <span>{res.ai_summary}</span>
          </div>
        </div>
      )}

      {/* 5-Minute Intraday Option Indicator Decision Component */}
      <OptionSignalCard
        symbol={analysis.symbol}
        initialSignal={res.trade_setup?.option_indicator_5m}
        allowSymbolSelect={false}
      />

      {/* Scenario Cards Grid (Section 17) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-100">Probabilistic Scenarios</h2>
          <span className="text-xs text-gray-400 font-mono">Probabilities sum to 100%</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <ScenarioCard
            scenario={res.bullish_scenario}
            isPrimary={res.primary_scenario === 'bullish'}
          />
          <ScenarioCard
            scenario={res.bearish_scenario}
            isPrimary={res.primary_scenario === 'bearish'}
          />
          <ScenarioCard
            scenario={res.sideways_scenario}
            isPrimary={res.primary_scenario === 'sideways'}
          />
        </div>
      </div>

      {/* Market Structure & Support/Resistance Grid (Section 18 & 19) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Structure Section */}
        <div className="bg-[#111827] rounded-2xl border border-gray-800 p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <div className="flex items-center space-x-2">
              <BarChart2 className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold text-gray-100 text-base">Market Structure Analysis</h3>
            </div>
            <span className="text-xs font-mono text-gray-400">Technical State</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900/60 p-3.5 rounded-xl border border-gray-800">
              <span className="text-xs text-gray-400 block mb-1">Primary Trend</span>
              <strong className="text-sm font-bold text-gray-100">{res.market_structure?.trend || res.trend}</strong>
            </div>
            <div className="bg-gray-900/60 p-3.5 rounded-xl border border-gray-800">
              <span className="text-xs text-gray-400 block mb-1">Price Structure</span>
              <strong className="text-sm font-bold text-gray-100">{res.market_structure?.structure || 'N/A'}</strong>
            </div>
            <div className="bg-gray-900/60 p-3.5 rounded-xl border border-gray-800">
              <span className="text-xs text-gray-400 block mb-1">Directional Momentum</span>
              <strong className="text-sm font-bold text-gray-100">{res.market_structure?.momentum || 'Moderate'}</strong>
            </div>
            <div className="bg-gray-900/60 p-3.5 rounded-xl border border-gray-800">
              <span className="text-xs text-gray-400 block mb-1">Observed Volatility</span>
              <strong className="text-sm font-bold text-gray-100">{res.market_structure?.volatility || 'Normal'}</strong>
            </div>
          </div>

          {/* Technical Indicators & Candlestick observations */}
          <div className="space-y-3 pt-2 text-xs">
            {res.candlestick_analysis?.patterns_detected && res.candlestick_analysis.patterns_detected.length > 0 && (
              <div className="bg-gray-900/40 p-3 rounded-xl border border-gray-800">
                <span className="text-gray-400 font-semibold block mb-1">Candlestick Patterns:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {res.candlestick_analysis.patterns_detected.map((p, idx) => (
                    <span key={idx} className="bg-blue-950/80 text-blue-300 border border-blue-800 px-2 py-0.5 rounded text-[11px]">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {res.technical_indicators && (
              <div className="bg-gray-900/40 p-3 rounded-xl border border-gray-800 space-y-1">
                <span className="text-gray-400 font-semibold block mb-1">Indicators / Moving Averages:</span>
                {res.technical_indicators.moving_averages && (
                  <p className="text-gray-300">EMA/SMA: {res.technical_indicators.moving_averages}</p>
                )}
                {res.technical_indicators.rsi && (
                  <p className="text-gray-300">RSI: {res.technical_indicators.rsi}</p>
                )}
                {res.technical_indicators.vwap && (
                  <p className="text-gray-300">VWAP: {res.technical_indicators.vwap}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Support & Resistance Visualization Ladder */}
        <SupportResistance
          currentPrice={analysis.current_price}
          supports={res.support_levels || []}
          resistances={res.resistance_levels || []}
        />
      </div>

      {/* Screenshot & AI Overlay Inspection (Section 20) */}
      {selectedScreenshot && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-100 text-base">Original Chart & AI Level Overlay</h3>
              <p className="text-xs text-gray-400">Inspect candlestick chart with detected technical lines</p>
            </div>

            {/* Timeframe selector tabs if multiple screenshots exist */}
            {analysis.screenshots.length > 1 && (
              <div className="flex items-center space-x-1.5 bg-[#111827] p-1 rounded-xl border border-gray-800">
                {analysis.screenshots.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedScreenshotIndex(idx)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      selectedScreenshotIndex === idx
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {s.timeframe}
                  </button>
                ))}
              </div>
            )}
          </div>

          <ScreenshotOverlayViewer
            imageUrl={selectedScreenshot.url}
            timeframe={selectedScreenshot.timeframe}
            overlays={res.detected_overlays || []}
          />
        </div>
      )}

      {/* Multi-Timeframe Synthesis (Section 15) */}
      {res.multi_timeframe_synthesis && Object.keys(res.multi_timeframe_synthesis).length > 0 && (
        <div className="bg-[#111827] rounded-2xl border border-gray-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <h3 className="font-semibold text-gray-100 text-base">Multi-Timeframe Structure Synthesis</h3>
            </div>
            <span className="text-xs font-mono text-gray-400">Top-Down Confluence</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800">
              <span className="text-[11px] text-gray-400 uppercase font-mono block mb-1">Daily Trend</span>
              <strong className="text-sm font-bold text-gray-200">
                {res.multi_timeframe_synthesis.daily_trend || 'Constructive Base'}
              </strong>
            </div>
            <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800">
              <span className="text-[11px] text-gray-400 uppercase font-mono block mb-1">1 Hour Trend</span>
              <strong className="text-sm font-bold text-gray-200">
                {res.multi_timeframe_synthesis.hourly_trend || 'Trend Channel'}
              </strong>
            </div>
            <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800">
              <span className="text-[11px] text-gray-400 uppercase font-mono block mb-1">15 Min Structure</span>
              <strong className="text-sm font-bold text-gray-200">
                {res.multi_timeframe_synthesis.fifteen_min_structure || 'Consolidation'}
              </strong>
            </div>
            <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800">
              <span className="text-[11px] text-gray-400 uppercase font-mono block mb-1">5 Min Entry Setup</span>
              <strong className="text-sm font-bold text-gray-200">
                {res.multi_timeframe_synthesis.five_min_structure || 'Breakout Attempt'}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Time-Based Movement Analysis (Section 21) */}
      {res.time_movements && res.time_movements.length > 0 && (
        <div className="bg-[#111827] rounded-2xl border border-gray-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold text-gray-100 text-base">Possible Next Price Movement by Timeframe</h3>
            </div>
            <span className="text-xs text-amber-400/90 font-mono">Probabilistic Scenarios</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {res.time_movements.map((tm, idx) => (
              <div key={idx} className="bg-gray-900/60 p-4 rounded-xl border border-gray-800 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-blue-300 font-mono">{tm.timeframe}</span>
                    <span className="text-[11px] font-mono font-semibold bg-gray-800 px-2 py-0.5 rounded text-gray-300">
                      {tm.confidence}%
                    </span>
                  </div>
                  <div className="text-sm font-bold text-gray-100 mb-2">Bias: {tm.bias}</div>
                  <div className="text-xs text-gray-400 space-y-1">
                    <p><strong className="text-gray-300">Condition:</strong> {tm.condition}</p>
                    <p><strong className="text-gray-300">Behavior:</strong> {tm.expected_behavior}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-800 text-[11px] text-red-400/90">
                  <span>Invalidation: {tm.invalidation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Potential Trade Setup & Risk Management (Section 22 & 23) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trade Setup */}
        <div className="bg-[#111827] rounded-2xl border border-gray-800 p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <div className="flex items-center space-x-2">
              <Flame className="w-5 h-5 text-amber-400" />
              <h3 className="font-semibold text-gray-100 text-base">Potential Trade Setup</h3>
            </div>
            <span
              className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded ${
                res.trade_setup?.direction === 'NO TRADE'
                  ? 'bg-gray-800 text-gray-400'
                  : res.trade_setup?.direction === 'CALL'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-red-950 text-red-400 border border-red-800'
              }`}
            >
              {res.trade_setup?.direction || 'NO TRADE'}
            </span>
          </div>

          {res.trade_setup?.direction === 'NO TRADE' ? (
            <div className="p-6 bg-gray-900/40 rounded-xl border border-gray-800 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-gray-800 text-gray-400 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-gray-200">NO CLEAR SETUP IDENTIFIED</h4>
              <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                {res.trade_setup?.reason || 'Insufficient confirmation or conflicting signals across timeframes. Wait for a decisive breakout or range boundary test.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-900/60 p-3 rounded-xl border border-gray-800">
                  <span className="text-gray-400 block mb-1">Entry Zone</span>
                  <strong className="text-sm font-mono text-gray-100">{res.trade_setup?.entry_zone || res.entry_zone || 'N/A'}</strong>
                </div>
                <div className="bg-red-950/20 p-3 rounded-xl border border-red-900/30">
                  <span className="text-red-400 block mb-1">Stop Loss</span>
                  <strong className="text-sm font-mono text-red-300">{res.trade_setup?.stop_loss || res.stop_loss_zone || 'N/A'}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-950/20 p-3 rounded-xl border border-emerald-900/30">
                  <span className="text-emerald-400 block mb-1">Target 1</span>
                  <strong className="text-sm font-mono text-emerald-300">{res.trade_setup?.target_1 || 'N/A'}</strong>
                </div>
                <div className="bg-emerald-950/20 p-3 rounded-xl border border-emerald-900/30">
                  <span className="text-emerald-400 block mb-1">Target 2</span>
                  <strong className="text-sm font-mono text-emerald-300">{res.trade_setup?.target_2 || 'N/A'}</strong>
                </div>
              </div>

              <div className="bg-gray-900/60 p-3 rounded-xl border border-gray-800 flex items-center justify-between">
                <span className="text-gray-400">Risk / Reward Ratio</span>
                <strong className="text-sm font-mono text-blue-400 font-bold">{res.trade_setup?.risk_reward || '1 : 2.0'}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Risk Management Panel */}
        <div className="bg-[#111827] rounded-2xl border border-gray-800 p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <h3 className="font-semibold text-gray-100 text-base">Risk Management Panel</h3>
            </div>
            <span className="text-xs font-mono text-gray-400">Capital Protection</span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-gray-900/60 p-3.5 rounded-xl border border-gray-800">
              <span className="text-gray-400 block mb-1">Risk Level</span>
              <strong className="text-sm font-bold text-gray-100">{res.risk_analysis?.risk_level || 'MEDIUM'}</strong>
            </div>
            <div className="bg-gray-900/60 p-3.5 rounded-xl border border-gray-800">
              <span className="text-gray-400 block mb-1">Setup Quality Grade</span>
              <strong className="text-sm font-bold text-indigo-400 font-mono">Grade {res.risk_analysis?.setup_quality || 'B'}</strong>
            </div>
            <div className="bg-gray-900/60 p-3.5 rounded-xl border border-gray-800 col-span-2">
              <span className="text-gray-400 block mb-1">Primary Failure Risk</span>
              <p className="text-xs text-gray-300">{res.risk_analysis?.main_risk || 'False breakout / rejection at overhead liquidity pocket'}</p>
            </div>
          </div>

          {/* Mandatory Educational Disclaimer (Section 23) */}
          <div className="p-4 bg-amber-950/20 border border-amber-900/40 rounded-xl text-amber-300/90 text-xs leading-relaxed space-y-1.5">
            <div className="flex items-center space-x-1.5 font-bold text-amber-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Mandatory Educational Disclaimer</span>
            </div>
            <p>
              {res.risk_analysis?.disclaimer ||
                'This analysis is probabilistic and educational. It is not financial advice. Market conditions can change rapidly. Always independently verify levels and manage risk.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
