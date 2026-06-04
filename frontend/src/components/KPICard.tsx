import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  subtext?: string;
  trend?: number;
  trendDirection?: 'up' | 'down' | 'flat';
  loading?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtext,
  trend,
  trendDirection,
  loading = false,
}) => {
  const getTrendColor = () => {
    if (trendDirection === 'up') return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30';
    if (trendDirection === 'down') return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30';
    return 'text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900';
  };

  const getTrendIcon = () => {
    if (trendDirection === 'up') return <ArrowUpRight className="h-4 w-4" />;
    if (trendDirection === 'down') return <ArrowDownRight className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  return (
    <div className="glass-card rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-200 group relative overflow-hidden flex flex-col justify-between min-h-[140px]">
      <div className="absolute top-0 left-0 w-2 h-full bg-teal-500/0 group-hover:bg-teal-500/70 transition-all duration-200" />
      <div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</span>
          {trend !== undefined && (
            <div className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-full ${getTrendColor()}`}>
              {getTrendIcon()}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="h-8 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-md mt-2 w-2/3" />
        ) : (
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-2">{value}</h3>
        )}
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="h-4 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-md w-1/2" />
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{subtext}</p>
        )}
      </div>
    </div>
  );
};
