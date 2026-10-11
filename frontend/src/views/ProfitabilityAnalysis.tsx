import React, { useEffect, useState } from 'react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, 
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from 'recharts';
import { TrendingUp, Percent, DollarSign, Wallet } from 'lucide-react';
import type { DateFilters, MonthlyTrend, ProfitabilityResponse } from '../types';
import { API_BASE_URL } from '../api';

interface ProfitabilityAnalysisProps {
  filters: DateFilters;
  trends: MonthlyTrend[];
  loading: boolean;
}

const COLORS = ['#F59E0B', '#6366F1', '#EC4899']; // COGS (Amber), OpEx (Indigo), CAC (Pink)

export const ProfitabilityAnalysis: React.FC<ProfitabilityAnalysisProps> = ({
  filters,
  trends,
  loading,
}) => {
  const [profitability, setProfitability] = useState<ProfitabilityResponse | null>(null);
  const [profLoading, setProfLoading] = useState(true);

  const formatCurrency = (val: number | undefined) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  useEffect(() => {
    const fetchProfitability = async () => {
      setProfLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (filters.startDate) queryParams.append('startDate', filters.startDate.toISOString());
        if (filters.endDate) queryParams.append('endDate', filters.endDate.toISOString());
        if (filters.region && filters.region !== 'all') queryParams.append('region', filters.region);
        if (filters.product && filters.product !== 'all') queryParams.append('product', filters.product);
        if (filters.customerType && filters.customerType !== 'all') queryParams.append('customerType', filters.customerType);

        const response = await fetch(`${API_BASE_URL}/api/analytics/profitability?${queryParams.toString()}`);
        const data = await response.json();
        setProfitability(data);
      } catch (e) {
        console.error("Error fetching profitability metrics", e);
      } finally {
        setProfLoading(false);
      }
    };

    fetchProfitability();
  }, [filters]);

  // Convert expenses breakdown to PieChart format
  const getExpensesPieData = () => {
    if (!profitability || !profitability.expenses_breakdown) return [];
    return Object.entries(profitability.expenses_breakdown).map(([key, val]) => ({
      name: key,
      value: val,
    }));
  };

  const expensesPieData = getExpensesPieData();
  const totalExpenses = expensesPieData.reduce((acc, curr) => acc + (curr.value as number), 0);

  // Compute margins for historical monthly data
  const trendsWithMargin = (trends || []).map((t) => ({
    ...t,
    margin: t.revenue > 0 ? round((t.profit / t.revenue) * 100, 2) : 0,
    cost_ratio: t.revenue > 0 ? round((t.expenses / t.revenue) * 100, 2) : 0,
  }));

  function round(value: number, decimals: number) {
    return Number(Math.round(Number(value + 'e' + decimals)) + 'e-' + decimals);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Profitability & Expense Analysis</h2>
        <p className="text-xs text-slate-500 font-medium">Evaluate gross/net margins, operating overheads, and acquisition spending ratios.</p>
      </div>

      {/* KPI mini row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-teal-50 dark:bg-teal-950/30 text-teal-600 rounded-xl">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Total Revenue</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              {profLoading ? '...' : formatCurrency(profitability?.revenue)}
            </span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-600 rounded-xl">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Gross Profit</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              {profLoading ? '...' : formatCurrency(profitability?.gross_profit)}
            </span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 rounded-xl">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Net Profit</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              {profLoading ? '...' : formatCurrency(profitability?.net_profit)}
            </span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 rounded-xl">
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Operating Margin</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              {profLoading ? '...' : `${profitability?.operating_margin}%`}
            </span>
          </div>
        </div>
      </div>

      {/* Main Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Margin Trend Chart */}
        <div className="glass-card rounded-2xl p-6 shadow-xs lg:col-span-2">
          <div className="mb-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Monthly Margins & Cost Trends</h4>
            <p className="text-xs text-slate-400">Net margin % vs cost-to-revenue ratio</p>
          </div>
          <div className="h-[300px]">
            {loading ? (
              <div className="w-full h-full bg-slate-100 dark:bg-slate-900 animate-pulse rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trendsWithMargin} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                  <XAxis dataKey="year_month" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} label={{ value: 'Percent (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#94a3b8', fontSize: 10 } }} />
                  <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="margin" name="Net Profit Margin" fill="#0D9488" radius={[4, 4, 0, 0]} opacity={0.8} />
                  <Line type="monotone" dataKey="cost_ratio" name="Expense to Revenue Ratio" stroke="#EC4899" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Expenses Breakdown Pie Chart */}
        <div className="glass-card rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Expense Breakdown</h4>
            <p className="text-xs text-slate-450">COGS, OpEx, and Customer Acquisition Costs</p>
          </div>

          <div className="h-[200px] w-full flex items-center justify-center relative">
            {profLoading ? (
              <div className="w-[140px] h-[140px] rounded-full bg-slate-100 dark:bg-slate-900 animate-pulse" />
            ) : expensesPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {expensesPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400">No expense breakdown data</div>
            )}
          </div>

          <div className="space-y-2 mt-4">
            {expensesPieData.map((item, idx) => {
              const val = item.value as number;
              const share = totalExpenses > 0 ? ((val / totalExpenses) * 100).toFixed(1) : '0';
              return (
                <div key={item.name} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">{formatCurrency(val)}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{share}% share</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
