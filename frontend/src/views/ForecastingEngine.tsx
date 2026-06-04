import React, { useEffect, useState } from 'react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { LineChart as ChartIcon, Settings, Compass, Info } from 'lucide-react';

interface ForecastingEngineProps {
  filters: any;
}

export const ForecastingEngine: React.FC<ForecastingEngineProps> = ({
  filters,
}) => {
  const [metric, setMetric] = useState<'revenue' | 'profit' | 'customers'>('revenue');
  const [model, setModel] = useState<'moving_average' | 'exponential_smoothing' | 'linear'>('linear');
  const [data, setData] = useState<{ historical: any[]; forecast: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  const formatCurrency = (val: number) => {
    if (metric === 'customers') return Math.round(val).toLocaleString();
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  useEffect(() => {
    const fetchForecast = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('metric', metric);
        queryParams.append('model', model);
        
        if (filters.startDate) queryParams.append('startDate', filters.startDate.toISOString());
        if (filters.endDate) queryParams.append('endDate', filters.endDate.toISOString());
        if (filters.region && filters.region !== 'all') queryParams.append('region', filters.region);
        if (filters.product && filters.product !== 'all') queryParams.append('product', filters.product);
        if (filters.customerType && filters.customerType !== 'all') queryParams.append('customerType', filters.customerType);

        const response = await fetch(`http://localhost:5000/api/analytics/forecast?${queryParams.toString()}`);
        const result = await response.json();
        setData(result);
      } catch (e) {
        console.error("Error fetching forecasting data", e);
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, [filters, metric, model]);

  // Format combined data for continuous chart lines
  const getChartData = () => {
    if (!data) return [];
    const { historical, forecast } = data;
    
    const chartRows: any[] = [];
    
    // Push historical points
    historical.forEach((h) => {
      chartRows.push({
        year_month: h.year_month,
        Historical: h.value,
        Forecast: null
      });
    });
    
    // Add overlapping point to connect lines
    if (historical.length > 0 && forecast.length > 0) {
      chartRows[chartRows.length - 1].Forecast = historical[historical.length - 1].value;
    }
    
    // Push forecast points
    forecast.forEach((f) => {
      chartRows.push({
        year_month: f.year_month,
        Historical: null,
        Forecast: f.value
      });
    });
    
    return chartRows;
  };

  const chartData = getChartData();

  // Get description for current forecasting model
  const getModelDetails = () => {
    switch (model) {
      case 'moving_average':
        return {
          title: "Simple Moving Average (Window = 4 Months)",
          math: "F(t+1) = [Y(t) + Y(t-1) + Y(t-2) + Y(t-3)] / 4",
          description: "Calculates the average of the last 4 monthly points. Excellent for eliminating noise and seasonal blips in stable markets, but reacts slowly to sharp recent trends or rapid growth pivots.",
          suitability: "Highly stable products with low cyclic fluctuation."
        };
      case 'exponential_smoothing':
        return {
          title: "Holt's Linear Exponential Smoothing (Double Smoothing)",
          math: "L(t) = a * Y(t) + (1-a)*(L(t-1) + T(t-1)); T(t) = b * [L(t) - L(t-1)] + (1-b)*T(t-1)",
          description: "Applies smoothing factors for level (alpha = 0.4) and trend (beta = 0.2). Captures local growth trends and projects them forward. Excellent for mid-to-long term forecasts in expansion phases.",
          suitability: "Cloud SaaS products experiencing steady growth or expansion."
        };
      case 'linear':
      default:
        return {
          title: "Ordinary Least Squares (OLS) Linear Regression",
          math: "Y = beta_0 + beta_1 * X (where X is month index)",
          description: "Fits a straight regression line through the historical time series and projects it linearly. Best for identifying long-term macro trajectories, but ignores seasonal peaks/dips.",
          suitability: "General yearly budget allocations and macro planning."
        };
    }
  };

  const modelDetails = getModelDetails();

  const getMetricAverage = (list: any[]) => {
    if (!list || list.length === 0) return 0;
    return list.reduce((acc, curr) => acc + curr.value, 0) / list.length;
  };

  const avgForecast = data?.forecast ? getMetricAverage(data.forecast) : 0;
  const avgHistory = data?.historical ? getMetricAverage(data.historical) : 0;
  const trendPct = avgHistory > 0 ? ((avgForecast - avgHistory) / avgHistory * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Predictive Analytics & Forecasting Engine</h2>
          <p className="text-xs text-slate-500 font-medium">Project sales metrics 12 months out using standard statistical models.</p>
        </div>
        
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Metric Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setMetric('revenue')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${metric === 'revenue' ? 'bg-white dark:bg-slate-850 text-teal-600 dark:text-teal-400 shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
            >
              Revenue
            </button>
            <button
              onClick={() => setMetric('profit')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${metric === 'profit' ? 'bg-white dark:bg-slate-850 text-indigo-650 dark:text-indigo-400 shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
            >
              Profit
            </button>
            <button
              onClick={() => setMetric('customers')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${metric === 'customers' ? 'bg-white dark:bg-slate-850 text-rose-600 dark:text-rose-450 shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
            >
              Customers
            </button>
          </div>

          {/* Model Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setModel('linear')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${model === 'linear' ? 'bg-white dark:bg-slate-850 text-slate-800 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Linear Regression
            </button>
            <button
              onClick={() => setModel('exponential_smoothing')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${model === 'exponential_smoothing' ? 'bg-white dark:bg-slate-850 text-slate-800 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Exponential Smoothing
            </button>
            <button
              onClick={() => setModel('moving_average')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${model === 'moving_average' ? 'bg-white dark:bg-slate-850 text-slate-800 dark:text-white shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Moving Avg
            </button>
          </div>
        </div>
      </div>

      {/* Visual Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Forecast Graph */}
        <div className="glass-card rounded-2xl p-6 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                12-Month Projected {metric === 'customers' ? 'New Customers' : metric}
              </h4>
              <p className="text-xs text-slate-400">Historical trend line transition into forecasting envelope</p>
            </div>
            <ChartIcon className="text-teal-500 h-5 w-5" />
          </div>

          <div className="h-[340px] w-full">
            {loading ? (
              <div className="w-full h-full bg-slate-100 dark:bg-slate-900 animate-pulse rounded-lg" />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                  <XAxis dataKey="year_month" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} tickFormatter={(v) => metric === 'customers' ? `${(v/1e3).toFixed(0)}k` : `$${(v/1e3).toFixed(0)}k`} />
                  <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="Historical" name="Historical Actual" stroke="#94A3B8" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="Forecast" name="Projected Model" stroke="#0D9488" strokeWidth={2.5} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">No chart data generated</div>
            )}
          </div>
        </div>

        {/* Model info panel */}
        <div className="flex flex-col gap-6">
          {/* Trend Summary */}
          <div className="glass-card rounded-2xl p-6 shadow-xs flex-1 flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                <Compass className="text-indigo-500 h-4 w-4" /> Projection Metrics
              </h4>
              
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-slate-500 block font-medium">Avg Projected Monthly Value</span>
                  <span className="text-xl font-bold text-slate-900 dark:text-white">
                    {loading ? '...' : formatCurrency(avgForecast)}
                  </span>
                </div>
                
                <div>
                  <span className="text-xs text-slate-500 block font-medium">Trajectory Shift (YoY/Aggregate)</span>
                  <span className={`text-sm font-bold ${trendPct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {loading ? '...' : `${trendPct >= 0 ? '+' : ''}${trendPct.toFixed(1)}% variance vs history`}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-6 text-xs text-slate-500 leading-relaxed">
              <span className="font-bold text-slate-700 dark:text-slate-350 block mb-1">Executive Advisory:</span>
              Use linear trends for high-level fiscal targets, but favor exponential smoothing for customer and cloud pipeline planning, as it adjusts dynamically to market momentum shifts.
            </div>
          </div>

          {/* Model Mathematical configuration */}
          <div className="glass-card rounded-2xl p-6 shadow-xs border-l-4 border-l-teal-500">
            <h5 className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
              <Settings className="h-4.5 w-4.5 text-teal-500" /> Model Configuration
            </h5>
            
            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">{modelDetails.title}</span>
                <span className="text-slate-450 block font-medium">Applied Formula:</span>
                <code className="text-[10px] text-teal-600 dark:text-teal-400 bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded block mt-1 overflow-x-auto">{modelDetails.math}</code>
              </div>
              
              <p className="text-slate-500 leading-relaxed">{modelDetails.description}</p>
              
              <div className="flex items-start gap-1.5 bg-slate-100/50 dark:bg-slate-900/30 p-2 rounded-lg text-slate-600 dark:text-slate-400">
                <Info className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-[10px]">Optimal Use Case:</span>
                  <span>{modelDetails.suitability}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
