
import React, { useState, useEffect } from 'react';
import { Trash2, AlertTriangle, Radio, Server, Plus, Globe, Settings2, Wifi, HelpCircle, X, Link, Link2Off, SlidersHorizontal, Activity, Calendar, ShieldAlert, ShieldCheck, Terminal, Network, Zap, Filter } from 'lucide-react';
import { STORAGE_KEY, THRESHOLD_KEY } from '../constants';
import { purgeDetections } from '../services/flaskApi';

const NODES_STORAGE_KEY = 'safecity_nodes';

const DEFAULT_NODES = [
  { id: 'LIVE-UNIT-01', label: 'Gate 01 - Main St', isLinked: true, ip: '192.168.10.45', protocol: 'RTSP', location: 'North Sector' },
];

const AdminOversight: React.FC = () => {
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [editingNode, setEditingNode] = useState<any>(null);
  const [isLockdown, setIsLockdown] = useState(false);
  const [showConnectionGuide, setShowConnectionGuide] = useState(false);

  // Selective Purge State
  const [purgeRange, setPurgeRange] = useState({ start: '', end: '' });

  // AI Sensitivity State
  const [threshold, setThreshold] = useState(0.75);
  const [isThresholdSaved, setIsThresholdSaved] = useState(false);

  const [nodes, setNodes] = useState(() => {
    const saved = localStorage.getItem(NODES_STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_NODES;
  });

  useEffect(() => {
    localStorage.setItem(NODES_STORAGE_KEY, JSON.stringify(nodes));
    const savedThreshold = localStorage.getItem(THRESHOLD_KEY);
    if (savedThreshold) setThreshold(parseFloat(savedThreshold));
  }, [nodes]);

  const handleSaveThreshold = () => {
    localStorage.setItem(THRESHOLD_KEY, threshold.toString());
    setIsThresholdSaved(true);
    setTimeout(() => setIsThresholdSaved(false), 2000);
  };

  const executeSelectivePurge = async () => {
    try {
      const response = await purgeDetections(purgeRange);
      alert(response.msg || "Purge execution confirmed by AI Core.");
      setShowPurgeModal(false);
      setPurgeRange({ start: '', end: '' });
      // Optionally refresh reports or stats if needed
    } catch (error) {
      console.error("Purge Error:", error);
      alert("AI Core: Purge protocol failed.");
    }
  };

  const handleSaveNode = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nodeData = {
      id: editingNode?.id || `NODE-${Date.now()}`,
      label: formData.get('label') as string,
      ip: formData.get('ip') as string,
      protocol: formData.get('protocol') as string,
      location: formData.get('location') as string,
      isLinked: formData.get('isLinked') === 'on',
    };

    if (editingNode) {
      setNodes(nodes.map((n: any) => n.id === editingNode.id ? nodeData : n));
    } else {
      setNodes([...nodes, nodeData]);
    }
    setShowNodeModal(false);
    setEditingNode(null);
  };

  const activeNodes = nodes.filter((n: any) => n.isLinked);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Administrative Oversight</h2>
          <p className="text-slate-400 font-medium">Global AI network provisioning and neural parameter control.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowConnectionGuide(true)}
            className="px-4 py-2 rounded-xl flex items-center gap-2 bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/20 transition-all font-bold text-xs uppercase tracking-widest shadow-lg"
          >
            <HelpCircle size={16} /> Connection Guide
          </button>

          {/* Functional System Lockdown Toggle */}
          <button
            onClick={() => setIsLockdown(!isLockdown)}
            className={`px-4 py-2 rounded-xl flex items-center gap-3 border transition-all duration-500 shadow-xl group ${isLockdown ? 'bg-red-500/20 border-red-500 text-red-500 shadow-red-500/10' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'}`}
          >
            <div className="relative">
              <Radio className={isLockdown ? '' : 'animate-pulse'} size={18} />
              {isLockdown && <div className="absolute inset-0 bg-red-500 rounded-full blur-sm opacity-50 animate-ping"></div>}
            </div>
            <div className="text-left">
              <div className="text-[10px] font-black uppercase opacity-70 tracking-tighter">System State</div>
              <div className="text-xs font-black tracking-widest uppercase">{isLockdown ? 'LOCKED DOWN' : 'OPERATIONAL'}</div>
            </div>
            <div className={`ml-2 px-1.5 py-0.5 rounded text-[8px] font-black ${isLockdown ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
              {isLockdown ? 'SECURED' : 'LIVE'}
            </div>
          </button>
        </div>
      </header>

      {isLockdown && (
        <div className="bg-red-600/10 border border-red-600/30 rounded-2xl p-4 flex items-center gap-4 animate-in slide-in-from-top-4 duration-300">
          <ShieldAlert className="text-red-500 shrink-0" size={24} />
          <p className="text-sm font-bold text-red-200">
            CRITICAL: Global System Lockdown Active. External data ingestion is suspended.
          </p>
        </div>
      )}

      {/* AI Neural Parameters Section */}
      <section className="bg-[#1E293B] border border-slate-800 rounded-3xl p-8 shadow-xl relative overflow-hidden group border-l-4 border-l-amber-500">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:opacity-[0.07] transition-opacity">
          <Activity size={180} />
        </div>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10">
          <div className="space-y-2 max-w-md">
            <div className="flex items-center gap-3 text-amber-500">
              <SlidersHorizontal size={24} />
              <h3 className="text-xl font-bold text-white tracking-tight">AI Confidence Architecture</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed uppercase font-bold tracking-widest">Global Neural Processing Threshold</p>
            <p className="text-sm text-slate-500 leading-relaxed">
              Adjust the global strictness for violations. Higher values minimize false positives in dense urban traffic environments.
            </p>
          </div>

          <div className="flex-1 w-full max-w-xl space-y-6">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Current Multiplier</div>
                <div className="text-3xl font-black text-amber-500 font-mono tracking-tighter">{(threshold * 100).toFixed(0)}%</div>
              </div>
              <button
                onClick={handleSaveThreshold}
                className={`px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${isThresholdSaved ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 active:scale-95'}`}
              >
                {isThresholdSaved ? 'Parameters Applied' : 'Commit Change'}
              </button>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.99"
              step="0.01"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              disabled={isLockdown}
              className={`w-full h-3 bg-slate-800 rounded-full appearance-none cursor-pointer accent-amber-500 border border-slate-700/50 ${isLockdown ? 'opacity-30 cursor-not-allowed' : ''}`}
            />
          </div>
        </div>
      </section>

      {/* Node Configuration Manager */}
      <section className="bg-[#1E293B] border border-slate-800 rounded-3xl overflow-hidden shadow-xl border-t-4 border-t-indigo-500">
        <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/20">
          <div className="flex items-center gap-3">
            <Server className="text-indigo-400" size={24} />
            <div>
              <h3 className="font-bold text-white">Active AI Processing Network</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Surveillance Node Provisioning</p>
            </div>
          </div>
          <button
            onClick={() => { setEditingNode(null); setShowNodeModal(true); }}
            disabled={isLockdown}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 ${isLockdown ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}
          >
            <Plus size={14} /> Provision New Node
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 divide-x divide-y divide-slate-800">
          {activeNodes.map((node: any) => (
            <div key={node.id} className={`p-6 hover:bg-slate-800/30 transition-all group relative ${isLockdown ? 'opacity-50 grayscale' : ''}`}>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg ${isLockdown ? 'bg-slate-700 text-slate-500' : 'bg-emerald-500/10 text-emerald-500 animate-pulse'}`}>
                  <Globe size={20} />
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${isLockdown ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
                    {isLockdown ? 'SUSPENDED' : 'ONLINE'}
                  </span>
                  {!isLockdown && (
                    <button
                      onClick={() => { setEditingNode(node); setShowNodeModal(true); }}
                      className="p-1.5 bg-slate-800 rounded-lg text-slate-500 hover:text-indigo-400 transition-all border border-slate-700"
                    >
                      <Settings2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              <h4 className="text-sm font-black text-white mb-1">{node.label}</h4>
              <p className="text-[10px] text-indigo-400/80 font-bold uppercase tracking-widest mb-3">{node.location}</p>
              <div className="text-[10px] text-slate-500 font-mono bg-slate-900/50 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wifi size={12} className="text-slate-600" />
                  IP: {node.ip}
                </div>
                <span className="text-slate-700">{node.protocol}</span>
              </div>
              <button
                onClick={() => { setEditingNode(node); setShowNodeModal(true); }}
                disabled={isLockdown}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2 text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-900 hover:bg-indigo-600 hover:text-white rounded-lg transition-all border border-slate-800 group-hover:border-indigo-500/30"
              >
                <Link size={12} /> Manage Neural Link
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Evidence Retention Section */}
      <section className="bg-red-500/5 border border-red-500/20 rounded-3xl p-8 group hover:bg-red-500/10 transition-all">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="p-6 bg-red-500/10 text-red-500 rounded-3xl shadow-inner group-hover:scale-110 transition-transform">
            <Trash2 size={42} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Evidence Retention Maintenance</h3>
            <p className="text-slate-400 mb-8 leading-relaxed max-w-3xl">
              Compliance protocols require periodic purging of stored evidence records. Use the selector below to define a temporal window for record removal.
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6">
              <button
                onClick={() => setShowPurgeModal(true)}
                className="px-10 py-4 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-2xl shadow-red-600/20 flex items-center gap-3 active:scale-95"
              >
                <Calendar size={18} /> Authorize Selective Purge
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Connection Guide Modal - PURPOSEFUL CONTENT */}
      {showConnectionGuide && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-lg bg-black/70 animate-in fade-in duration-300">
          <div className="bg-[#1E293B] border border-slate-700 rounded-[2.5rem] p-10 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh] custom-scrollbar">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-600/10 text-indigo-400 rounded-2xl">
                  <Network size={24} />
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight uppercase">Node Connection Protocol</h3>
              </div>
              <button onClick={() => setShowConnectionGuide(false)} className="text-slate-500 hover:text-white p-2 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <h4 className="text-sm font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Terminal size={16} /> 1. RTSP Stream URI Structure
                </h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  For professional IP cameras (Hikvision, Dahua, Axis), use the following standard URI format to link to the SafeCity AI Engine:
                </p>
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 font-mono text-xs text-emerald-400 break-all shadow-inner">
                  rtsp://[username]:[password]@[ip_address]:[port]/[channel_path]
                </div>
                <div className="text-[10px] text-slate-500 font-bold uppercase italic">
                  Example: rtsp://admin:secureKey123@192.168.1.108:554/live/ch1
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 p-5 bg-slate-900/50 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <Zap size={14} className="text-amber-500" />
                    Network Prereqs
                  </div>
                  <ul className="text-xs text-slate-500 space-y-2 list-disc pl-4">
                    <li>Static Local IP assigned to node.</li>
                    <li>Subnet must be reachable by server.</li>
                    <li>Port 554 (Default RTSP) open.</li>
                  </ul>
                </div>
                <div className="space-y-3 p-5 bg-slate-900/50 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <Activity size={14} className="text-indigo-500" />
                    Stream Specs
                  </div>
                  <ul className="text-xs text-slate-500 space-y-2 list-disc pl-4">
                    <li>H.264 / H.265 Compression.</li>
                    <li>Max Resolution: 1080p.</li>
                    <li>Optimal FPS: 15-30 frames/sec.</li>
                  </ul>
                </div>
              </div>

              <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                <p className="text-xs text-amber-500/80 leading-relaxed italic">
                  Note: For browser-based video streaming, RTSP may require a websocket proxy (FFmpeg + Node.js) to be ingested correctly into the frontend canvas element.
                </p>
              </div>

              <button
                onClick={() => setShowConnectionGuide(false)}
                className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-500 transition-all uppercase tracking-widest text-xs shadow-xl shadow-indigo-600/20"
              >
                Acknowledge Protocol
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selective Purge Modal */}
      {showPurgeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/60 animate-in fade-in duration-300">
          <div className="bg-[#1E293B] border border-slate-700 rounded-[2.5rem] p-10 max-w-2xl w-full shadow-[0_0_50px_rgba(239,68,68,0.2)] animate-in zoom-in-95 duration-200 lg:max-w-4xl">
            <div className="flex flex-col gap-8">
              <div className="text-center">
                <h3 className="text-2xl font-black text-white mb-2 tracking-tight uppercase flex items-center justify-center gap-3">
                  <Trash2 className="text-red-500" /> Evidence Deletion Protocols
                </h3>
                <p className="text-slate-400 font-medium text-sm">Select a deletion strategy below. Actions are irreversible.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
                {/* Option 1: Full Purge */}
                <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6 flex flex-col justify-between hover:bg-red-500/10 transition-colors">
                  <div>
                    <div className="flex items-center gap-3 mb-4 text-red-500 font-bold uppercase tracking-widest text-xs">
                      <ShieldAlert size={16} /> Strategy A: Total Reset
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2">Complete System Wipe</h4>
                    <p className="text-xs text-slate-400 leading-relaxed mb-6">
                      Permanently destroys ALL detection records, snapshots, and statistical history. This effectively factory resets the evidence database.
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      if (window.confirm("CRITICAL: CONFIRM TOTAL SYSTEM RESET?")) {
                        try {
                          const res = await purgeDetections({ start: '', end: '' });
                          alert(res.msg);
                          setShowPurgeModal(false);
                        } catch (e) { console.error(e); alert("Failed."); }
                      }
                    }}
                    className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-red-600/20 active:scale-95"
                  >
                    Execute Total Purge
                  </button>
                </div>

                {/* Option 2: Selective */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
                  <div className="hidden lg:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-[#1E293B] rounded-full border border-slate-700 z-10 flex items-center justify-center text-[10px] font-black text-slate-500">OR</div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-1 text-indigo-400 font-bold uppercase tracking-widest text-xs">
                      <Filter size={16} /> Strategy B: Selective
                    </div>
                    <h4 className="text-xl font-bold text-white">Date Range Removal</h4>
                    <div className="space-y-3 mt-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Start Date</label>
                        <input
                          type="date"
                          value={purgeRange.start}
                          onChange={(e) => setPurgeRange(prev => ({ ...prev, start: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 [color-scheme:dark] text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">End Date</label>
                        <input
                          type="date"
                          value={purgeRange.end}
                          onChange={(e) => setPurgeRange(prev => ({ ...prev, end: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 [color-scheme:dark] text-xs"
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={executeSelectivePurge}
                    className="mt-6 w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95"
                  >
                    Purge Selected Range
                  </button>
                </div>
              </div>

              <button onClick={() => setShowPurgeModal(false)} className="mx-auto text-slate-500 hover:text-white font-bold text-xs uppercase tracking-widest py-2">
                Cancel Operation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Provision Node Modal */}
      {showNodeModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
          <div className="bg-[#1E293B] border border-slate-700 rounded-[2rem] p-8 max-w-xl w-full shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-white">{editingNode ? 'Configure Node' : 'Provision Node'}</h3>
              <button onClick={() => setShowNodeModal(false)} className="text-slate-500 hover:text-white p-2"><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveNode} className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-5 bg-indigo-600/5 border border-indigo-500/20 rounded-2xl">
                  <div className="text-sm font-bold text-white">Neural Link Status</div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input name="isLinked" type="checkbox" defaultChecked={editingNode?.isLinked} className="sr-only peer" />
                    <div className="w-12 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input name="label" required defaultValue={editingNode?.label} type="text" placeholder="Node Label" className="bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-2xl text-sm" />
                  <input name="location" required defaultValue={editingNode?.location} type="text" placeholder="Zone" className="bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-2xl text-sm" />
                </div>
                <input name="ip" required defaultValue={editingNode?.ip} type="text" placeholder="Endpoint IP" className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-2xl text-sm" />
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => setShowNodeModal(false)} className="flex-1 py-3.5 bg-slate-800 text-slate-300 font-bold rounded-2xl">Cancel</button>
                <button type="submit" className="flex-1 py-3.5 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/20">Save Config</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOversight;
