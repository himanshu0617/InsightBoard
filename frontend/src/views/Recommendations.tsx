import React, { useEffect, useState } from 'react';
import { Lightbulb, CheckSquare, Zap, AlertTriangle, TrendingUp } from 'lucide-react';

interface RecommendationsProps {
  filters: any;
}

export const Recommendations: React.FC<RecommendationsProps> = ({
  filters,
}) => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (filters.startDate) queryParams.append('startDate', filters.startDate.toISOString());
        if (filters.endDate) queryParams.append('endDate', filters.endDate.toISOString());
        if (filters.region && filters.region !== 'all') queryParams.append('region', filters.region);
        if (filters.product && filters.product !== 'all') queryParams.append('product', filters.product);
        if (filters.customerType && filters.customerType !== 'all') queryParams.append('customerType', filters.customerType);

        const response = await fetch(`http://localhost:5000/api/analytics/recommendations?${queryParams.toString()}`);
        const data = await response.json();
        setRecommendations(data);
      } catch (e) {
        console.error("Error fetching recommendations", e);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [filters]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Underperforming Region':
        return <AlertTriangle className="h-5 w-5 text-rose-500" />;
      case 'High-Performing Product':
        return <TrendingUp className="h-5 w-5 text-emerald-500" />;
      case 'Cost Reduction':
        return <Zap className="h-5 w-5 text-amber-500" />;
      case 'Revenue Growth':
      default:
        return <Lightbulb className="h-5 w-5 text-teal-500" />;
    }
  };

  const getImpactBadge = (impact: string) => {
    if (impact === 'High') return 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50';
    if (impact === 'Medium' || impact === 'Medium-High') return 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200/50';
    return 'bg-slate-50 dark:bg-slate-900 text-slate-500 border border-slate-200/50';
  };

  const getDifficultyBadge = (diff: string) => {
    if (diff === 'Hard') return 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-450 border border-rose-200/50';
    if (diff === 'Medium') return 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 border border-indigo-200/50';
    return 'bg-teal-50 dark:bg-teal-950/30 text-teal-605 dark:text-teal-400 border border-teal-200/50';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white font-sans">Decision Intelligence & Recommendations</h2>
        <p className="text-xs text-slate-500 font-medium">Data-driven business recommendations generated dynamically from company indicators.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-6 shadow-xs h-[250px] animate-pulse" />
          ))
        ) : recommendations.length > 0 ? (
          recommendations.map((rec) => (
            <div key={rec.id} className="glass-card rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-all duration-200 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-slate-200 dark:bg-slate-800 group-hover:bg-teal-500/80 transition-colors" />
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(rec.category)}
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{rec.category}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getImpactBadge(rec.impact)}`}>
                      Impact: {rec.impact}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getDifficultyBadge(rec.difficulty)}`}>
                      Effort: {rec.difficulty}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-teal-500 transition-colors">{rec.title}</h3>
                  <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-medium">{rec.description}</p>
                </div>

                {/* Action Items List */}
                <div className="space-y-2 border-t border-slate-200 dark:border-slate-800/80 pt-4">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <CheckSquare className="h-3.5 w-3.5 text-indigo-500" /> Actionable Next Steps:
                  </span>
                  <ul className="space-y-1.5 pl-5 list-disc text-xs text-slate-550 dark:text-slate-400">
                    {rec.actions.map((act: string, idx: number) => (
                      <li key={idx} className="leading-normal">{act}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 text-center text-sm text-slate-400 py-8">No recommendations generated. Ensure historical records are loaded.</div>
        )}
      </div>
    </div>
  );
};
