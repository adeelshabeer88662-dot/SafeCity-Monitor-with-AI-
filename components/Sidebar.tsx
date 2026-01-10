
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Camera, ShieldAlert, Settings, LogOut, Shield, User, ShieldCheck } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

const PROFILE_KEY = 'safecity_profile';

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout }) => {
  const [profile, setProfile] = useState({
    name: 'Sector Chief Administrator',
    role: 'Sector Chief'
  });

  const loadProfile = () => {
    const saved = localStorage.getItem(PROFILE_KEY);
    if (saved) {
      setProfile(JSON.parse(saved));
    }
  };

  useEffect(() => {
    loadProfile();
    window.addEventListener('profileUpdate', loadProfile);
    return () => window.removeEventListener('profileUpdate', loadProfile);
  }, []);

  // Determine if user has administrative privileges
  const isAdmin = ['Sector Chief', 'Administrator', 'System Auditor', 'Sector Chief Administrator'].some(
    role => profile.role.toLowerCase().includes(role.toLowerCase())
  );

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'surveillance', label: 'Surveillance', icon: Camera },
    { id: 'reports', label: 'Reports', icon: ShieldAlert },
    // Only show Admin Oversight if the user has the correct role
    ...(isAdmin ? [{ id: 'admin-oversight', label: 'Admin Oversight', icon: ShieldCheck }] : []),
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#1E293B] h-screen flex flex-col border-r border-slate-800 sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="p-2 bg-indigo-600 rounded-lg">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">SafeCity <span className="text-indigo-500">PRO</span></h1>
          <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">Neural Monitor</p>
        </div>
      </div>

      <nav className="flex-1 mt-6 px-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'bg-indigo-600/10 text-indigo-400 border-l-4 border-indigo-600' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-4">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>

        {/* Dynamic Administrator Profile Identity */}
        <div className="flex items-center gap-3 px-3 py-3 bg-slate-900/40 rounded-2xl border border-slate-800/50 shadow-inner group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20 border border-indigo-400/20 shrink-0">
            <User size={20} className="stroke-[2.5px]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-white truncate tracking-tight uppercase group-hover:text-indigo-400 transition-colors">
              {profile.name}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isAdmin ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate">
                {profile.role}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
