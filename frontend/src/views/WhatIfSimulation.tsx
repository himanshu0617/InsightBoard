import React, { useEffect, useState } from 'react';
import { Sliders, RefreshCw, BarChart3, TrendingUp, TrendingDown, HelpCircle } from 'lucide-react';
import type { DateFilters, WhatIfSimulationResponse } from '../types';
import { API_BASE_URL } from '../api';

interface WhatIfSimulationProps {
  filters: DateFilters;
}

export const WhatIfSimulation: React.FC<WhatIfSimulationProps> = ({
  filters,
}) => {
  const [marketingDelta, setMarketingDelta] = useState(0);
  const [priceDelta, setPriceDelta] = useState(0);
  const [customerDelta, setCustomerDelta] = useState(0);
  
  const [results, setResults] = useState<WhatIfSimulationResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const formatCurrency = (val: number | undefined) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const handleReset = () => {
    setMarketingDelta(0);
    setPriceDelta(0);
    setCustomerDelta(0);
  };

  useEffect(() => {
    const fetchSimulation = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (filters.startDate) queryParams.append('startDate', filters.startDate.toISOString());
        if (filters.endDate) queryParams.append('endDate', filters.endDate.toISOString());
        if (filters.region && filters.region !== 'all') queryParams.append('region', filters.region);
        if (filters.product && filters.product !== 'all') queryParams.append('product', filters.product);
        if (filters.customerType && filters.customerType !== 'all') queryParams.append('customerType', filters.customerType);

        const response = await fetch(`${API_BASE_URL}/api/analytics/what-if?${queryParams.toString()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            marketingBudgetDelta: marketingDelta,
            priceDelta: priceDelta,
            customerGrowthDelta: customerDelta,
          }),
        });
        const data = await response.json();
        setResults(data);
      } catch (e) {
        console.error("Error running simulation", e);
      } finally {
        setLoading(false);
      }
    };

    // Debounce API calls by 250ms to prevent slider dragging lag
    const timer = setTimeout(() => {
      fetchSimulation();
    }, 250);

    return () => clearTimeout(timer);
  }, [filters, marketingDelta, priceDelta, customerDelta]);

  const varianceClass = (pct: number) => {
    if (pct > 0) return 'text-emerald-600 dark:text-emerald-450';
    if (pct < 0) return 'text-rose-600 dark:text-rose-400';
    return 'text-slate-500';
  };

  const getVarianceIcon = (pct: number) => {
    if (pct > 0) return <TrendingUp className="h-4.5 w-4.5 text-emerald-500" />;
    if (pct < 0) return <TrendingDown className="h-4.5 w-4.5 text-rose-500" />;
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">What-If Decision Simulator</h2>
          <p className="text-xs text-slate-500 font-medium">Model custom budget, pricing, and volume adjustments to estimate bottom-line impacts.</p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-350"
        >
          <RefreshCw className="h-4 w-4" /> Reset Simulator
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sliders Control Panel */}
        <div className="glass-card rounded-2xl p-6 shadow-xs flex flex-col gap-6">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
            <Sliders className="text-teal-500 h-4.5 w-4.5" /> Simulation Controls
          </h4>

          {/* Slider 1: Marketing */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Marketing Budget Shift</span>
              <span className={`font-bold ${marketingDelta >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-rose-500'}`}>
                {marketingDelta >= 0 ? '+' : ''}{marketingDelta}%
              </span>
            </div>
            <input
              type="range"
              min="-50"
              max="100"
              step="5"
              value={marketingDelta}
              onChange={(e) => setMarketingDelta(parseInt(e.target.value))}
              className="w-full accent-teal-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block leading-tight">Scale regional CAC and client acquisition volumes.</span>
          </div>

          {/* Slider 2: Price */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Price Adjustments</span>
              <span className={`font-bold ${priceDelta >= 0 ? 'text-indigo-650 dark:text-indigo-400' : 'text-rose-500'}`}>
                {priceDelta >= 0 ? '+' : ''}{priceDelta}%
              </span>
            </div>
            <input
              type="range"
              min="-30"
              max="30"
              step="1"
              value={priceDelta}
              onChange={(e) => setPriceDelta(parseInt(e.target.value))}
              className="w-full accent-indigo-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block leading-tight">Price shift models standard -0.7 elastic demand curve drops.</span>
          </div>

          {/* Slider 3: Customer Growth */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Organic Customer Growth</span>
              <span className={`font-bold ${customerDelta >= 0 ? 'text-rose-600 dark:text-rose-400' : 'text-rose-500'}`}>
                {customerDelta >= 0 ? '+' : ''}{customerDelta}%
              </span>
            </div>
            <input
              type="range"
              min="-20"
              max="50"
              step="2"
              value={customerDelta}
              onChange={(e) => setCustomerDelta(parseInt(e.target.value))}
              className="w-full accent-rose-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block leading-tight">Adjust organic sales funnel volumes.</span>
          </div>
        </div>

        {/* Projections Display Panel */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Main Results Grid */}
          <div className="glass-card rounded-2xl p-6 shadow-xs">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="text-indigo-500 h-4.5 w-4.5" /> Simulation Outputs
              </h4>
              {loading && <span className="text-xs text-slate-400 animate-pulse-slow">Recalculating...</span>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Revenue projections */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span>Revenue</span>
                  {results && !loading && (
                    <div className="flex items-center gap-1">
                      {getVarianceIcon(results.variance.revenue_pct)}
                      <span className={varianceClass(results.variance.revenue_pct)}>
                        {results.variance.revenue_pct >= 0 ? '+' : ''}{results.variance.revenue_pct}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 block">Simulated:</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white block">
                    {loading ? '...' : formatCurrency(results?.simulated.revenue)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium block">
                    Baseline: {loading ? '...' : formatCurrency(results?.baseline.revenue)}
                  </span>
                </div>
              </div>

              {/* Profit projections */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span>Net Profit</span>
                  {results && !loading && (
                    <div className="flex items-center gap-1">
                      {getVarianceIcon(results.variance.profit_pct)}
                      <span className={varianceClass(results.variance.profit_pct)}>
                        {results.variance.profit_pct >= 0 ? '+' : ''}{results.variance.profit_pct}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 block">Simulated:</span>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-450 block">
                    {loading ? '...' : formatCurrency(results?.simulated.profit)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium block">
                    Baseline: {loading ? '...' : formatCurrency(results?.baseline.profit)}
                  </span>
                </div>
              </div>

              {/* Margin projections */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span>Operating Margin</span>
                  {results && !loading && (
                    <span className={`text-[10px] font-bold ${results.simulated.margin - results.baseline.margin >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {(results.simulated.margin - results.baseline.margin) >= 0 ? '+' : ''}
                      {(results.simulated.margin - results.baseline.margin).toFixed(1)}% shift
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 block">Simulated:</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white block">
                    {loading ? '...' : `${results?.simulated.margin}%`}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium block">
                    Baseline: {loading ? '...' : `${results?.baseline.margin}%`}
                  </span>
                </div>
              </div>
            </div>

            {/* LTV & CAC secondary metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 border-t border-slate-200 dark:border-slate-800 pt-6">
              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-2">Simulated Customer Lifetime Value (LTV)</span>
                <span className="text-lg font-bold text-slate-800 dark:text-white">
                  {loading ? '...' : formatCurrency(results?.simulated.ltv)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Baseline: {loading ? '...' : formatCurrency(results?.baseline.ltv)} (Churn parameter: 12% annually)
                </span>
              </div>
              
              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-2">Simulated Customer Acquisition Cost (CAC)</span>
                <span className={`text-lg font-bold ${results && results.simulated.cac > results.baseline.cac ? 'text-amber-500' : 'text-slate-850 dark:text-white'}`}>
                  {loading ? '...' : formatCurrency(results?.simulated.cac)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Baseline: {loading ? '...' : formatCurrency(results?.baseline.cac)}
                </span>
              </div>
            </div>
          </div>

          {/* Warning / Advisory alert */}
          <div className="glass-card rounded-2xl p-5 shadow-xs border-l-4 border-l-amber-500 flex items-start gap-3">
            <HelpCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-500 leading-relaxed">
              <span className="font-bold text-slate-700 dark:text-slate-350 block mb-1">Decision Analysis Notes:</span>
              Price elasticity coefficients in enterprise cohorts are conservative. An excessive price hike (+20% or more) can lead to churn spike multipliers that negate absolute LTV gains. High marketing spend yields diminishing returns as CAC climbs exponentially. Adjust sliders incrementally.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
