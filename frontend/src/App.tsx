import { lazy, Suspense, useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, TrendingUp, BarChart3, PieChart, 
  HelpCircle, Lightbulb, FileText, Sun, Moon, ShieldAlert,
  Calendar, MapPin, Tag, UserCheck
} from 'lucide-react';
import { API_BASE_URL } from './api';
const DashboardOverview = lazy(() => import('./views/DashboardOverview').then((module) => ({ default: module.DashboardOverview })));
const RevenueAnalytics = lazy(() => import('./views/RevenueAnalytics').then((module) => ({ default: module.RevenueAnalytics })));
const ProfitabilityAnalysis = lazy(() => import('./views/ProfitabilityAnalysis').then((module) => ({ default: module.ProfitabilityAnalysis })));
const ForecastingEngine = lazy(() => import('./views/ForecastingEngine').then((module) => ({ default: module.ForecastingEngine })));
const WhatIfSimulation = lazy(() => import('./views/WhatIfSimulation').then((module) => ({ default: module.WhatIfSimulation })));
const Recommendations = lazy(() => import('./views/Recommendations').then((module) => ({ default: module.Recommendations })));
const ReportingCenter = lazy(() => import('./views/ReportingCenter').then((module) => ({ default: module.ReportingCenter })));
import type {
  DashboardKpiResponse,
  DashboardKpis,
  MonthlyTrend,
  ProductAnalytics,
  RegionAnalytics,
  RevenueAnalyticsResponse,
} from './types';

const REGIONS = ["North America", "Europe", "Asia-Pacific", "Latin America", "Middle East & Africa"];

const PRODUCTS = [
  "Alpha Core", "Beta Cloud", "Gamma Analytics", "Delta Security", "Epsilon CRM", 
  "Zeta ERP", "Eta HR", "Theta Billing", "Iota Support", "Kappa Portal", 
  "Lambda IoT", "Mu DevOps", "Nu Database", "Xi Integration", "Omicron Mobile", 
  "Pi Workspace", "Rho Asset", "Sigma Flow", "Tau Search", "Upsilon Identity"
];

