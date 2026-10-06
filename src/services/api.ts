import {
  Analysis,
  AnalysisResult,
  DashboardStats,
  Screenshot,
  WatchlistItem,
  SettingsStatus,
  CompareData
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
  }
};
