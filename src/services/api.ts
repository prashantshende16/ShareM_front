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
    optionType?: string
  ): Promise<{
    status: string;
    symbol: string;
    yf_symbol: string;
    expiry_type?: string;
    signal: OptionIndicator5m;
  }> {
    let url = `${API_BASE}/market/option-signal?symbol=${encodeURIComponent(symbol)}&expiry_type=${encodeURIComponent(expiryType)}`;
    if (strike) url += `&strike=${strike}`;
    if (optionType) url += `&option_type=${encodeURIComponent(optionType)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch 5-min option indicator signal');
    return res.json();
  },

  async getAllOptionIndicatorSignals(expiryType = 'current'): Promise<{
    status: string;
    timestamp: string;
    timestamp_iso: string;
    valid_until: string;
    total_markets: number;
    signals: Record<string, OptionIndicator5m>;
  }> {
    const res = await fetch(`${API_BASE}/market/all-option-signals?expiry_type=${encodeURIComponent(expiryType)}`);
    if (!res.ok) throw new Error('Failed to fetch all-market option signals');
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
  }
};
