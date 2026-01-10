
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Surveillance from './pages/Surveillance';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import AdminOversight from './pages/AdminOversight';
import Login from './pages/Login';
import Signup from './pages/Signup';

const PROFILE_KEY = 'safecity_profile';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState('Sector Chief');

  const checkPermissions = () => {
    const saved = localStorage.getItem(PROFILE_KEY);
    const role = saved ? JSON.parse(saved).role : 'Sector Chief';
    setUserRole(role);

    // If active tab is admin-oversight but user is not an admin, redirect to dashboard
    const isAdmin = ['Sector Chief', 'Administrator', 'System Auditor', 'Sector Chief Administrator'].some(
      r => role.toLowerCase().includes(r.toLowerCase())
    );

    if (activeTab === 'admin-oversight' && !isAdmin) {
      setActiveTab('dashboard');
    }
  };

  useEffect(() => {
    // Check local storage for session (mock)
    const session = localStorage.getItem('safecity_session');
    if (session) setIsAuthenticated(true);

    checkPermissions();
    window.addEventListener('profileUpdate', checkPermissions);

    // Artificial load time for "System Boot" feel
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('profileUpdate', checkPermissions);
    };
  }, [activeTab]);

  const handleAuthSuccess = () => {
    localStorage.setItem('safecity_session', 'active');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('safecity_session');
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center text-white p-8">
        <div className="relative mb-8">
          <div className="w-16 h-16 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 bg-indigo-500 rounded-full animate-pulse"></div>
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-2 tracking-tight text-white">SafeCity <span className="text-indigo-500">MONITOR PRO</span></h1>
        <p className="text-slate-400 text-sm font-mono uppercase tracking-widest">System Boot: AI Neural Link Initializing...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return authMode === 'login' ? (
      <Login onLogin={handleAuthSuccess} onToggleMode={() => setAuthMode('signup')} />
    ) : (
      <Signup onSignup={handleAuthSuccess} onToggleMode={() => setAuthMode('login')} />
    );
  }

  const isAdmin = ['Sector Chief', 'Administrator', 'System Auditor', 'Sector Chief Administrator'].some(
    r => userRole.toLowerCase().includes(r.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#0F172A]">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />

      <main className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
        {activeTab === 'surveillance' && <Surveillance />}
        {activeTab === 'reports' && <Reports />}
        {activeTab === 'admin-oversight' && isAdmin && <AdminOversight />}
        {activeTab === 'settings' && <Settings />}
      </main>

      {/* Floating System Status Toast */}
      <div className="fixed bottom-6 right-6 bg-slate-900/80 backdrop-blur-md border border-slate-700 px-4 py-2 rounded-full flex items-center gap-3 shadow-2xl z-40 pointer-events-none">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          <span className="text-[10px] font-bold text-white uppercase tracking-tighter">AI Core Online</span>
        </div>
        <div className="w-px h-3 bg-slate-700"></div>
        <div className="text-[10px] font-mono text-slate-400">FPS: 60</div>
      </div>
    </div>
  );
};

export default App;
