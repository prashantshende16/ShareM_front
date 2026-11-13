import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  ArrowLeft,
  Zap,
  TrendingUp,
  TrendingDown,
  Layers,
  Clock,
  Shield,
  Target,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Wallet,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Sliders,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { OptionContractSearchResult, ProfileMarginData } from '../types';
import { ActiveTradesManager } from '../components/ActiveTradesManager';

export const ManualTradePage: React.FC = () => {
  const queryClient = useQueryClient();

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('56000');
  const [optionTypeFilter, setOptionTypeFilter] = useState<'ALL' | 'CE' | 'PE'>('ALL');
  const [selectedContract, setSelectedContract] = useState<OptionContractSearchResult | null>(null);

  // Order Ticket State (mirrors screenshot 1)
  const [action, setAction] = useState<'BUY' | 'SELL'>('BUY');
  const [lots, setLots] = useState<number>(1);
  const [customEntryPrice, setCustomEntryPrice] = useState<string>('');
  const [productType, setProductType] = useState<string>('Intraday (Auto cut-off at 3:30 PM today)');
  const [showMore, setShowMore] = useState<boolean>(false);
  const [stopLossInput, setStopLossInput] = useState<string>('');
  const [target1Input, setTarget1Input] = useState<string>('');
  const [target2Input, setTarget2Input] = useState<string>('');
  const [tradeMode, setTradeMode] = useState<'PAPER' | 'LIVE'>('PAPER');
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);

  // Fetch search results
  const {
    data: searchData,
    isLoading: isSearching,
    refetch: refetchSearch,
    isFetching: isFetchingSearch
  } = useQuery({
    queryKey: ['search-options', searchQuery, optionTypeFilter],
    queryFn: () => api.searchOptionContracts(searchQuery, optionTypeFilter, 50),
    staleTime: 10000,
    placeholderData: (prev) => prev
  });

  // Fetch margin / portfolio balance
  const { data: profileMargin } = useQuery<ProfileMarginData>({
    queryKey: ['profile-margin'],
    queryFn: () => api.getProfileMargin(),
    refetchInterval: 10000
  });

  // Live Quote Polling for selected contract
  const { data: quoteData } = useQuery({
    queryKey: ['contract-quote', selectedContract?.id],
    queryFn: () =>
      selectedContract
        ? api.getContractQuote({
            symbol: selectedContract.symbol,
            strike: selectedContract.strike_price,
            option_type: selectedContract.option_type,
            expiry: selectedContract.expiry,
            tradingsymbol: selectedContract.tradingsymbol,
            symboltoken: selectedContract.symboltoken,
            exchange: selectedContract.exchange
          })
        : null,
    enabled: !!selectedContract,
    refetchInterval: 3000
  });

  // When a contract is selected, initialize form
  useEffect(() => {
    if (selectedContract) {
      const currentPrice = quoteData?.data?.ltp || selectedContract.ltp;
      setCustomEntryPrice(currentPrice.toString());
      // Default SL (10% below entry for BUY, 10% above for SELL)
      const sl = action === 'BUY' ? Math.max(0.5, currentPrice * 0.9) : currentPrice * 1.1;
      const t1 = action === 'BUY' ? currentPrice * 1.25 : Math.max(0.5, currentPrice * 0.75);
      const t2 = action === 'BUY' ? currentPrice * 1.45 : Math.max(0.5, currentPrice * 0.55);
      setStopLossInput(sl.toFixed(1));
      setTarget1Input(t1.toFixed(1));
      setTarget2Input(t2.toFixed(1));
      setLots(1);
    }
  }, [selectedContract]);

  // Order submission mutation
  const createTradeMutation = useMutation({
    mutationFn: (tradePayload: any) => api.createTrade(tradePayload),
    onSuccess: (res, vars) => {
      setOrderSuccessMsg(
        `✅ Successfully placed ${vars.action} ${vars.lots} Lot (${vars.quantity} Qty) of ${vars.contract_name} at ₹${vars.entry_price}!`
      );
      queryClient.invalidateQueries({ queryKey: ['trades'] });
      queryClient.invalidateQueries({ queryKey: ['profile-margin'] });
      queryClient.invalidateQueries({ queryKey: ['navbar-active-trades'] });
      setTimeout(() => setOrderSuccessMsg(null), 7000);
      setSelectedContract(null); // Return to search
    },
    onError: (err: any) => {
      alert(`Order placement failed: ${err?.message || err}`);
    }
  });

  const handleSelectContract = (contract: OptionContractSearchResult) => {
    setSelectedContract(contract);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentLTP = quoteData?.data?.ltp || selectedContract?.ltp || 0;
  const currentChange = quoteData?.data?.change ?? selectedContract?.change ?? 0;
  const currentChangePct = quoteData?.data?.change_pct ?? selectedContract?.change_pct ?? 0;
  const lotSize = selectedContract?.lot_size || 30;
  const totalQuantity = lots * lotSize;
  const entryPriceNum = parseFloat(customEntryPrice) || currentLTP;
  const totalCapitalRequired = entryPriceNum * totalQuantity;
  const oneLotCapital = entryPriceNum * lotSize;

  const handleSubmitOrder = () => {
    if (!selectedContract) return;

    const slNum = parseFloat(stopLossInput) || (action === 'BUY' ? entryPriceNum * 0.9 : entryPriceNum * 1.1);
    const t1Num = parseFloat(target1Input) || (action === 'BUY' ? entryPriceNum * 1.25 : entryPriceNum * 0.75);
    const t2Num = parseFloat(target2Input) || (action === 'BUY' ? entryPriceNum * 1.45 : entryPriceNum * 0.55);

    createTradeMutation.mutate({
      symbol: selectedContract.symbol,
      contract_name: selectedContract.contract_name,
      exchange: selectedContract.exchange,
      tradingsymbol: selectedContract.tradingsymbol,
      symboltoken: selectedContract.symboltoken,
      action: action,
      option_type: selectedContract.option_type,
      strike_price: selectedContract.strike_price,
      expiry: selectedContract.raw_expiry,
      timeframe: productType.includes('Intraday') ? 'Intraday' : 'Carry Forward',
      lots: lots,
      lot_size: lotSize,
      quantity: totalQuantity,
      entry_price: entryPriceNum,
      current_ltp: currentLTP,
      stop_loss: slNum,
      target_1: t1Num,
      target_2: t2Num,
      trade_mode: tradeMode,
      notes: `Manual Trade placed via Search Terminal (${productType})`
    });
  };

  const contractsList = searchData?.contracts || [];
  const availableMargin = profileMargin?.live_rms?.available_margin || profileMargin?.paper_portfolio?.available_balance || 991596.74;

  const quickSearchChips = [
    { label: '56000 (BANK NIFTY)', query: '56000' },
    { label: '76000 (SENSEX)', query: '76000' },
    { label: '25000 (NIFTY 50)', query: '25000' },
    { label: '24000 (FINNIFTY)', query: '24000' },
    { label: 'BANK NIFTY ATM', query: 'BANKNIFTY' },
    { label: 'SENSEX ATM', query: 'SENSEX' }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-tr from-sky-500 to-indigo-600 rounded-xl shadow-lg shadow-sky-500/20 text-white">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center space-x-2">
              <span>Manual Option Trading Terminal</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                PAPER & LIVE
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Search any strike number (56000, 76000, 25000) or contract. Pick CE or PE, Buy or Sell, select lots, and execute.
            </p>
          </div>
        </div>

        {/* Available Margin Pill */}
        <div className="flex items-center space-x-3 bg-slate-950/80 border border-slate-800 px-4 py-2.5 rounded-xl shrink-0">
          <Wallet className="w-4 h-4 text-emerald-400" />
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Available Margin</span>
            <span className="text-sm font-extrabold text-white font-mono">
              ₹{Math.round(availableMargin).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {orderSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-sm flex items-center justify-between shadow-lg shadow-emerald-950/40 animate-fade-in">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-semibold">{orderSuccessMsg}</span>
          </div>
          <button onClick={() => setOrderSuccessMsg(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* VIEW 1: ORDER PLACEMENT SCREEN (Image 1 replica when a contract is selected) */}
      {selectedContract ? (
        <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-5 sm:p-7 shadow-2xl space-y-6 max-w-2xl mx-auto">
          {/* Header with Back Arrow and Contract Info */}
          <div className="flex items-start justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSelectedContract(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                title="Back to Search"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {selectedContract.contract_name}
                </h2>
                <div className="flex items-center space-x-2 mt-0.5 text-xs font-mono">
                  <span className="text-slate-400">LTP:</span>
                  <span className="font-bold text-white text-sm">₹{currentLTP}</span>
                  <span
                    className={`font-semibold ${
                      currentChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {currentChange >= 0 ? `+${currentChange}` : currentChange} ({currentChangePct}%)
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {selectedContract.tag}
              </span>
              <span className="text-[10px] text-slate-500 block font-mono mt-1">
                Expiry: {selectedContract.expiry}
              </span>
            </div>
          </div>

          {/* BUY / SELL Segment Buttons (exactly as shown in screenshot 1) */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAction('BUY')}
              className={`py-3 px-4 rounded-xl font-black text-sm tracking-wide transition border-2 flex items-center justify-center space-x-2 ${
                action === 'BUY'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span>Buy</span>
            </button>
            <button
              type="button"
              onClick={() => setAction('SELL')}
              className={`py-3 px-4 rounded-xl font-black text-sm tracking-wide transition border-2 flex items-center justify-center space-x-2 ${
                action === 'SELL'
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500 shadow-lg shadow-rose-500/10'
                  : 'bg-slate-950/40 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span>Sell</span>
            </button>
          </div>

          {/* Lots & Entry Price Inputs (mirrors screenshot 1) */}
          <div className="grid grid-cols-2 gap-4">
            {/* Lots Input with dynamic Quantity calculation */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Lots</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={lots}
                  onChange={(e) => setLots(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-950/70 border-b-2 border-slate-700 focus:border-sky-500 text-white font-mono text-base px-3 py-2 outline-none transition"
                />
              </div>
              <span className="text-xs text-slate-400 font-mono mt-1 block">
                {totalQuantity} Quantity <span className="text-slate-500">(1 Lot = {lotSize})</span>
              </span>
            </div>

            {/* Entry Price (defaults to live LTP) */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                Entry Price (optional)
              </label>
              <input
                type="number"
                step="0.05"
                value={customEntryPrice}
                onChange={(e) => setCustomEntryPrice(e.target.value)}
                placeholder={`₹${currentLTP}`}
                className="w-full bg-slate-950/70 border-b-2 border-slate-700 focus:border-sky-500 text-white font-mono text-base px-3 py-2 outline-none transition"
              />
              <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                Market Rate: ₹{currentLTP}
              </span>
            </div>
          </div>

          {/* Timeframe / Product Dropdown (mirrors screenshot 1) */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">Time frame *</label>
            <div className="relative">
              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                className="w-full bg-slate-950/70 border-b-2 border-slate-700 text-slate-200 font-medium text-sm py-2 px-3 outline-none cursor-pointer appearance-none"
              >
                <option value="Intraday (Auto cut-off at 3:30 PM today)">
                  Intraday (Auto cut-off at 3:30 PM today)
                </option>
                <option value="Carry Forward / Normal (Till Expiry)">
                  Carry Forward (Normal)
                </option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Show More Toggle (Stop Loss & Targets) */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowMore(!showMore)}
              className="text-sky-400 hover:text-sky-300 text-xs font-bold flex items-center space-x-1 mx-auto transition"
            >
              <span>{showMore ? 'Hide More' : 'Show More (Stop Loss & Targets)'}</span>
              {showMore ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showMore && (
              <div className="mt-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3 animate-fade-in">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-mono text-rose-400 block mb-1">
                      Stop Loss
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={stopLossInput}
                      onChange={(e) => setStopLossInput(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs px-2.5 py-1.5 outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-mono text-emerald-400 block mb-1">
                      Target 1
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={target1Input}
                      onChange={(e) => setTarget1Input(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs px-2.5 py-1.5 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-mono text-indigo-400 block mb-1">
                      Target 2
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={target2Input}
                      onChange={(e) => setTarget2Input(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs px-2.5 py-1.5 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400">Execution Mode:</span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setTradeMode('PAPER')}
                      className={`px-3 py-1 rounded text-xs font-bold font-mono transition ${
                        tradeMode === 'PAPER'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      PAPER
                    </button>
                    <button
                      type="button"
                      onClick={() => setTradeMode('LIVE')}
                      className={`px-3 py-1 rounded text-xs font-bold font-mono transition ${
                        tradeMode === 'LIVE'
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      LIVE (Angel One)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* DYNAMIC REAL-TIME CALCULATION MATRIX (as requested by user) */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>1 Lot Rate ({lotSize} Qty × ₹{entryPriceNum})</span>
              <span className="font-bold text-slate-200">
                ₹{Math.round(oneLotCapital).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm font-mono border-t border-slate-800 pt-2">
              <span className="text-slate-300 font-semibold">
                Total Required Capital ({lots} {lots === 1 ? 'Lot' : 'Lots'} × {lotSize} Qty)
              </span>
              <span className="text-lg font-black text-amber-300">
                ₹{Math.round(totalCapitalRequired).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>Available Margin: ₹{Math.round(availableMargin).toLocaleString('en-IN')}</span>
              <span>Charges: — (Free Paper Trade)</span>
            </div>
          </div>

          {/* Submit Button (mirrors screenshot 1) */}
          <button
            type="button"
            disabled={createTradeMutation.isPending}
            onClick={handleSubmitOrder}
            className={`w-full py-3.5 px-4 rounded-xl text-base font-extrabold text-white transition shadow-xl active:scale-95 flex items-center justify-center space-x-2 ${
              action === 'BUY'
                ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/30'
                : 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/30'
            }`}
          >
            <Zap className="w-5 h-5" />
            <span>
              {createTradeMutation.isPending
                ? 'Submitting Order...'
                : `Submit (${action} ${lots} ${lots === 1 ? 'Lot' : 'Lots'} • ₹${Math.round(totalCapitalRequired).toLocaleString('en-IN')})`}
            </span>
          </button>
        </div>
      ) : (
        /* VIEW 2: CONTRACT SEARCH SCREEN (Image 2 replica) */
        <div className="space-y-4">
          {/* Search Input Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search strike number (e.g. 56000, 76000, 25000, BANKNIFTY, SENSEX)..."
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-12 pr-10 py-3 text-white font-mono text-sm sm:text-base outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Strike Preset Chips */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs font-mono">
              <span className="text-slate-500 text-[11px] shrink-0">Quick Strikes:</span>
              {quickSearchChips.map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => setSearchQuery(chip.query)}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold shrink-0 transition ${
                    searchQuery === chip.query
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Option Type Filter: ALL, CE, PE */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400">Type:</span>
                {(['ALL', 'CE', 'PE'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setOptionTypeFilter(t)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      optionTypeFilter === t
                        ? t === 'CE'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : t === 'PE'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-slate-700 text-white'
                        : 'bg-slate-800/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    {t === 'ALL' ? 'All Contracts' : t === 'CE' ? 'CALL (CE)' : 'PUT (PE)'}
                  </button>
                ))}
              </div>

              <span className="text-xs font-mono text-slate-400">
                {isSearching ? 'Searching...' : `${contractsList.length} Contracts Found`}
              </span>
            </div>
          </div>

          {/* Search Results List (Mirrors screenshot 2) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl divide-y divide-slate-800/80">
            {isSearching ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-400" />
                <p className="text-xs">Searching official option contracts for '{searchQuery}'...</p>
              </div>
            ) : contractsList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <AlertCircle className="w-8 h-8 mx-auto text-amber-400" />
                <p className="text-sm font-semibold text-slate-300">
                  No contracts found matching '{searchQuery}'
                </p>
                <p className="text-xs text-slate-500">
                  Try typing strike numbers like <strong className="text-slate-300">56000</strong> (Bank Nifty),{' '}
                  <strong className="text-slate-300">76000</strong> (Sensex), or{' '}
                  <strong className="text-slate-300">25000</strong> (Nifty 50).
                </p>
              </div>
            ) : (
              contractsList.map((contract) => {
                const isCE = contract.option_type === 'CE';
                return (
                  <div
                    key={contract.id}
                    onClick={() => handleSelectContract(contract)}
                    className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-800/60 cursor-pointer transition group"
                  >
                    {/* Left: Contract Name and Exchange Tag (as in screenshot 2) */}
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="text-sm sm:text-base font-extrabold text-white group-hover:text-sky-300 transition">
                          {contract.contract_name}
                        </span>
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                            isCE
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {contract.option_type}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-slate-400 mt-1 flex items-center space-x-3">
                        <span>{contract.tag}</span>
                        <span>•</span>
                        <span>1 Lot = {contract.lot_size} Qty</span>
                        <span>•</span>
                        <span className="text-slate-500">Exp: {contract.expiry}</span>
                      </div>
                    </div>

                    {/* Right: LTP and 1-Lot Capital */}
                    <div className="text-right shrink-0">
                      <div className="text-sm sm:text-base font-black font-mono text-white">
                        ₹{contract.ltp}
                      </div>
                      <div className="text-[11px] font-mono text-amber-300 font-semibold mt-0.5">
                        💰 1 Lot: ₹{Math.round(contract.capital_1_lot).toLocaleString('en-IN')}
                      </div>
                      <span
                        className={`text-[10px] font-mono block ${
                          contract.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {contract.change >= 0 ? `+${contract.change}` : contract.change} (
                        {contract.change_pct}%)
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Embedded Active Positions Monitor (so user sees their active manual trades immediately!) */}
      <div className="pt-4 border-t border-slate-800/80">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <Layers className="w-5 h-5 text-sky-400" />
            <span>Active & Closed Trade Positions</span>
          </h3>
          <span className="text-xs text-slate-400">Manage paper & live orders</span>
        </div>
        <ActiveTradesManager />
      </div>
    </div>
  );
};
