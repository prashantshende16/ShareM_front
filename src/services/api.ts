import {
  Analysis,
  AnalysisResult,
  DashboardStats,
  Screenshot,
  WatchlistItem,
  SettingsStatus,
  CompareData,
  LiveMarketOverviewResponse,
  LiveAnalysisRequest,
  OptionIndicator5m
} from '../types';

const API_BASE = '/api/v1';

export const api = {
  // Stats
  async getStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/analyses/stats`);
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  },

  // Analyses
  async getAnalyses(params?: {
    symbol?: string;
    market?: string;
    bias?: string;
    min_confidence?: number;
  }): Promise<Analysis[]> {
    const query = new URLSearchParams();
    if (params?.symbol) query.append('symbol', params.symbol);
    if (params?.market) query.append('market', params.market);
    if (params?.bias) query.append('bias', params.bias);
    if (params?.min_confidence) query.append('min_confidence', params.min_confidence.toString());

    const res = await fetch(`${API_BASE}/analyses?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch analyses');
    return res.json();
  },

  async getAnalysis(id: number | string): Promise<Analysis> {
    const res = await fetch(`${API_BASE}/analyses/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch analysis ${id}`);
    return res.json();
  },

  async getAnalysisResult(id: number | string): Promise<AnalysisResult> {
    const res = await fetch(`${API_BASE}/analyses/${id}/result`);
    if (!res.ok) throw new Error(`Failed to fetch result for analysis ${id}`);
    return res.json();
  },

  async createAnalysis(data: Partial<Analysis>): Promise<Analysis> {
    const res = await fetch(`${API_BASE}/analyses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create analysis');
    }
    return res.json();
  },

  async deleteAnalysis(id: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/analyses/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete analysis');
    return res.json();
  },

  async deleteAllAnalyses(): Promise<{ message: string; deleted_count: number }> {
    const res = await fetch(`${API_BASE}/analyses`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete all analyses');
    return res.json();
  },

  async uploadScreenshot(analysisId: number, file: File, timeframe: string): Promise<Screenshot> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('timeframe', timeframe);

    const res = await fetch(`${API_BASE}/analyses/${analysisId}/screenshots`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to upload screenshot');
    }
    return res.json();
  },

  async deleteScreenshot(screenshotId: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/screenshots/${screenshotId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete screenshot');
    return res.json();
  },

  async runAnalysis(id: number): Promise<Analysis> {
    const res = await fetch(`${API_BASE}/analyses/${id}/run`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Analysis execution failed');
    }
    return res.json();
  },

  async compareAnalyses(id1: number, id2: number): Promise<CompareData> {
    const res = await fetch(`${API_BASE}/analyses/compare/${id1}/${id2}`);
    if (!res.ok) throw new Error('Failed to compare analyses');
    return res.json();
  },

  // Watchlist
  async getWatchlist(): Promise<WatchlistItem[]> {
    const res = await fetch(`${API_BASE}/watchlist`);
    if (!res.ok) throw new Error('Failed to fetch watchlist');
    return res.json();
  },

  async addToWatchlist(symbol: string, market = 'NSE'): Promise<WatchlistItem> {
    const res = await fetch(`${API_BASE}/watchlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, market }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to add to watchlist');
    }
    return res.json();
  },

  async removeFromWatchlist(id: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/watchlist/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to remove from watchlist');
    return res.json();
  },

  // Settings
  async getSettings(): Promise<SettingsStatus> {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  },

  async updateSettings(data: {
    ai_provider?: string;
    openai_api_key?: string;
    gemini_api_key?: string;
    anthropic_api_key?: string;
    angel_one_api_key?: string;
    angel_one_client_code?: string;
    angel_one_pin?: string;
    angel_one_totp_key?: string;
    data_source_preference?: string;
  }): Promise<SettingsStatus> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return res.json();
  },

  async testAIConnection(): Promise<{ status: string; provider: string; message: string }> {
    const res = await fetch(`${API_BASE}/settings/test-connection`, {
      method: 'POST',
    });
    return res.json();
  },

  async testAngelOneConnection(): Promise<{ status: string; provider: string; connected: boolean; message: string; sample_quote?: any }> {
    const res = await fetch(`${API_BASE}/settings/test-angel-one`, {
      method: 'POST',
    });
    return res.json();
  },

  async getAngelOneStatus(): Promise<{ provider: string; is_free: boolean; configured: boolean; active: boolean; client_code: string; message: string }> {
    const res = await fetch(`${API_BASE}/settings/angel-one/status`);
    if (!res.ok) throw new Error('Failed to fetch Angel One status');
    return res.json();
  },

  // Live Market (Phase 2)
  async getLiveOverview(): Promise<LiveMarketOverviewResponse> {
    const res = await fetch(`${API_BASE}/market/overview`);
    if (!res.ok) throw new Error('Failed to fetch live market overview');
    return res.json();
  },

  async analyzeLiveMarket(data: LiveAnalysisRequest): Promise<{ status: string; analysis_id: number; message: string }> {
    const res = await fetch(`${API_BASE}/market/analyze-live`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to start live market analysis');
    }
    return res.json();
  },

  async getOptionIndicatorSignal(
    symbol = 'NIFTY 50',
    expiryType = 'current',
    strike?: number,
    optionType?: string,
    timeframe = '5m'
  ): Promise<{
    status: string;
    symbol: string;
    yf_symbol: string;
    expiry_type?: string;
    timeframe?: string;
    signal: OptionIndicator5m;
  }> {
    let url = `${API_BASE}/market/option-signal?symbol=${encodeURIComponent(symbol)}&expiry_type=${encodeURIComponent(expiryType)}&timeframe=${encodeURIComponent(timeframe)}`;
    if (strike) url += `&strike=${strike}`;
    if (optionType) url += `&option_type=${encodeURIComponent(optionType)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch option indicator signal');
    return res.json();
  },

  async getAllOptionIndicatorSignals(expiryType = 'current', timeframe = '5m'): Promise<{
    status: string;
    timestamp: string;
    timestamp_iso: string;
    valid_until: string;
    timeframe?: string;
    total_markets: number;
    signals: Record<string, OptionIndicator5m>;
  }> {
    const res = await fetch(`${API_BASE}/market/all-option-signals?expiry_type=${encodeURIComponent(expiryType)}&timeframe=${encodeURIComponent(timeframe)}`);
    if (!res.ok) throw new Error('Failed to fetch all-market option signals');
    return res.json();
  },

  async getGlobalRadar(): Promise<{
    status: string;
    data: import('../types').GlobalRadarData;
  }> {
    const res = await fetch(`${API_BASE}/market/global-radar`);
    if (!res.ok) throw new Error('Failed to fetch global market radar');
    return res.json();
  },

  async getSurgeRadar(date?: string, force = false): Promise<{
    status: string;
    macro_radar: {
      dow_jones: { name: string; price: number; change: number; change_pct: number };
      nasdaq: { name: string; price: number; change: number; change_pct: number };
      india_vix: { name: string; price: number; change: number; change_pct: number; status: string; bias: string };
      us_trend: string;
      us_avg_change: number;
      macro_verdict: string;
      call_boost: number;
      put_boost: number;
    };
    selected_date?: string;
    today_date?: string;
    available_dates?: Array<{ date: string; label: string; count: number; is_today?: boolean }>;
    grouped_by_date?: Record<string, any[]>;
    suggestions: Array<{
      id: string;
      symbol: string;
      contract_name: string;
      tradingsymbol?: string;
      symboltoken?: string;
      action: string;
      option_type: 'CE' | 'PE';
      strike_price: number;
      expiry: string;
      timeframe: string;
      lots: number;
      lot_size: number;
      total_quantity: number;
      surge_pct: number;
      surge_badge: string;
      surge_tier: string;
      volume_ratio: number;
      delta: number;
      entry_price: number;
      current_ltp: number;
      stop_loss: number;
      target_1: number;
      target_2: number;
      risk_reward: string;
      confidence_score: number;
      macro_confluence: string;
      dow_change: number;
      nasdaq_change: number;
      india_vix: number;
      detected_date?: string;
      detected_date_label?: string;
      detected_time?: string;
      detected_at: string;
      detected_timestamp: number;
      is_hot: boolean;
      summary: string;
    }>;
    unread_alerts_count: number;
    last_scanned_at: string;
    total_suggestions: number;
  }> {
    let url = `${API_BASE}/market/surge-radar?force=${force}`;
    if (date) url += `&date=${encodeURIComponent(date)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch surge radar');
    return res.json();
  },

  async resetSurgeNotifications(): Promise<any> {
    const res = await fetch(`${API_BASE}/market/surge-radar/reset-notifications`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to reset surge notifications');
    return res.json();
  },

  async getAIMarketStrategy(
    symbol = 'NIFTY 50',
    timeframe = '5m',
    expiryType = 'current'
  ): Promise<import('../types').AIMarketStrategyResponse> {
    const res = await fetch(`${API_BASE}/market/ai-strategy-agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, timeframe, expiry_type: expiryType }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to execute AI market strategy agent');
    }
    return res.json();
  },

  async analyzeAllLiveMarkets(): Promise<{
    status: string;
    message: string;
    analyses: Array<{ symbol: string; analysis_id: number }>;
  }> {
    const res = await fetch(`${API_BASE}/market/analyze-all-live`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to initiate live analyses for all markets');
    return res.json();
  },

  // Trade & Margin Management
  async getProfileMargin(): Promise<import('../types').ProfileMarginData> {
    const res = await fetch(`${API_BASE}/trades/profile-margin`);
    if (!res.ok) throw new Error('Failed to fetch profile & margin');
    return res.json();
  },

  async getTrades(status?: string): Promise<import('../types').TradePosition[]> {
    let url = `${API_BASE}/trades`;
    if (status) url += `?status=${encodeURIComponent(status)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch trades');
    return res.json();
  },

  async createTrade(trade: Partial<import('../types').TradePosition>): Promise<import('../types').TradePosition> {
    const res = await fetch(`${API_BASE}/trades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trade),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create trade');
    }
    return res.json();
  },

  async oneClickBatchAddTrades(params: {
    indices?: string[];
    timeframe?: string;
    expiry_type?: string;
    lots?: number;
    trade_mode?: string;
  } = {}): Promise<import('../types').OneClickBatchResponse> {
    const res = await fetch(`${API_BASE}/trades/one-click-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        indices: params.indices || ['NIFTY 50', 'BANK NIFTY', 'SENSEX', 'FINNIFTY'],
        timeframe: params.timeframe || '5m',
        expiry_type: params.expiry_type || 'current',
        lots: params.lots || 1,
        trade_mode: params.trade_mode || 'PAPER'
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to execute 1-Click batch trades');
    }
    return res.json();
  },

  async bookTarget1(tradeId: number): Promise<{
    status: string;
    message: string;
    trade: Partial<import('../types').TradePosition>;
  }> {
    const res = await fetch(`${API_BASE}/trades/${tradeId}/book-target-1`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to book Target 1');
    }
    return res.json();
  },

  async bookTarget2(tradeId: number): Promise<{
    status: string;
    message: string;
    trade: Partial<import('../types').TradePosition>;
  }> {
    const res = await fetch(`${API_BASE}/trades/${tradeId}/book-target-2`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to book Target 2');
    }
    return res.json();
  },

  async closeAllTrades(): Promise<{
    status: string;
    message: string;
    closed_count: number;
    total_realized_pnl: number;
  }> {
    const res = await fetch(`${API_BASE}/trades/close-all`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to close all trades');
    }
    return res.json();
  },

  async closeTrade(tradeId: number): Promise<{
    status: string;
    message: string;
    realized_pnl: number;
  }> {
    const res = await fetch(`${API_BASE}/trades/${tradeId}/close`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to close trade');
    }
    return res.json();
  },

  async trailStopLoss(tradeId: number, newStopLoss?: number): Promise<{
    status: string;
    message: string;
    stop_loss: number;
  }> {
    const res = await fetch(`${API_BASE}/trades/${tradeId}/trail-sl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_stop_loss: newStopLoss }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to trail stop loss');
    }
    return res.json();
  },

  async deleteTrade(tradeId: number): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE}/trades/${tradeId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete trade');
    return res.json();
  },

  async clearAllTrades(): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE}/trades`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to clear trades');
    return res.json();
  }
};
