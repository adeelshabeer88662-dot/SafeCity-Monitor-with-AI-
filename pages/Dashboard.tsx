
import React, { useState, useEffect, useMemo } from 'react';
import { Users, ShieldX, CreditCard, Activity, Wifi, WifiOff, Clock, BarChart3, Radio } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { fetchStats, fetchLogs } from '../services/flaskApi';
import DashboardCard from '../components/DashboardCard';
import { STORAGE_KEY } from '../constants';
import { DetectionResult, ViolationType } from '../types';

const Dashboard: React.FC<{ setActiveTab?: (tab: string) => void }> = ({ setActiveTab }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [statsData, setStatsData] = useState<any>({ total: 0, violations: 0, compliant: 0 });
  const [lastSyncTime, setLastSyncTime] = useState<string>('Searching...');

  const syncLogs = async () => {
    try {
      const logsData = await fetchLogs();
      const stats = await fetchStats();

      setLogs(logsData);
      setStatsData(stats);

      if (stats.last_event) {
        const latest = new Date(stats.last_event);
        setLastSyncTime(latest.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } else {
        setLastSyncTime('No Active Data');
      }
    } catch (error) {
      console.error("Dashboard Sync Error:", error);
    }
  };

  useEffect(() => {
    syncLogs();
    const interval = setInterval(syncLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const feedStatus = useMemo(() => {
    const sources = ['LIVE-UNIT-01', 'VIDEO-ANALYSIS', 'IMAGE-EVIDENCE'];
    const now = Date.now();

    return sources.map(source => {
      const sourceLogs = logs.filter(l => l.source === source);
      const lastDetection = sourceLogs[0];
      const timeSinceLast = lastDetection ? now - new Date(lastDetection.timestamp).getTime() : Infinity;

      const isActive = timeSinceLast < 60000;
      const isOnline = timeSinceLast < 6000000; // Increased to 100 minutes for stability

      const latency = lastDetection
        ? Math.floor((1 - lastDetection.confidence) * 100) + 12
        : 0;

      return {
        label: source === 'LIVE-UNIT-01' ? 'Gate 01 - Main Street' : (source === 'VIDEO-ANALYSIS' ? 'Gateway - Video Hub' : 'Digital Evidence Bin'),
        status: isActive ? 'Online' : (isOnline ? 'Standby' : 'Offline'),
        delay: latency ? `${latency}ms` : '---',
        id: source
      };
    });
  }, [logs]);

  const stats = useMemo(() => {
    return {
      total: statsData.total || 0,
      violations: statsData.violations || 0,
      plates: statsData.plates || 0,
      uptime: statsData.uptime || '0h 0m',
      totalTrend: statsData.trends?.total || 0,
      violationsTrend: statsData.trends?.violations || 0,
      platesTrend: statsData.trends?.plates || 0
    };
  }, [statsData]);

  const chartData = useMemo(() => {
    const buckets: { time: string; violations: number; timestamp: number }[] = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getTime());
      d.setHours(d.getHours() - i);
      d.setMinutes(0, 0, 0);

      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      buckets.push({ time: timeStr, violations: 0, timestamp: d.getTime() });
    }

    logs.forEach(log => {
      if (log.type !== ViolationType.NO_HELMET) return;
      const logTime = new Date(log.timestamp).getTime();
      for (let j = buckets.length - 1; j >= 0; j--) {
        if (logTime >= buckets[j].timestamp) {
          buckets[j].violations++;
          break;
        }
      }
    });

    return buckets;
  }, [logs]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">City Overview</h2>
          <p className="text-slate-400 font-medium text-sm">Real-time AI Telemetry & Compliance Stream</p>
        </div>
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 px-5 py-3 rounded-2xl text-right shadow-2xl border-t-indigo-500/50">
          <div className="flex items-center gap-2 justify-end text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
            <Radio size={12} className="text-emerald-500 animate-pulse" />
            Last Detection Event
          </div>
          <div className="text-lg font-black text-white font-mono tracking-tighter flex items-center gap-2">
            <Clock size={16} className="text-indigo-500" />
            {lastSyncTime}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Total Riders Scanned"
          value={stats.total.toLocaleString()}
          trend={stats.totalTrend}
          icon={<Users size={24} />}
          onClick={() => setActiveTab?.('reports')}
        />
        <DashboardCard
          title="Helmet Violations"
          value={stats.violations.toLocaleString()}
          trend={stats.violationsTrend}
          icon={<ShieldX size={24} />}
          onClick={() => setActiveTab?.('reports')}
        />
        <DashboardCard
          title="Plates Identified"
          value={stats.plates.toLocaleString()}
          trend={stats.platesTrend}
          icon={<CreditCard size={24} />}
          onClick={() => setActiveTab?.('reports')}
        />
        <DashboardCard
          title="AI System Uptime"
          value={stats.uptime}
          icon={<Activity size={24} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#1E293B]/50 backdrop-blur-md border border-slate-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <BarChart3 size={120} />
          </div>

          <div className="flex justify-between items-center mb-8">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Activity className="text-red-500" size={20} />
                Violation Traffic Peak
              </h3>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-tight">Active Analytics Window</p>
            </div>
            <div className="px-4 py-1.5 bg-slate-800 rounded-xl border border-slate-700">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Real-time Stream</span>
            </div>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorViolations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.2} />
                <XAxis
                  dataKey="time"
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  dy={15}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  dx={-15}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: '12px',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}
                  itemStyle={{ color: '#EF4444', fontWeight: 'bold' }}
                  labelStyle={{ color: '#94A3B8', marginBottom: '4px', textTransform: 'uppercase', fontSize: '10px' }}
                  cursor={{ stroke: '#EF4444', strokeWidth: 2, strokeDasharray: '6 6' }}
                />
                <Area
                  type="monotone"
                  dataKey="violations"
                  stroke="#EF4444"
                  fillOpacity={1}
                  fill="url(#colorViolations)"
                  strokeWidth={4}
                  animationDuration={1500}
                  activeDot={{ r: 6, stroke: '#EF4444', strokeWidth: 2, fill: '#0F172A' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#1E293B]/50 backdrop-blur-md border border-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col border-b-4 border-b-indigo-500/30">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">Node Health</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Global Feed Connectivity</p>
            </div>
            <div className="flex gap-1.5">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse delay-150"></div>
            </div>
          </div>

          <div className="space-y-5 flex-1 overflow-y-auto custom-scrollbar pr-2">
            {logs.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center border border-slate-700 shadow-inner">
                  <WifiOff size={40} className="text-slate-600 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-300">No Telemetry Signal</p>
                  <p className="text-[10px] font-bold uppercase tracking-tighter text-slate-500">Detected from Sectors</p>
                </div>
                <p className="text-[10px] text-slate-600 italic leading-tight px-6">Connect a live surveillance unit or upload evidence to initialize sector monitoring.</p>
              </div>
            ) : (
              feedStatus.map((camera) => (
                <div key={camera.id} className="group flex items-center justify-between p-5 bg-slate-900/40 rounded-2xl border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-800/60 transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${camera.status === 'Online' ? 'bg-emerald-500/10 text-emerald-500' :
                      camera.status === 'Standby' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-red-500/10 text-red-400'
                      }`}>
                      {camera.status === 'Online' ? <Wifi size={18} /> : <WifiOff size={18} />}
                    </div>
                    <div>
                      <div className="text-sm font-black text-white group-hover:text-indigo-300 transition-colors tracking-tight">{camera.label}</div>
                      <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-0.5">LATENCY: {camera.delay}</div>
                    </div>
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg ${camera.status === 'Online' ? 'bg-emerald-600 text-white' :
                    camera.status === 'Standby' ? 'bg-amber-600 text-white shadow-amber-600/10' :
                      'bg-red-500 text-white shadow-red-500/10'
                    }`}>
                    {camera.status}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900/80 rounded-full border border-slate-700">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">End-to-End Encryption Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