const CUSTOMER_TYPES = ["Enterprise", "Mid-Market", "SMB"];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [role, setRole] = useState<'Executive' | 'Manager' | 'Viewer'>('Executive');
  const [darkMode, setDarkMode] = useState(true);

  // Global filters
  const [startDate, setStartDate] = useState<Date>(new Date('2021-01-01'));
  const [endDate, setEndDate] = useState<Date>(new Date('2026-06-01'));
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [selectedCustomerType, setSelectedCustomerType] = useState('all');

  // Shared statistics loaded globally for charts and overview
  const [kpiData, setKpiData] = useState<DashboardKpis | null>(null);
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
  const [products, setProducts] = useState<ProductAnalytics[]>([]);
  const [regions, setRegions] = useState<RegionAnalytics[]>([]);
  
  const [loading, setLoading] = useState(true);

  // Sync dark class on body
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  // Fetch baseline statistics
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('startDate', startDate.toISOString());
      queryParams.append('endDate', endDate.toISOString());
      if (selectedRegion !== 'all') queryParams.append('region', selectedRegion);
      if (selectedProduct !== 'all') queryParams.append('product', selectedProduct);
      if (selectedCustomerType !== 'all') queryParams.append('customerType', selectedCustomerType);

      const [kpiRes, anaRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/dashboard/kpis?${queryParams.toString()}`),
        fetch(`${API_BASE_URL}/api/analytics/revenue?${queryParams.toString()}`)
      ]);

      const kpis: DashboardKpiResponse = await kpiRes.json();
      const analytics: RevenueAnalyticsResponse = await anaRes.json();

      setKpiData({
        ...kpis.current,
        ...kpis.trends
      });
      setTrends(analytics.trends);
      setProducts(analytics.products);
      setRegions(analytics.regions);
    } catch (e) {
      console.error("Failed to load dashboard data", e);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, selectedRegion, selectedProduct, selectedCustomerType]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchDashboardData();
    });
    return () => window.clearTimeout(timer);
  }, [fetchDashboardData]);

  // Drill down helper
  const handleDrillDown = (drillFilters: { region?: string; product?: string }) => {
    if (drillFilters.region) {
      setSelectedRegion(drillFilters.region);
    }
    if (drillFilters.product) {
      setSelectedProduct(drillFilters.product);
    }
    setActiveTab('revenue'); // Navigate to revenue analytics for breakdown details
  };

  // Check roles permissions for routes
  const hasAccess = (tab: string) => {
    if (role === 'Viewer') {
      return ['dashboard', 'recommendations'].includes(tab);
    }
    if (role === 'Manager') {
      return ['dashboard', 'revenue', 'profitability', 'forecasting', 'recommendations'].includes(tab);
    }
    return true; // Executive has access to everything
  };

  const renderActiveView = () => {
    if (!hasAccess(activeTab)) {
      return (
        <div className="glass-card rounded-2xl p-8 text-center max-w-md mx-auto mt-20 border-l-4 border-l-rose-500">
          <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Access Denied</h3>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Your current role profile (<b>{role}</b>) does not possess permission rights to access the <b>{activeTab}</b> workspace. 
            Please request Executive clearance or switch roles using the profile toggle.
          </p>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className="py-2 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold"
          >
            Return to Dashboard
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardOverview 
            kpis={kpiData}
            trends={trends}
            products={products}
            regions={regions}
            loading={loading}
            onFilterChange={handleDrillDown}
            setActiveTab={setActiveTab}
          />
        );
      case 'revenue':
        return (
          <RevenueAnalytics 
            trends={trends}
            products={products}
            regions={regions}
            loading={loading}
            onFilterChange={handleDrillDown}
          />
        );
      case 'profitability':
        return (
          <ProfitabilityAnalysis 
            filters={{ startDate, endDate, region: selectedRegion, product: selectedProduct, customerType: selectedCustomerType }}
            trends={trends}
            loading={loading}
          />
        );
      case 'forecasting':
        return (
          <ForecastingEngine 
            filters={{ startDate, endDate, region: selectedRegion, product: selectedProduct, customerType: selectedCustomerType }}
          />
        );
      case 'what-if':
        return (
          <WhatIfSimulation 
            filters={{ startDate, endDate, region: selectedRegion, product: selectedProduct, customerType: selectedCustomerType }}
          />
        );
      case 'recommendations':
        return (
          <Recommendations 
            filters={{ startDate, endDate, region: selectedRegion, product: selectedProduct, customerType: selectedCustomerType }}
          />
        );
      case 'reports':
        return (
          <ReportingCenter 
            filters={{ startDate, endDate, region: selectedRegion, product: selectedProduct, customerType: selectedCustomerType }}
          />
        );
      default:
        return <div>View not found</div>;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: <LayoutDashboard className="h-4.5 w-4.5" /> },
    { id: 'revenue', label: 'Revenue Analytics', icon: <TrendingUp className="h-4.5 w-4.5" /> },
    { id: 'profitability', label: 'Profitability Analysis', icon: <BarChart3 className="h-4.5 w-4.5" /> },
    { id: 'forecasting', label: 'Forecasting Engine', icon: <PieChart className="h-4.5 w-4.5" /> },
    { id: 'what-if', label: 'What-If Simulation', icon: <HelpCircle className="h-4.5 w-4.5" /> },
    { id: 'recommendations', label: 'Recommendations', icon: <Lightbulb className="h-4.5 w-4.5" /> },
    { id: 'reports', label: 'Reporting Center', icon: <FileText className="h-4.5 w-4.5" /> },
  ];

  return (
    <div className="flex h-screen overflow-hidden font-sans">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo / Header */}
          <div className="p-6 border-b border-slate-800 flex items-center gap-2">
            <div className="h-7 w-7 bg-teal-500 rounded-lg flex items-center justify-center font-bold text-white text-base">I</div>
            <span className="text-lg font-bold text-white tracking-wider">InsightBoard</span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const accessible = hasAccess(item.id);
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all text-left ${active ? 'bg-teal-500 text-white shadow-xs' : 'hover:bg-slate-850 hover:text-white'} ${!accessible ? 'opacity-40 hover:bg-transparent cursor-not-allowed hover:text-slate-350' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Role Footer info */}
        <div className="p-4 border-t border-slate-800 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-semibold">
            <UserCheck className="h-4 w-4 text-teal-400" />
            <span>Profile Identity:</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-950/50 border border-slate-850 font-bold text-white flex justify-between items-center">
            <span>{role} Role</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header / Toolbar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0 shadow-xs z-10">
          
          {/* Left panel: Title */}
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-teal-500" />
            <h1 className="text-sm font-bold text-slate-850 dark:text-white uppercase tracking-wider">
              {navItems.find(n => n.id === activeTab)?.label}
            </h1>
          </div>

          {/* Right panel: Controls and switchers */}
          <div className="flex items-center gap-4">
            
            {/* Role switch selector (demo purposes) */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Role switcher:</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as typeof role)}
                className="bg-slate-100 dark:bg-slate-850 border border-slate-250 dark:border-slate-800 text-xs font-bold py-1 px-2.5 rounded-lg outline-none text-slate-700 dark:text-slate-205"
              >
                <option value="Executive">Executive</option>
                <option value="Manager">Manager</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>

            {/* Dark mode switcher */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 bg-slate-100 dark:bg-slate-850 border border-slate-250 dark:border-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-350 cursor-pointer"
            >
              {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {/* Global Toolbar Filters */}
        <section className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 p-4 px-6 flex flex-wrap gap-4 items-center shrink-0">
          
          {/* Region filter */}
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold py-1.5 px-3 rounded-xl outline-none"
            >
              <option value="all">All Regions</option>
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Product filter */}
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold py-1.5 px-3 rounded-xl outline-none max-w-[150px]"
            >
              <option value="all">All Products</option>
              {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Customer type filter */}
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              value={selectedCustomerType}
              onChange={(e) => setSelectedCustomerType(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold py-1.5 px-3 rounded-xl outline-none"
            >
              <option value="all">All Customer Types</option>
              {CUSTOMER_TYPES.map(ct => <option key={ct} value={ct}>{ct}</option>)}
            </select>
          </div>

          {/* Date range picker */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
            <div className="flex items-center gap-1.5 text-xs">
              <input
                type="date"
                value={startDate.toISOString().split('T')[0]}
                min="2021-01-01"
                max="2026-06-01"
                onChange={(e) => e.target.value && setStartDate(new Date(e.target.value))}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-1.5 px-2.5 rounded-xl outline-none font-semibold cursor-pointer"
              />
              <span className="text-slate-405 font-bold">to</span>
              <input
                type="date"
                value={endDate.toISOString().split('T')[0]}
                min="2021-01-01"
                max="2026-06-01"
                onChange={(e) => e.target.value && setEndDate(new Date(e.target.value))}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-1.5 px-2.5 rounded-xl outline-none font-semibold cursor-pointer"
              />
            </div>
          </div>
        </section>

        {/* View Workspace Contents */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950/20">
          <Suspense fallback={<div className="animate-pulse text-sm text-slate-500">Loading view...</div>}>
            {renderActiveView()}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
