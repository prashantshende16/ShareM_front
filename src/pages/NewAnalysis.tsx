import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Sparkles,
  Layers,
  Zap,
  UploadCloud,
  AlertCircle,
  Clock,
  Globe2,
  Building2,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { ScreenshotUploader, UploadItem } from '../components/ScreenshotUploader';
import { AnalysisProgress } from '../components/AnalysisProgress';
import { LiveMarketTicker } from '../components/LiveMarketTicker';

const MARKETS = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'SENSEX', 'Other'];
const INSTRUMENT_TYPES = ['Index', 'Future', 'Call Option', 'Put Option', 'Stock Future', 'Other'];
const OPTION_TYPES = ['CALL', 'PUT', 'FUTURE', 'N/A'];

export const NewAnalysis: React.FC = () => {
  const navigate = useNavigate();

  // Mode Selection: 'live' (1-click direct fetch) vs 'screenshot' (manual uploads)
  const [analysisMode, setAnalysisMode] = useState<'live' | 'screenshot'>('live');

  // Form State
  const [market, setMarket] = useState('NIFTY');
  const [instrumentType, setInstrumentType] = useState('Index');
  const [symbol, setSymbol] = useState('NIFTY 50');
  const [expiry, setExpiry] = useState('');
  const [strikePrice, setStrikePrice] = useState<number | ''>('');
  const [optionType, setOptionType] = useState('N/A');

  // Multi-timeframe screenshots (for screenshot mode)
  const [uploads, setUploads] = useState<UploadItem[]>([]);

  // Optional Market Information
  const [currentPrice, setCurrentPrice] = useState<number | ''>('');
  const [previousClose, setPreviousClose] = useState<number | ''>('');
  const [dayHigh, setDayHigh] = useState<number | ''>('');
  const [dayLow, setDayLow] = useState<number | ''>('');
  const [volume, setVolume] = useState('');
  const [openInterest, setOpenInterest] = useState('');
  const [pcr, setPcr] = useState<number | ''>('');
  const [indiaVix, setIndiaVix] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  // UI States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Symbol quick select updater
  const handleMarketChange = (m: string) => {
    setMarket(m);
    if (m === 'NIFTY') setSymbol('NIFTY 50');
    else if (m === 'BANKNIFTY') setSymbol('BANKNIFTY');
    else if (m === 'FINNIFTY') setSymbol('FINNIFTY');
    else if (m === 'SENSEX') setSymbol('SENSEX');
    else setSymbol('');
  };

  // Quick Preset Clicker
  const selectQuickSymbol = (m: string, s: string) => {
    setMarket(m);
    setSymbol(s);
  };

  const handleLiveAnalysisSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      setIsAnalyzing(true);
      const res = await api.analyzeLiveMarket({
        symbol: symbol.trim() || 'NIFTY 50',
        market,
        instrument_type: instrumentType,
        notes: notes.trim() || undefined
      });

      // Redirect to Result Screen
      navigate(`/analyses/${res.analysis_id}`);
    } catch (err: any) {
      setIsAnalyzing(false);
      setErrorMessage(err.message || 'Failed to start live market analysis.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleScreenshotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (uploads.length === 0) {
      setErrorMessage('Please upload at least one chart screenshot to analyze.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      setIsAnalyzing(true);

      const analysis = await api.createAnalysis({
        market,
        instrument_type: instrumentType,
        symbol: symbol.trim() || 'NIFTY 50',
        expiry: expiry || undefined,
        strike_price: strikePrice !== '' ? Number(strikePrice) : undefined,
        option_type: optionType,
        current_price: currentPrice !== '' ? Number(currentPrice) : undefined,
        previous_close: previousClose !== '' ? Number(previousClose) : undefined,
        day_high: dayHigh !== '' ? Number(dayHigh) : undefined,
        day_low: dayLow !== '' ? Number(dayLow) : undefined,
        volume: volume || undefined,
        open_interest: openInterest || undefined,
        pcr: pcr !== '' ? Number(pcr) : undefined,
        india_vix: indiaVix !== '' ? Number(indiaVix) : undefined,
        notes: notes.trim() || undefined,
      });

      for (const item of uploads) {
        if (item.file) {
          await api.uploadScreenshot(analysis.id, item.file, item.timeframe);
        }
      }

      await api.runAnalysis(analysis.id);
      navigate(`/analyses/${analysis.id}`);
    } catch (err: any) {
      setIsAnalyzing(false);
      setErrorMessage(err.message || 'An error occurred during analysis.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Live Global Market & Sector Drivers Ticker */}
      <LiveMarketTicker />

      {/* Title & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2.5">
            <span>Market Analysis Center</span>
            <span className="text-[10px] font-mono uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
              Phase 2 Live
            </span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Choose between 1-Click Instant Live Analysis or Custom Multi-Timeframe Chart Uploads.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center bg-[#111827] border border-gray-800 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => setAnalysisMode('live')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              analysisMode === 'live'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            1-Click Live Auto (No Upload)
          </button>

          <button
            type="button"
            onClick={() => setAnalysisMode('screenshot')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              analysisMode === 'screenshot'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <UploadCloud className="w-4 h-4 text-blue-400" />
            Custom Screenshot Upload
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/60 text-red-200 text-sm flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">{errorMessage}</div>
        </div>
      )}

      {/* ===================== MODE 1: LIVE 1-CLICK ANALYSIS ===================== */}
      {analysisMode === 'live' ? (
        <form onSubmit={handleLiveAnalysisSubmit} className="space-y-6">
          <div className="bg-[#111827] rounded-2xl border border-gray-800 p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-semibold text-gray-100">Select Market / Instrument for Live Evaluation</h2>
              </div>
              <span className="text-xs text-gray-400 font-mono">Auto 1m, 5m, 15m, 30m, 1h Analysis</span>
            </div>

            {/* Quick Instrument Pickers */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2">Popular Quick Picks</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'NIFTY 50', market: 'NIFTY', symbol: 'NIFTY 50' },
                  { label: 'BANKNIFTY', market: 'BANKNIFTY', symbol: 'BANKNIFTY' },
                  { label: 'FINNIFTY', market: 'FINNIFTY', symbol: 'FINNIFTY' },
                  { label: 'SENSEX', market: 'SENSEX', symbol: 'SENSEX' },
                  { label: 'HDFC BANK', market: 'Other', symbol: 'HDFCBANK' },
                  { label: 'RELIANCE', market: 'Other', symbol: 'RELIANCE' },
                  { label: 'ICICI BANK', market: 'Other', symbol: 'ICICIBANK' },
                  { label: 'INFOSYS', market: 'Other', symbol: 'INFY' },
                  { label: 'TCS', market: 'Other', symbol: 'TCS' },
                  { label: 'SBI', market: 'Other', symbol: 'SBIN' },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => selectQuickSymbol(item.market, item.symbol)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                      symbol === item.symbol
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold'
                        : 'bg-[#1e293b]/70 border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">Market</label>
                <select
                  value={market}
                  onChange={(e) => handleMarketChange(e.target.value)}
                  className="w-full bg-[#1e293b] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
                >
                  {MARKETS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">Instrument Type</label>
                <select
                  value={instrumentType}
                  onChange={(e) => setInstrumentType(e.target.value)}
                  className="w-full bg-[#1e293b] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
                >
                  {INSTRUMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">Symbol / Ticker</label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder="e.g. NIFTY 50, BANKNIFTY, RELIANCE"
                  className="w-full bg-[#1e293b] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-blue-500 font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2">Additional Trading Context or Notes (Optional)</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Watching immediate resistance around 22,350; looking for long scalps if 5m consolidates above VWAP."
                className="w-full bg-[#1e293b] border border-gray-700 rounded-xl p-3 text-sm text-gray-100 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
          </div>

          {/* 1-Click Launch Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 rounded-2xl border border-blue-900/30 shadow-xl">
            <div className="text-xs text-gray-300 space-y-1">
              <p className="font-bold text-gray-100 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-400" />
                Automated Multi-Timeframe Analysis Engine
              </p>
              <p className="text-gray-400">
                Pulls real-time 1m, 5m, 15m, 30m, and 1h live market candles, generates chart visuals, synthesizes global cues & bank heavyweight impacts, and runs probabilistic scenario models.
              </p>
            </div>

            <button
              type="submit"
              disabled={isAnalyzing}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all shadow-xl flex items-center justify-center space-x-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30 active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              <span>Analyze Live Market</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      ) : (
        /* ===================== MODE 2: MANUAL SCREENSHOT UPLOAD ===================== */
        <form onSubmit={handleScreenshotSubmit} className="space-y-8">
          {/* Section 1: Instrument & Market Configuration */}
          <div className="bg-[#111827] rounded-2xl border border-gray-800 p-6 shadow-xl space-y-6">
            <div className="flex items-center space-x-2 border-b border-gray-800 pb-3">
              <Layers className="w-5 h-5 text-blue-400" />
              <h2 className="text-base font-semibold text-gray-100">1. Instrument & Market Details</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">Market</label>
                <select
                  value={market}
                  onChange={(e) => handleMarketChange(e.target.value)}
                  className="w-full bg-[#1e293b] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
                >
                  {MARKETS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">Instrument Type</label>
                <select
                  value={instrumentType}
                  onChange={(e) => setInstrumentType(e.target.value)}
                  className="w-full bg-[#1e293b] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
                >
                  {INSTRUMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">Symbol</label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder="e.g. NIFTY 50"
                  className="w-full bg-[#1e293b] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-blue-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">Expiry Date (Optional)</label>
                <input
                  type="date"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="w-full bg-[#1e293b] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">Strike Price (Optional)</label>
                <input
                  type="number"
                  value={strikePrice}
                  onChange={(e) => setStrikePrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 25000"
                  className="w-full bg-[#1e293b] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">Option Type</label>
                <select
                  value={optionType}
                  onChange={(e) => setOptionType(e.target.value)}
                  className="w-full bg-[#1e293b] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
                >
                  {OPTION_TYPES.map((ot) => (
                    <option key={ot} value={ot}>
                      {ot}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Screenshot Upload */}
          <div className="bg-[#111827] rounded-2xl border border-gray-800 p-6 shadow-xl space-y-6">
            <ScreenshotUploader uploads={uploads} onChange={setUploads} />
          </div>

          {/* Section 3: Additional Market Information */}
          <div className="bg-[#111827] rounded-2xl border border-gray-800 p-6 shadow-xl space-y-6">
            <h2 className="text-base font-semibold text-gray-100 border-b border-gray-800 pb-3">
              3. Additional Market Information (Optional)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">Current Market Price (CMP)</label>
                <input
                  type="number"
                  step="0.05"
                  value={currentPrice}
                  onChange={(e) => setCurrentPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 25050"
                  className="w-full bg-[#1e293b] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">Previous Close</label>
                <input
                  type="number"
                  step="0.05"
                  value={previousClose}
                  onChange={(e) => setPreviousClose(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 24980"
                  className="w-full bg-[#1e293b] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">Day High</label>
                <input
                  type="number"
                  step="0.05"
                  value={dayHigh}
                  onChange={(e) => setDayHigh(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 25150"
                  className="w-full bg-[#1e293b] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2">Day Low</label>
                <input
                  type="number"
                  step="0.05"
                  value={dayLow}
                  onChange={(e) => setDayLow(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 24920"
                  className="w-full bg-[#1e293b] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2">Additional Notes</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Market opened gap-up. Strong resistance near 25,200. Watching 25,000 support."
                className="w-full bg-[#1e293b] border border-gray-700 rounded-xl p-3 text-sm text-gray-100 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Section 4: Analyze Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 rounded-2xl border border-blue-900/30">
            <div className="text-xs text-gray-400 space-y-1">
              <p className="font-semibold text-gray-200">Execution Check</p>
              <p>
                {uploads.length > 0
                  ? `${uploads.length} screenshot(s) ready for multi-timeframe evaluation.`
                  : 'Upload at least 1 screenshot to enable analysis.'}
              </p>
            </div>

            <button
              type="submit"
              disabled={uploads.length === 0 || isAnalyzing}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all shadow-xl flex items-center justify-center space-x-2.5 ${
                uploads.length > 0 && !isAnalyzing
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 active:scale-95 cursor-pointer'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
              }`}
            >
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              <span>Analyze Screenshots</span>
            </button>
          </div>
        </form>
      )}

      {/* Progress Overlay */}
      <AnalysisProgress isOpen={isAnalyzing} />
    </div>
  );
};
