import React from 'react';
import { KPICard } from '../components/KPICard';
import { 
  ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { TrendingUp, AlertCircle, ShoppingBag, MapPin } from 'lucide-react';

interface DashboardOverviewProps {
  kpis: any;
  trends: any[];
  products: any[];
  regions: any[];
  loading: boolean;
  onFilterChange: (filters: { region?: string; product?: string }) => void;
  setActiveTab: (tab: string) => void;
}

const COLORS = ['#0D9488', '#6366F1', '#EC4899', '#F59E0B', '#3B82F6', '#8B5CF6'];

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  kpis,
  trends,
  products,
  regions,
  loading,
  onFilterChange,
  setActiveTab,
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const getTrendDirection = (val: number) => {
    if (val > 0) return 'up';
    if (val < 0) return 'down';
    return 'flat';
  };

  // Safe slice for top products
  const topProducts = (products || []).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <KPICard
          title="Total Revenue"
          value={formatCurrency(kpis?.revenue)}
          trend={kpis?.revenue_growth}
          trendDirection={getTrendDirection(kpis?.revenue_growth)}
          subtext="vs previous period"
          loading={loading}
        />
        <KPICard
          title="Net Profit"
          value={formatCurrency(kpis?.profit)}
          trend={kpis?.profit_growth}
          trendDirection={getTrendDirection(kpis?.profit_growth)}
          subtext="vs previous period"
          loading={loading}
        />
        <KPICard
          title="Profit Margin"
          value={`${((kpis?.margin || 0) * 100).toFixed(1)}%`}
          trend={kpis?.profit_growth}
          trendDirection={getTrendDirection(kpis?.profit_growth)}
          subtext="operating margin"
          loading={loading}
        />
        <KPICard
          title="Monthly Recurring Revenue"
          value={formatCurrency(kpis?.mrr)}
          subtext="SaaS products baseline"
          loading={loading}
        />
        <KPICard
          title="Customer Growth"
          value={kpis?.new_customers ? kpis.new_customers.toLocaleString() : '0'}
          trend={kpis?.customer_growth}
          trendDirection={getTrendDirection(kpis?.customer_growth)}
          subtext="new acquisitions"
          loading={loading}
        />
        <KPICard
          title="Average CAC"
          value={formatCurrency(kpis?.cac_avg)}
          subtext="acquisition spend per user"
          loading={loading}
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart (Line + Bar) */}
        <div className="glass-card rounded-2xl p-6 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Revenue & Net Profit Trend</h4>
              <p className="text-xs text-slate-500">Monthly aggregate visual performance</p>
            </div>
            <TrendingUp className="text-teal-500 h-5 w-5" />
          </div>

          <div className="h-[320px] w-full">
            {loading ? (
              <div className="w-full h-full bg-slate-100 dark:bg-slate-900 animate-pulse rounded-lg" />
            ) : trends && trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trends} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                  <XAxis dataKey="year_month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis yAxisId="left" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1e6).toFixed(1)}M`} />
                  <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1e3).toFixed(0)}k`} />
                  <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                  <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#0D9488" radius={[4, 4, 0, 0]} opacity={0.85} />
                  <Line yAxisId="left" type="monotone" dataKey="profit" name="Net Profit" stroke="#6366F1" strokeWidth={3} dot={{ r: 2 }} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-slate-400">No trend data available</div>
            )}
          </div>
        </div>

        {/* Regional Performance breakdown */}
        <div className="glass-card rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Regional Share</h4>
              <p className="text-xs text-slate-500">Market share by revenue contribution</p>
            </div>
            <MapPin className="text-indigo-500 h-5 w-5" />
          </div>

          <div className="h-[250px] w-full flex items-center justify-center">
            {loading ? (
              <div className="w-[180px] h-[180px] bg-slate-100 dark:bg-slate-900 rounded-full animate-pulse" />
            ) : regions && regions.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={regions}
                    dataKey="revenue"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {regions.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-sm text-slate-400">No regional data available</div>
            )}
          </div>

          {/* Region list links (Drill-down trigger) */}
          <div className="space-y-2 mt-4">
            {regions && regions.slice(0, 3).map((r, idx) => (
              <button 
                key={r.name} 
                onClick={() => onFilterChange({ region: r.name })}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-teal-500 transition-colors">{r.name}</span>
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">{r.share}%</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row (Top Products & Quick Recommendations Link) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products */}
        <div className="glass-card rounded-2xl p-6 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Top 5 Revenue Generating Products</h4>
              <p className="text-xs text-slate-500">Sales volume and net profit contributions</p>
            </div>
            <ShoppingBag className="text-rose-500 h-5 w-5" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase">
                  <th className="py-3 px-2">Product</th>
                  <th className="py-3 px-2">Category</th>
                  <th className="py-3 px-2 text-right">Volume</th>
                  <th className="py-3 px-2 text-right">Revenue</th>
                  <th className="py-3 px-2 text-right">Profit Contribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-slate-800 text-sm">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td className="py-3 px-2 animate-pulse bg-slate-200 dark:bg-slate-800 rounded-md my-1 h-6" colSpan={5}></td>
                    </tr>
                  ))
                ) : topProducts.length > 0 ? (
                  topProducts.map((p) => (
                    <tr key={p.name} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-2">
                        <button 
                          onClick={() => onFilterChange({ product: p.name })}
                          className="font-semibold text-slate-850 dark:text-slate-200 hover:text-teal-500 transition-colors text-left"
                        >
                          {p.name}
                        </button>
                      </td>
                      <td className="py-3 px-2 text-xs text-slate-500">{p.category}</td>
                      <td className="py-3 px-2 text-right text-slate-700 dark:text-slate-350">{p.volume.toLocaleString()}</td>
                      <td className="py-3 px-2 text-right font-semibold text-slate-900 dark:text-white">{formatCurrency(p.revenue)}</td>
                      <td className="py-3 px-2 text-right font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(p.profit)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-sm text-slate-400">No products data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Business Recommendations Teaser */}
        <div className="glass-card rounded-2xl p-6 shadow-xs flex flex-col justify-between border-l-4 border-l-amber-500">
          <div>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-4">
              <AlertCircle className="h-5 w-5" />
              <h4 className="text-base font-bold">Strategic Insights Alert</h4>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Our automated recommendation models have detected underperforming regions and high cost-growth areas. 
              These items require executive review to prevent budget creep in the upcoming quarter.
            </p>
          </div>
          <button 
            onClick={() => setActiveTab('recommendations')}
            className="mt-6 w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 transition-all text-white font-bold text-xs uppercase tracking-wider"
          >
            Review Recommendations
          </button>
        </div>
      </div>
    </div>
  );
};
