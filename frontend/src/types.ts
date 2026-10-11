export interface DateFilters {
  startDate: Date;
  endDate: Date;
  region: string;
  product: string;
  customerType: string;
}

export interface MonthlyTrend {
  year_month: string;
  revenue: number;
  profit: number;
  expenses: number;
  customers: number;
}

export interface ProductAnalytics {
  name: string;
  category: string;
  revenue: number;
  profit: number;
  volume: number;
}

export interface RegionAnalytics {
  name: string;
  revenue: number;
  profit: number;
  volume: number;
  share: number;
}

export interface DashboardKpis {
  revenue: number;
  profit: number;
  expenses: number;
  margin: number;
  volume: number;
  new_customers: number;
  retained_customers: number;
  mrr: number;
  cac_avg: number;
  revenue_growth: number;
  profit_growth: number;
  cost_growth: number;
  customer_growth: number;
}

export interface DashboardKpiResponse {
  current: Omit<DashboardKpis, 'revenue_growth' | 'profit_growth' | 'cost_growth' | 'customer_growth'>;
  trends: Pick<DashboardKpis, 'revenue_growth' | 'profit_growth' | 'cost_growth' | 'customer_growth'>;
}

export interface RevenueAnalyticsResponse {
  trends: MonthlyTrend[];
  products: ProductAnalytics[];
  regions: RegionAnalytics[];
}

export interface ForecastPoint {
  year_month: string;
  value: number;
}

export interface ForecastResponse {
  historical: ForecastPoint[];
  forecast: ForecastPoint[];
}

export interface ForecastChartRow {
  year_month: string;
  Historical: number | null;
  Forecast: number | null;
}

export interface ProfitabilityResponse {
  revenue: number;
  gross_profit: number;
  net_profit: number;
  operating_margin: number;
  expenses_breakdown: Record<string, number>;
}

export interface Recommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  impact: string;
  difficulty: string;
  actions: string[];
}

export interface SimulationMetrics {
  revenue: number;
  expenses: number;
  profit: number;
  margin: number;
  ltv: number;
  cac: number;
}

export interface WhatIfSimulationResponse {
  baseline: SimulationMetrics;
  simulated: SimulationMetrics;
  variance: {
    revenue_pct: number;
    expenses_pct: number;
    profit_pct: number;
  };
}
