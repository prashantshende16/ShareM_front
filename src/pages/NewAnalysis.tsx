import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Sparkles,
  Info,
  Calendar,
  Layers,
  FileText,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { ScreenshotUploader, UploadItem } from '../components/ScreenshotUploader';
import { AnalysisProgress } from '../components/AnalysisProgress';

const MARKETS = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'SENSEX', 'Other'];
const INSTRUMENT_TYPES = ['Index', 'Future', 'Call Option', 'Put Option', 'Stock Future', 'Other'];
const OPTION_TYPES = ['CALL', 'PUT', 'FUTURE', 'N/A'];

export const NewAnalysis: React.FC = () => {
  const navigate = useNavigate();

  // Form State
  const [market, setMarket] = useState('NIFTY');
  const [instrumentType, setInstrumentType] = useState('Index');
  const [symbol, setSymbol] = useState('NIFTY 50');
  const [expiry, setExpiry] = useState('');
  const [strikePrice, setStrikePrice] = useState<number | ''>('');
  const [optionType, setOptionType] = useState('N/A');

  // Multi-timeframe screenshots
  const [uploads, setUploads] = useState<UploadItem[]>([]);

  // Optional Market Information (Section 8)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation: Require at least 1 screenshot
    if (uploads.length === 0) {
      setErrorMessage('Please upload at least one chart screenshot (e.g. 15 Minute or 5 Minute) to analyze.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      setIsAnalyzing(true);

      // 1. Create Analysis record
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

      // 2. Upload all screenshots
      for (const item of uploads) {
        if (item.file) {
          await api.uploadScreenshot(analysis.id, item.file, item.timeframe);
        }
      }

      // 3. Trigger AI technical analysis
      await api.runAnalysis(analysis.id);

      // 4. Redirect to Result Screen
      navigate(`/analyses/${analysis.id}`);
    } catch (err: any) {
      setIsAnalyzing(false);
      setErrorMessage(err.message || 'An error occurred during analysis.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Create New Market Analysis</h1>
        <p className="text-sm text-gray-400 mt-1">
          Specify instrument parameters, upload multi-timeframe screenshots, and execute AI vision analysis.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/60 text-red-200 text-sm flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Instrument & Market Configuration */}
        <div className="bg-[#111827] rounded-2xl border border-gray-800 p-6 shadow-xl space-y-6">
          <div className="flex items-center space-x-2 border-b border-gray-800 pb-3">
            <Layers className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-semibold text-gray-100">1. Instrument & Market Details</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Market */}
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

            {/* Instrument Type */}
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

            {/* Symbol */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2">Symbol</label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="e.g. NIFTY 50, BANKNIFTY, RELIANCE"
                required
                className="w-full bg-[#1e293b] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            {/* Expiry */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2">Expiry (Optional)</label>
              <input
                type="date"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                className="w-full bg-[#1e293b] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Strike Price */}
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

            {/* Option Type */}
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

        {/* Section 2: Screenshot Uploads */}
        <div className="bg-[#111827] rounded-2xl border border-gray-800 p-6 shadow-xl">
          <ScreenshotUploader uploads={uploads} onChange={setUploads} />
        </div>

        {/* Section 3: Optional Market Metrics */}
        <div className="bg-[#111827] rounded-2xl border border-gray-800 p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-semibold text-gray-100">3. Optional Market Metrics</h2>
            </div>
            <span className="text-xs text-gray-400">All fields are optional</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2">Current Market Price (CMP)</label>
              <input
                type="number"
                step="any"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 25120"
                className="w-full bg-[#1e293b] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2">Previous Close</label>
              <input
                type="number"
                step="any"
                value={previousClose}
                onChange={(e) => setPreviousClose(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 25050"
                className="w-full bg-[#1e293b] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2">Day High</label>
              <input
                type="number"
                step="any"
                value={dayHigh}
                onChange={(e) => setDayHigh(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 25210"
                className="w-full bg-[#1e293b] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2">Day Low</label>
              <input
                type="number"
                step="any"
                value={dayLow}
                onChange={(e) => setDayLow(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 24980"
                className="w-full bg-[#1e293b] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2">Volume</label>
              <input
                type="text"
                value={volume}
                onChange={(e) => setVolume(e.target.value)}
                placeholder="e.g. 12.5M"
                className="w-full bg-[#1e293b] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2">Open Interest (OI)</label>
              <input
                type="text"
                value={openInterest}
                onChange={(e) => setOpenInterest(e.target.value)}
                placeholder="e.g. 8.4M contracts"
                className="w-full bg-[#1e293b] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2">PCR (Put-Call Ratio)</label>
              <input
                type="number"
                step="0.01"
                value={pcr}
                onChange={(e) => setPcr(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 1.15"
                className="w-full bg-[#1e293b] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2">India VIX</label>
              <input
                type="number"
                step="0.01"
                value={indiaVix}
                onChange={(e) => setIndiaVix(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 13.8"
                className="w-full bg-[#1e293b] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-2">Additional Market Context & Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Market opened gap-up. Strong resistance near 25,200. Watching 25,000 support."
              className="w-full bg-[#1e293b] border border-gray-700 rounded-xl p-3 text-sm text-gray-100 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Section 4: Analyze Button (Section 9) */}
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
            <span>Analyze Market</span>
          </button>
        </div>
      </form>

      {/* Progress Overlay */}
      <AnalysisProgress isOpen={isAnalyzing} />
    </div>
  );
};
