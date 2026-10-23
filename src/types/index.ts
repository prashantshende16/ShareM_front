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

export interface OptionExpiryItem {
  id: string;
  type?: string;
  date: string;
  label: string;
  tag?: string;
  dte?: number;
}

export interface OptionStrikeItem {
  strike: number;
  label: string;
  tag: string;
  is_atm: boolean;
  is_selected: boolean;
}

export interface TradeExecution {
  contract_name: string;
  symbol: string;
  expiry: string;
  strike: string;
  lot_size: number;
  lots: number;
  total_quantity: number;
  current_ltp: number;
  recommended_entry: number;
  stop_loss: number;
  target_1: number;
  target_2: number;
  risk_per_share: number;
  reward_target_1: number;
  reward_target_2: number;
  capital_required: number;
  max_risk_amount: number;
  target_1_profit: number;
  target_2_profit: number;
  risk_reward_ratio: string;
  is_live_angel_one?: boolean;
  day_high?: number;
  day_low?: number;
  day_close?: number;
  day_open?: number;
  tradingsymbol?: string;
}

export interface IndicatorChecklistItem {
  id: number;
  name: string;
  bias: 'CALL' | 'PUT' | 'NEUTRAL';
  status: 'CONFIRMED' | 'CONFLICT' | 'NEUTRAL';
  value: string;
  description?: string;
  detail?: string;
}

export interface ConfluenceScore {
  confirmed: number;
  total: number;
  percentage: number;
  verdict: string;
}

export interface GlobalRadarItem {
  name: string;
  symbol: string;
  region: string;
  code: string;
  price: number;
  change: number;
  change_pct: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

export interface NewsTallyItem {
  title: string;
  date: string;
  url: string;
}

export interface GlobalRadarData {
  global_verdict: string;
  global_score: number;
  us_market_stance: string;
  us_avg_change: number;
  uk_market_stance: string;
  uk_avg_change: number;
  crude_oil_status: string;
  us_indices: GlobalRadarItem[];
  uk_europe_indices: GlobalRadarItem[];
  asia_indices: GlobalRadarItem[];
  commodities_and_forex: GlobalRadarItem[];
  news_tally: NewsTallyItem[];
}

export interface AIMarketStrategyResponse {
  status: string;
  symbol: string;
  evaluated_at: string;
  timestamp_iso: string;
  timeframe: string;
  active_signal: OptionIndicator5m;
  signal_5m_summary: {
    decision: string;
    direction: string;
    confidence: number;
    strike: string;
    confluence_percentage: number;
  };
  signal_15m_summary: {
    decision: string;
    direction: string;
    confidence: number;
    strike: string;
    confluence_percentage: number;
  };
  timeframe_alignment: {
    label: string;
    status: string;
    is_confluent: boolean;
  };
  global_radar: GlobalRadarData;
  agent_strategy: {
    verdict: string;
    conviction: string;
    confidence_score: number;
    macro_global_context: string;
    timeframe_harmony: string;
    technical_edge: string;
    recommended_contract: string;
    live_ltp: number;
    trigger_entry: number;
    stop_loss: number;
    target_1: number;
    target_2: number;
    risk_reward: string;
    holding_horizon: string;
    key_catalysts_and_watchouts: string[];
  };
}

export interface EmergencyExitAlert {
  triggered: boolean;
  severity: 'NORMAL' | 'WARNING' | 'CRITICAL';
  type: string;
  title: string;
  message: string;
  reason?: string;
  action?: string;
  contract?: string;
  current_ltp?: number;
  stop_loss?: number;
  target_1?: number;
  triggered_at?: string;
}

export interface OptionIndicator5m {
  decision: string;
  direction: 'CALL' | 'PUT' | 'SIDEWAYS' | 'NEUTRAL';
  confidence: number;
  call_score: number;
  put_score: number;
  strike_suggestion: string;
  emergency_exit_alert?: EmergencyExitAlert;
  active_expiry?: string;
  active_expiry_type?: string;
  active_expiry_label?: string;
  current_expiry?: string;
  next_expiry?: string;
  is_today_expiry?: boolean;
  available_expiries?: OptionExpiryItem[];
  available_strikes?: OptionStrikeItem[];
  selected_strike?: number;
  selected_option_type?: string;
  is_live_angel_one?: boolean;
  contract_tradingsymbol?: string;
  contract_symboltoken?: string;
  trade_execution?: TradeExecution;
  indicator_checklist?: IndicatorChecklistItem[];
  confluence_score?: ConfluenceScore;
  expiries_data?: Record<string, {
    expiry: string;
    label: string;
    tag?: string;
    dte?: number;
    buy_range: string;
    stop_loss: string;
    target_1: string;
    target_2: string;
    risk_points?: string;
    reward_points?: string;
  }>;
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
  angel_one_configured?: boolean;
  angel_one_client_code?: string;
  data_source_preference?: string;
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

export interface TradePosition {
  id: number;
  symbol: string;
  contract_name: string;
  exchange: string;
  tradingsymbol?: string;
  symboltoken?: string;
  action: 'BUY' | 'SELL';
  option_type: 'CE' | 'PE';
  strike_price?: number;
  expiry?: string;
  timeframe: string;
  lots: number;
  lot_size: number;
  quantity: number;
  entry_price: number;
  current_ltp: number;
  stop_loss: number;
  target_1: number;
  target_2: number;
  margin_required: number;
  max_risk: number;
  target_1_profit: number;
  target_2_profit: number;
  unrealized_pnl: number;
  pnl_percentage: number;
  realized_pnl: number;
  status: 'ACTIVE' | 'TARGET_1_BOOKED' | 'TARGET_2_BOOKED' | 'STOPPED_OUT' | 'CLOSED' | 'CANCELLED';
  is_target_1_hit?: boolean;
  is_target_2_hit?: boolean;
  is_sl_hit?: boolean;
  trade_mode: 'PAPER' | 'LIVE';
  angel_order_id?: string;
  notes?: string;
  entry_time?: string;
  exit_time?: string;
  created_at?: string;
}

export interface ProfileMarginData {
  status: string;
  client_code: string;
  client_name: string;
  is_angel_connected: boolean;
  live_rms: {
    available_margin: number;
    available_cash: number;
    utilized_margin: number;
    unrealized_m2m: number;
    realized_m2m: number;
  };
  paper_portfolio: {
    starting_balance: number;
    available_balance: number;
    margin_blocked: number;
    unrealized_pnl: number;
    realized_pnl: number;
    total_pnl: number;
    open_positions: number;
    total_trades: number;
  };
  exchanges: string[];
}

export interface OneClickBatchResponse {
  status: string;
  message: string;
  trades_count: number;
  total_margin_required: number;
  total_max_risk: number;
  total_target_1_profit: number;
  total_target_2_profit: number;
  trades: Array<{
    id: number;
    symbol: string;
    contract_name: string;
    action: string;
    option_type: string;
    quantity: number;
    current_ltp: number;
    entry_price: number;
    stop_loss: number;
    target_1: number;
    target_2: number;
    margin_required: number;
    max_risk: number;
    target_1_profit: number;
    target_2_profit: number;
    status: string;
    trade_mode: string;
  }>;
}


