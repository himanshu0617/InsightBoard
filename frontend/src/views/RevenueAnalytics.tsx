import React from 'react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, LineChart, Line 
} from 'recharts';
import { TrendingUp, DollarSign, Globe, Layers } from 'lucide-react';

interface RevenueAnalyticsProps {
  trends: any[];
  products: any[];
  regions: any[];
  loading: boolean;
  onFilterChange: (filters: { region?: string; product?: string }) => void;
}

export const RevenueAnalytics: React.FC<RevenueAnalyticsProps> = ({
  trends,
  products,
  regions,
  loading,
  onFilterChange,
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Group trends by quarter for the comparison chart
  const getQuarterlyData = () => {
    if (!trends || trends.length === 0) return [];
    
    const quarterlyMap: Record<string, { label: string; revenue: number; profit: number }> = {};
    
    trends.forEach((item) => {
      const parts = item.year_month.split('-');
      const year = parts[0];
      const month = parseInt(parts[1]);
      const quarter = Math.floor((month - 1) / 3) + 1;
      const key = `${year}-Q${quarter}`;
      
      if (!quarterlyMap[key]) {
        quarterlyMap[key] = { label: key, revenue: 0, profit: 0 };
      }
      quarterlyMap[key].revenue += item.revenue;
      quarterlyMap[key].profit += item.profit;
    });
    
    // Sort and return last 12 quarters
    return Object.values(quarterlyMap)
      .sort((a, b) => a.label.localeCompare(b.label))
      .slice(-12);
  };

  const quarterlyData = getQuarterlyData();

  return (
    <div className="space-y-6">
      {/* Revenue overview text */}
      <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Revenue & Growth Analytics</h2>
          <p className="text-xs text-slate-500">Drill down into product lines, regions, and cyclical trends.</p>
        </div>
      </div>

      {/* Primary Graphs Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue History Line Chart */}
        <div className="glass-card rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="text-teal-500 h-4 w-4" /> Monthly Revenue Trend
            </h4>
          </div>
          <div className="h-[280px]">
            {loading ? (
              <div className="w-full h-full bg-slate-100 dark:bg-slate-900 animate-pulse rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                  <XAxis dataKey="year_month" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} tickFormatter={(v) => `$${(v/1e3).toFixed(0)}k`} />
                  <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                  <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#0D9488" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Quarterly Comparison Bar Chart */}
        <div className="glass-card rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="text-indigo-500 h-4 w-4" /> Quarterly Comparison
            </h4>
          </div>
          <div className="h-[280px]">
            {loading ? (
              <div className="w-full h-full bg-slate-100 dark:bg-slate-900 animate-pulse rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={quarterlyData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} tickFormatter={(v) => `$${(v/1e6).toFixed(1)}M`} />
                  <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                  <Bar dataKey="revenue" name="Quarterly Revenue" fill="#6366F1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Region Breakdown & Product Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Regions table */}
        <div className="glass-card rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Globe className="text-indigo-500 h-4 w-4" /> Region-wise Share
            </h4>
            <div className="space-y-4">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-10 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
                ))
              ) : (
                regions.map((r) => (
                  <div key={r.name} className="flex flex-col gap-1.5 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900/50">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <button 
                        onClick={() => onFilterChange({ region: r.name })}
                        className="text-slate-800 dark:text-slate-200 hover:text-teal-500 transition-colors"
                      >
                        {r.name}
                      </button>
                      <span className="text-slate-900 dark:text-white">{formatCurrency(r.revenue)}</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-teal-500 h-full rounded-full" style={{ width: `${r.share}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Volume: {r.volume.toLocaleString()}</span>
                      <span>{r.share}% share</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Complete Products Table */}
        <div className="glass-card rounded-2xl p-6 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="text-teal-500 h-4 w-4" /> Product Sales Details
            </h4>
            <span className="text-xs text-slate-400">Click on any product to drill down</span>
          </div>

          <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase">
                  <th className="py-2.5 px-2">Product Name</th>
                  <th className="py-2.5 px-2">Category</th>
                  <th className="py-2.5 px-2 text-right">Volume</th>
                  <th className="py-2.5 px-2 text-right">Total Revenue</th>
                  <th className="py-2.5 px-2 text-right">Profit contribution</th>
                  <th className="py-2.5 px-2 text-right">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-slate-800 text-xs">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="py-3 px-2 animate-pulse bg-slate-200 dark:bg-slate-800 rounded-md my-1 h-6" colSpan={6}></td>
                    </tr>
                  ))
                ) : products.length > 0 ? (
                  products.map((p) => {
                    const margin = (p.profit / p.revenue) * 100;
                    return (
                      <tr key={p.name} className="hover:bg-slate-100/50 dark:hover:bg-slate-850/20 transition-colors">
                        <td className="py-2.5 px-2">
                          <button 
                            onClick={() => onFilterChange({ product: p.name })}
                            className="font-semibold text-slate-800 dark:text-slate-200 hover:text-teal-500 transition-colors text-left"
                          >
                            {p.name}
                          </button>
                        </td>
                        <td className="py-2.5 px-2 text-slate-500">{p.category}</td>
                        <td className="py-2.5 px-2 text-right text-slate-700 dark:text-slate-350">{p.volume.toLocaleString()}</td>
                        <td className="py-2.5 px-2 text-right font-semibold text-slate-900 dark:text-white">{formatCurrency(p.revenue)}</td>
                        <td className="py-2.5 px-2 text-right text-emerald-600 dark:text-emerald-400 font-medium">{formatCurrency(p.profit)}</td>
                        <td className={`py-2.5 px-2 text-right font-bold ${margin < 15 ? 'text-amber-500' : 'text-slate-700 dark:text-slate-300'}`}>{margin.toFixed(1)}%</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-slate-400">No products available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
