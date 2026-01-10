import React, { useState } from 'react';
import { Shield, Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { loginUser } from '../services/flaskApi';

interface LoginProps {
  onLogin: () => void;
  onToggleMode: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onToggleMode }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Using email as username for the backend call
      const result = await loginUser({ username: email, password });
      if (result.access_token) {
        localStorage.setItem('safecity_token', result.access_token);
        localStorage.setItem('safecity_profile', JSON.stringify(result.user));
        onLogin();
      } else {
        setError(result.msg || "Invalid credentials. Access Denied.");
      }
    } catch (err) {
      setError("AI Core Authentication Offline.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0F172A]">
      {/* Left side: Visuals */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-indigo-900">
        <div
          className="absolute inset-0 z-0 opacity-50 bg-cover bg-center grayscale scale-110"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=2000&auto=format&fit=crop)' }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0F172A] via-indigo-900/60 to-transparent z-10"></div>

        <div className="relative z-20 flex flex-col justify-between p-16 text-white h-full">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-indigo-600 rounded-2xl border border-indigo-400/30 shadow-2xl shadow-indigo-600/20">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">SafeCity Monitor</h1>
            </div>
            <h2 className="text-5xl font-black max-w-lg leading-tight mb-6">
              Empowering Urban Safety with <span className="text-indigo-400">AI Intelligence.</span>
            </h2>
            <p className="text-lg text-slate-300 max-w-md leading-relaxed">
              The world's most advanced platform for automated helmet detection and license plate recognition.
            </p>
          </div>

          <div className="flex items-center gap-2 px-6 py-3 bg-slate-900/30 backdrop-blur-xl rounded-2xl border border-white/5 max-w-fit">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Secure Node Link Active</span>
          </div>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
          <div className="text-center lg:hidden flex flex-col items-center mb-12">
            <Shield className="w-12 h-12 text-indigo-500 mb-4" />
            <h1 className="text-2xl font-bold text-white">SafeCity Monitor</h1>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">System Access</h2>
            <p className="text-slate-400 font-medium">Please enter your authorized credentials to initialize the command center.</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm animate-in shake duration-500">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Official Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@agency.gov"
                  className="w-full bg-slate-800/50 border border-slate-700 text-white pl-12 pr-4 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium"
                  required
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Access Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800/50 border border-slate-700 text-white pl-12 pr-12 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="w-4 h-4 bg-slate-800 border-slate-700 rounded text-indigo-600 focus:ring-indigo-500" />
                <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">Remember Session</span>
              </label>
              <button type="button" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors">Reset Password</button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-wait text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all transform active:scale-[0.98] shadow-2xl shadow-indigo-600/20"
            >
              {isLoading ? "Authenticating..." : "Initialize Connection"}
            </button>
          </form>

          <div className="pt-8 text-center border-t border-slate-800">
            <p className="text-sm text-slate-500 font-medium">
              Need access for your agency?
              <button
                onClick={onToggleMode}
                className="text-indigo-400 font-bold ml-2 hover:text-indigo-300 transition-colors"
              >
                Sign Up / Create Account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
