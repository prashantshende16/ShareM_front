export interface Screenshot {
  id: number;
  analysis_id: number;
  timeframe: string;
  file_path: string;
  file_name: string;
  mime_type: string;
  url: string;
  created_at: string;
}

export interface ScenarioDetail {
  type: 'bullish' | 'bearish' | 'sideways';
  probability: number;
  trigger: string;
  confirmation: string;
  potential_movement: string;
  expected_range: string;
  invalidation: string;
  time_horizon: string;
  risk_level: string;
}

export interface ScenarioPrediction {
  id: number;
  scenario_type: string;
  probability: number;
  expected_direction?: string;
  expected_range?: string;
  timeframe?: string;
  trigger_condition?: string;
  invalidation_condition?: string;
}

export interface SupportResistanceLevel {
  label: string;
  price: number;
  strength?: string;
  description?: string;
}

export interface TimeMovement {
  timeframe: string;
  bias: string;
  confidence: number;
  condition: string;
  expected_behavior: string;
  invalidation: string;
}

export interface MultiTimeframeSynthesis {
  daily_trend?: string;
  hourly_trend?: string;
  fifteen_min_structure?: string;
  five_min_structure?: string;
  overall_bias?: string;
  short_term?: string;
  medium_term?: string;
  long_term?: string;
}

export interface OptionIndicator5m {
  decision: string;
  direction: 'CALL' | 'PUT' | 'SIDEWAYS' | 'NEUTRAL';
  confidence: number;
  call_score: number;
  put_score: number;
  strike_suggestion: string;
  active_expiry?: string;
  option_premium?: {
    buy_range: string;
    stop_loss: string;
    target_1: string;
    target_2: string;
    risk_points: string;
    reward_points: string;
  };
  index_spot?: {
    cmp: number;
    entry_zone: string;
    stop_loss: number;
    target_1: number;
    target_2: number;
    risk_points: number;
    target_points: number;
  };
  entry_price: number;
  stop_loss: number;
  target_1: number;
  target_2: number;
  risk_reward: string;
  timeframe: string;
  expected_holding_time: string;
  generated_at?: string;
  generated_at_iso?: string;
  valid_until?: string;
  last_candle_time?: string;
  patterns_detected: string[];
  indicators: {
    ema_9?: number;
    ema_21?: number;
    rsi_14?: number;
    vwap?: number;
    trend_ribbon?: string;
    vwap_position?: string;
  };
  signals_breakdown: string[];
  summary: string;
}

export interface TradeSetup {
  has_setup: boolean;
  direction: 'CALL' | 'PUT' | 'FUTURE' | 'NO TRADE';
  entry_zone?: string;
  stop_loss?: string;
  target_1?: string;
  target_2?: string;
  risk_reward?: string;
  reason?: string;
  option_indicator_5m?: OptionIndicator5m;
}

export interface RiskAnalysis {
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  setup_quality: 'A' | 'B' | 'C';
  reward_risk: string;
  invalidation: string;
  main_risk: string;
  disclaimer: string;
}

export interface OverlayAnnotation {
  id: string;
  type: 'support' | 'resistance' | 'breakout' | 'breakdown' | 'current_price' | 'pattern';
  label: string;
  price?: number;
  y_percent?: number;
  box?: { x: number; y: number; width: number; height: number };
}

export interface AnalysisResult {
  id: number;
  analysis_id: number;
  trend: string;
  primary_scenario: 'bullish' | 'bearish' | 'sideways';
  confidence_score: number;
  market_structure: {
    trend?: string;
    structure?: string;
    momentum?: string;
    volatility?: string;
    liquidity?: string;
  };
  support_levels: SupportResistanceLevel[];
  resistance_levels: SupportResistanceLevel[];
  candlestick_analysis: {
    patterns_detected?: string[];
    observation?: string;
  };
  volume_analysis: {
    trend?: string;
    observation?: string;
  };
  oi_analysis: {
    pcr_reading?: string;
    observation?: string;
  };
  technical_indicators: {
    moving_averages?: string;
    rsi?: string;
    vwap?: string;
    macd?: string;
  };
  bullish_scenario: ScenarioDetail;
  bearish_scenario: ScenarioDetail;
  sideways_scenario: ScenarioDetail;
  risk_analysis: RiskAnalysis;
  trade_setup: TradeSetup;
  time_movements: TimeMovement[];
  multi_timeframe_synthesis: MultiTimeframeSynthesis;
  detected_overlays: OverlayAnnotation[];
  entry_zone?: string;
  stop_loss_zone?: string;
  target_zone?: string;
  confirmation_conditions: string[];
  invalidating_conditions: string[];
  time_horizon: string;
  ai_summary?: string;
  created_at: string;
}

export interface Analysis {
  id: number;
  user_id?: number;
  market: string;
  instrument?: string;
  instrument_type: string;
  symbol: string;
  expiry?: string;
  strike_price?: number;
  option_type?: string;
  current_price?: number;
  previous_close?: number;
  day_high?: number;
  day_low?: number;
  volume?: string;
  open_interest?: string;
  pcr?: number;
  india_vix?: number;
  notes?: string;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
  updated_at: string;
  screenshots: Screenshot[];
  result?: AnalysisResult;
  scenarios: ScenarioPrediction[];
}

export interface DashboardStats {
  total_analyses: number;
  bullish_scenarios: number;
  bearish_scenarios: number;
  sideways_scenarios: number;
  high_confidence_analyses: number;
}

export interface WatchlistItem {
  id: number;
  symbol: string;
  market: string;
  last_analysis_id?: number;
  last_bias?: string;
  last_confidence?: number;
  last_timeframe?: string;
  last_updated?: string;
}

export interface SettingsStatus {
  current_provider: string;
  available_providers: string[];
  is_openai_configured: boolean;
  is_gemini_configured: boolean;
  is_anthropic_configured: boolean;
  market_data_connected: boolean;
  market_data_status: string;
}

export interface CompareData {
  analysis_1: Analysis;
  analysis_2: Analysis;
  diff: {
    bias_shift: string;
    confidence_shift: string;
    primary_support_1: string | number;
    primary_support_2: string | number;
    primary_resistance_1: string | number;
    primary_resistance_2: string | number;
    trend_comparison: string;
  };
}

export interface LiveIndexOverview {
  name: string;
  symbol: string;
  region: string;
  price: number;
  change: number;
  change_pct: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

export interface HeavyweightStock {
  name: string;
  symbol: string;
  weight: string;
  sector: string;
  price: number;
  change: number;
  change_pct: number;
  rsi_14?: number | null;
}

export interface MarketIncident {
  title: string;
  date: string;
  url: string;
}

export interface LiveMarketOverviewResponse {
  status: string;
  global_sentiment: string;
  indices: LiveIndexOverview[];
  heavyweights: HeavyweightStock[];
  recent_incidents: MarketIncident[];
}

export interface LiveAnalysisRequest {
  symbol: string;
  market: string;
  instrument_type: string;
  notes?: string;
  ai_provider?: string;
}

