import React, { useState, useEffect, useMemo } from 'react';
import { Search, Download, ExternalLink, Filter, Calendar, X, ChevronDown, CheckCircle2, AlertCircle, FileSearch, RotateCcw } from 'lucide-react';
import { fetchLogs } from '../services/flaskApi';
import { DetectionResult, ViolationType } from '../types';

const Reports: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Filter States
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [typeFilter, setTypeFilter] = useState<'ALL' | ViolationType.NO_HELMET | ViolationType.COMPLIANT>('ALL');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const logs = await fetchLogs();
        setData(logs);
      } catch (error) {
        console.error("Reports Load Error:", error);
      }
    };
    loadData();

    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Combined Filter Logic
  const filtered = useMemo(() => {
    return data.filter(d => {
      // Search matching
      const matchesSearch = (d.plate_number || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.id.toString()).toLowerCase().includes(search.toLowerCase());

      // Type matching
      const matchesType = typeFilter === 'ALL' || d.type === typeFilter;

      // Date matching
      let matchesDate = true;
      const dTimestamp = new Date(d.timestamp).getTime();
      if (dateRange.start) {
        matchesDate = matchesDate && dTimestamp >= new Date(dateRange.start).getTime();
      }
      if (dateRange.end) {
        // End of day logic
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && dTimestamp <= endDate.getTime();
      }

      return matchesSearch && matchesType && matchesDate;
    });
  }, [data, search, typeFilter, dateRange]);

  const resetFilters = () => {
    setSearch('');
    setDateRange({ start: '', end: '' });
    setTypeFilter('ALL');
  };

  const exportData = () => {
    if (filtered.length === 0) return;

    const csv = [
      ['ID', 'Timestamp', 'Violation', 'Plate', 'Confidence', 'Source'],
      ...filtered.map(d => [
        d.id,
        d.timestamp,
        d.type,
        d.plate_number,
        (d.confidence * 100).toFixed(2) + '%',
        d.source || 'N/A'
      ])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `safecity_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const hasActiveFilters = search || dateRange.start || dateRange.end || typeFilter !== 'ALL';

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Compliance Evidence</h2>
          <p className="text-slate-400 font-medium">Verified urban violation logs and neural evidence.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportData}
            disabled={filtered.length === 0}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl transition-all font-bold shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            <Download size={18} /> Export Current View ({filtered.length})
          </button>
        </div>
      </div>

      {/* Filter Architecture */}
      <div className="bg-[#1E293B] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 bg-slate-900/40">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">

            {/* Search Input */}
            <div className="relative w-full lg:max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search Plate ID or Evidence Reference..."
                className="w-full bg-slate-900/60 border border-slate-700 text-white pl-12 pr-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-medium placeholder:text-slate-600"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filter Toggle Controls */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-slate-800">
                <button
                  onClick={() => setTypeFilter('ALL')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${typeFilter === 'ALL' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setTypeFilter(ViolationType.NO_HELMET)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${typeFilter === ViolationType.NO_HELMET ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-red-400'}`}
                >
                  Violations
                </button>
                <button
                  onClick={() => setTypeFilter(ViolationType.COMPLIANT)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${typeFilter === ViolationType.COMPLIANT ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-emerald-400'}`}
                >
                  Compliant
                </button>
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-all ${showFilters || dateRange.start || dateRange.end ? 'bg-indigo-600/10 border-indigo-500/50 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
              >
                <Calendar size={18} />
                <span className="hidden sm:inline">Date Range</span>
                <ChevronDown size={14} className={`transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all group"
                  title="Reset All Filters"
                >
                  <RotateCcw size={18} className="group-active:rotate-180 transition-transform duration-500" />
                </button>
              )}
            </div>
          </div>

          {/* Expanded Date Range Section */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-top-4 duration-300">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Start Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 [color-scheme:dark]"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">End Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 [color-scheme:dark]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Table View */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-800/80 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-800">
                <th className="px-6 py-5">Evidence ID</th>
                <th className="px-6 py-5">Detection Timestamp</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Extracted Plate</th>
                <th className="px-6 py-5">AI Confidence</th>
                <th className="px-6 py-5 text-center">Neural Snapshot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-32 text-center">
                    <div className="flex flex-col items-center justify-center opacity-30 grayscale max-w-sm mx-auto">
                      <div className="p-6 bg-slate-800 rounded-full mb-4">
                        <FileSearch size={48} className="text-slate-500" />
                      </div>
                      <p className="text-sm font-bold text-white uppercase tracking-widest mb-1">No Evidence Records</p>
                      <p className="text-xs text-slate-500 leading-relaxed">Modify your filters or search terms. If data is still missing, ensure sector monitoring is active.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-800/40 transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                        <span className="font-mono text-[11px] text-slate-400 group-hover:text-white transition-colors">#{row.id.toString().padStart(6, '0')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">{new Date(row.timestamp).toLocaleDateString()}</span>
                        <span className="text-[10px] font-mono text-slate-500">{new Date(row.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-tight ${row.type === ViolationType.NO_HELMET
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                        {row.type === ViolationType.NO_HELMET ? <AlertCircle size={12} /> : <CheckCircle2 size={12} />}
                        {row.type.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-base font-mono font-black text-amber-500 tracking-widest bg-amber-500/5 px-2 py-1 rounded-md border border-amber-500/10 group-hover:border-amber-500/30 transition-all">{row.plate_number}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2 w-32">
                        <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-1000 ${row.confidence > 0.8 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${row.confidence * 100}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-slate-500">ACCURACY</span>
                          <span className={`${row.confidence > 0.8 ? 'text-emerald-500' : 'text-amber-500'} font-bold`}>{(row.confidence * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedImage(row.image_path ? `http://127.0.0.1:5000/${row.image_path}` : null)}
                        className="p-2.5 bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-xl transition-all border border-indigo-500/20 shadow-lg shadow-indigo-600/5 group/btn"
                      >
                        <ExternalLink size={16} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Image Evidence Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/60 animate-in fade-in duration-300">
          <div className="relative max-w-5xl w-full bg-[#1E293B] border border-slate-700 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="absolute top-6 right-6 z-10">
              <button
                onClick={() => setSelectedImage(null)}
                className="p-3 bg-black/40 hover:bg-black/60 text-white rounded-2xl backdrop-blur-md border border-white/10 transition-all hover:rotate-90"
              >
                <X size={24} />
              </button>
            </div>
            <img src={selectedImage} alt="Violation Evidence" className="w-full h-auto max-h-[85vh] object-contain" />
            <div className="p-8 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-500/10 text-red-500 rounded-2xl">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg">High-Confidence Neural Capture</h4>
                  <p className="text-slate-400 text-sm">Full forensic-grade snapshot of the detected violation.</p>
                </div>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <button
                  onClick={() => window.print()}
                  className="flex-1 md:flex-none px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-all border border-slate-700 active:scale-95"
                >
                  Print Proof
                </button>
                <a
                  href={selectedImage}
                  download
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-10 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold shadow-xl shadow-indigo-600/20 transition-all active:scale-95"
                >
                  <Download size={18} /> Download Evidence
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
