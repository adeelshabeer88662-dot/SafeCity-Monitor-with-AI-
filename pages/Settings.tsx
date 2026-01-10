import React, { useState, useEffect } from 'react';
import { Bell, User, Layout, Eye, Shield, Save, CheckCircle2, BadgeInfo, Lock } from 'lucide-react';

const PROFILE_KEY = 'safecity_profile';

const Settings: React.FC = () => {
  const [isSaved, setIsSaved] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Sector Chief Administrator',
    email: 'admin@safecity.gov',
    role: 'Sector Chief'
  });

  useEffect(() => {
    const saved = localStorage.getItem(PROFILE_KEY);
    if (saved) {
      setProfile(JSON.parse(saved));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    setIsSaved(true);
    // Dispatch a custom event to notify other components (like Sidebar and App)
    window.dispatchEvent(new Event('profileUpdate'));
    setTimeout(() => setIsSaved(false), 2000);
  };


  const isAdmin = ['Sector Chief', 'Administrator', 'System Auditor', 'Sector Chief Administrator'].some(
    r => profile.role.toLowerCase().includes(r.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-right-4 duration-500 pb-12">
      <header>
        <h2 className="text-3xl font-bold text-white tracking-tight">User Preferences</h2>
        <p className="text-slate-400 font-medium">Manage your personal terminal interface and notification protocol.</p>
      </header>

      <div className="space-y-6">
        {/* Profile Identity */}
        <section className="bg-[#1E293B] border border-slate-800 rounded-3xl p-8 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
            <User size={120} />
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <User size={20} />
            </div>
            <h3 className="text-lg font-bold text-white">Personal Identity</h3>
          </div>

          <div className="p-4 bg-indigo-600/5 border border-indigo-500/10 rounded-2xl mb-8 flex items-start gap-3">
            <BadgeInfo className="text-indigo-400 shrink-0 mt-0.5" size={16} />
            <p className="text-xs text-slate-400 leading-relaxed">
              Your identity details are used for <strong>System Audit Trails</strong>. Your assigned <strong>Role</strong> determines your access to restricted sectors like Admin Oversight.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Terminal Operator Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Designated Role / Rank</label>
              <div className="relative">
                <input
                  type="text"
                  value={profile.role}
                  onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all pr-12"
                />
                <div className={`absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter ${isAdmin ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {isAdmin ? <Shield size={12} /> : <Lock size={12} />}
                  {isAdmin ? 'ADMIN' : 'STD'}
                </div>
              </div>
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Official Email Address (For Alerts)</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>
        </section>

        {/* Display Preferences */}
        <section className="bg-[#1E293B] border border-slate-800 rounded-3xl p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <Layout size={20} />
            </div>
            <h3 className="text-lg font-bold text-white">Interface Visualization</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-slate-800 rounded-lg text-slate-400"><Eye size={18} /></div>
                <div>
                  <div className="text-sm font-bold text-white">Neural Box Overlay</div>
                  <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Show AI bounding boxes on video streams</div>
                </div>
              </div>
              <input type="checkbox" defaultChecked className="w-10 h-5 bg-slate-800 rounded-full appearance-none checked:bg-indigo-600 transition-all cursor-pointer relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full checked:after:translate-x-5 after:transition-transform" />
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-slate-800 rounded-lg text-slate-400"><Shield size={18} /></div>
                <div>
                  <div className="text-sm font-bold text-white">High-Contrast Compliance Mode</div>
                  <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Enhance violation visibility for daylight use</div>
                </div>
              </div>
              <input type="checkbox" className="w-10 h-5 bg-slate-800 rounded-full appearance-none checked:bg-indigo-600 transition-all cursor-pointer relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full checked:after:translate-x-5 after:transition-transform" />
            </div>
          </div>
        </section>

        {/* Alerts Protocol */}
        <section className="bg-[#1E293B] border border-slate-800 rounded-3xl p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-red-500/10 text-red-500 rounded-lg">
              <Bell size={20} />
            </div>
            <h3 className="text-lg font-bold text-white">Notification Protocol</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
              <div className="text-sm font-bold text-white">Real-time Push Alerts</div>
              <input type="checkbox" defaultChecked className="w-10 h-5 bg-slate-800 rounded-full appearance-none checked:bg-indigo-600 transition-all cursor-pointer relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full checked:after:translate-x-5 after:transition-transform" />
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
              <div className="text-sm font-bold text-white">Daily Efficiency Digest (Email)</div>
              <input type="checkbox" className="w-10 h-5 bg-slate-800 rounded-full appearance-none checked:bg-indigo-600 transition-all cursor-pointer relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full checked:after:translate-x-5 after:transition-transform" />
            </div>
          </div>
        </section>

        <div className="flex items-center justify-end pt-4">
          <button
            onClick={handleSave}
            className={`flex items-center gap-3 px-10 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 ${isSaved ? 'bg-emerald-600 text-white shadow-emerald-600/20' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'}`}
          >
            {isSaved ? <CheckCircle2 size={18} /> : <Save size={18} />}
            {isSaved ? 'Preferences Applied' : 'Commit Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
