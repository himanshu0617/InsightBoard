import React, { useState } from 'react';
import { FileText, Download, Table, ClipboardCheck, ArrowDownToLine } from 'lucide-react';

interface ReportingCenterProps {
  filters: any;
}

export const ReportingCenter: React.FC<ReportingCenterProps> = ({
  filters,
}) => {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownloadPDF = async (reportType: string) => {
    setDownloading(reportType);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('type', reportType);
      
      if (filters.startDate) queryParams.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) queryParams.append('endDate', filters.endDate.toISOString());
      if (filters.region && filters.region !== 'all') queryParams.append('region', filters.region);
      if (filters.product && filters.product !== 'all') queryParams.append('product', filters.product);
      if (filters.customerType && filters.customerType !== 'all') queryParams.append('customerType', filters.customerType);

      // We direct window location to trigger the browser attachment download
      window.open(`http://localhost:5000/api/reports/pdf?${queryParams.toString()}`, '_blank');
    } catch (e) {
      console.error("PDF download failed", e);
    } finally {
      setTimeout(() => setDownloading(null), 1000);
    }
  };

  const handleDownloadCSV = () => {
    const queryParams = new URLSearchParams();
    if (filters.startDate) queryParams.append('startDate', filters.startDate.toISOString());
    if (filters.endDate) queryParams.append('endDate', filters.endDate.toISOString());
    if (filters.region && filters.region !== 'all') queryParams.append('region', filters.region);
    if (filters.product && filters.product !== 'all') queryParams.append('product', filters.product);
    if (filters.customerType && filters.customerType !== 'all') queryParams.append('customerType', filters.customerType);

    window.open(`http://localhost:5000/api/export/csv?${queryParams.toString()}`, '_blank');
  };

  const reportsList = [
    {
      id: "executive_summary",
      title: "Executive Summary Performance Report",
      description: "A summarized, single-page brief listing key financial KPIs (revenue, operating margin, user growth) and business recommendations.",
      icon: <ClipboardCheck className="h-6 w-6 text-teal-500" />
    },
    {
      id: "quarterly_report",
      title: "Quarterly Business Report (QBR)",
      description: "A comprehensive multi-page review of historical quarterly performance (cogs, opex, margins) mapping growth milestones.",
      icon: <FileText className="h-6 w-6 text-indigo-500" />
    },
    {
      id: "revenue_report",
      title: "Revenue Performance Report",
      description: "Dedicated revenue analytics segmenting performance by region, product portfolio margins, and category market shares.",
      icon: <Table className="h-6 w-6 text-rose-500" />
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Reporting Center</h2>
        <p className="text-xs text-slate-500 font-medium">Export raw audit files or compile stylized Executive PDF presentations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PDF Reports Listing */}
        <div className="lg:col-span-2 space-y-4">
          <h4 className="text-sm font-bold text-slate-950 dark:text-white mb-2">Available PDF Documents</h4>
          
          {reportsList.map((rep) => (
            <div key={rep.id} className="glass-card rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-all duration-200">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl shrink-0 mt-0.5">
                  {rep.icon}
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{rep.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{rep.description}</p>
                </div>
              </div>

              <button
                onClick={() => handleDownloadPDF(rep.id)}
                disabled={downloading !== null}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:cursor-not-allowed transition-all text-white font-bold text-xs rounded-xl shadow-xs shrink-0 cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>{downloading === rep.id ? 'Generating...' : 'Download PDF'}</span>
              </button>
            </div>
          ))}
        </div>

        {/* Data Exports (CSV) */}
        <div className="glass-card rounded-2xl p-6 shadow-xs flex flex-col justify-between h-[300px]">
          <div>
            <h4 className="text-sm font-bold text-slate-950 dark:text-white flex items-center gap-2 mb-4">
              <Table className="h-5 w-5 text-indigo-500" /> Raw Data Exports
            </h4>
            <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed font-medium mb-4">
              Export current filtered datasets to CSV spreadsheets for custom charting or external audits. 
              The download compiles transaction sums grouped by month, region, product category, and customer types.
            </p>
          </div>

          <button
            onClick={handleDownloadCSV}
            className="w-full flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-900 dark:bg-slate-900 dark:hover:bg-slate-800 transition-all text-white font-bold text-xs rounded-xl uppercase tracking-wider shadow-xs cursor-pointer border border-slate-700"
          >
            <ArrowDownToLine className="h-4 w-4" /> Export CSV Spreadsheet
          </button>
        </div>
      </div>
    </div>
  );
};
