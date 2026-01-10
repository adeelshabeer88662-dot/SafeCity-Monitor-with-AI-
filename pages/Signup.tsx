import React, { useState } from 'react';
import { Shield, Eye, EyeOff, Lock, User, Mail, Building2, ChevronRight, AlertCircle } from 'lucide-react';
import { signupUser } from '../services/flaskApi';

interface SignupProps {
  onSignup: () => void;
  onToggleMode: () => void;
}

const Signup: React.FC<SignupProps> = ({ onSignup, onToggleMode }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    agency: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!agreeToTerms) {
      setError("Please agree to the Security Protocol.");
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      const result = await signupUser({
        username: formData.email, // backend expects username
        password: formData.password,
        role: 'Sector Chief', // Default role
        fullName: formData.fullName,
        agency: formData.agency
      });

      if (result.msg === "User created successfully") {
        onSignup();
      } else {
        setError(result.msg || "Registration failed.");
      }
    } catch (err) {
      setError("AI Core Registration Offline.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0F172A]">
      {/* Left side: Brand Visuals */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-indigo-900">
        <div
          className="absolute inset-0 z-0 opacity-40 bg-cover bg-center grayscale"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1545147986-a9d6f210df77?q=80&w=2000&auto=format&fit=crop)' }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0F172A] via-indigo-950/80 to-transparent z-10"></div>

        <div className="relative z-20 flex flex-col justify-between p-16 text-white h-full">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-indigo-600 rounded-2xl border border-indigo-400/30 shadow-2xl shadow-indigo-600/20">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">SafeCity Monitor</h1>
            </div>
            <h2 className="text-5xl font-black max-w-lg leading-tight mb-6">
              Establish Your <span className="text-indigo-400">Tactical Control</span>
            </h2>
            <p className="text-lg text-slate-300 max-w-md leading-relaxed">
              Join thousands of municipalities worldwide using AI-driven vision systems to ensure urban safety and regulatory compliance.
            </p>
          </div>

          <div className="flex items-center gap-2 px-6 py-3 bg-slate-900/30 backdrop-blur-xl rounded-2xl border border-white/5 max-w-fit">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Ready for Global Deployment</span>
          </div>
        </div>
      </div>

      {/* Right side: Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
          <div className="text-center lg:hidden flex flex-col items-center mb-12">
            <Shield className="w-12 h-12 text-indigo-500 mb-4" />
            <h1 className="text-2xl font-bold text-white">SafeCity Monitor</h1>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Create Account</h2>
            <p className="text-slate-400 font-medium">Register your agency for city-wide AI monitoring access.</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm animate-in shake duration-500">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full bg-slate-800/50 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Agency/Dept</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="text"
                    name="agency"
                    value={formData.agency}
                    onChange={handleChange}
                    placeholder="Transit Dept"
                    className="w-full bg-slate-800/50 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Official Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@agency.gov"
                  className="w-full bg-slate-800/50 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Set Access Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-slate-800/50 border border-slate-700 text-white pl-10 pr-12 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirm Access Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-slate-800/50 border border-slate-700 text-white pl-10 pr-12 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-indigo-600/5 border border-indigo-600/20 rounded-2xl">
              <input
                type="checkbox"
                id="terms"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="terms" className="text-[11px] text-slate-400 leading-relaxed font-medium cursor-pointer">
                I agree to the <span className="text-indigo-400 cursor-pointer font-bold">Security Protocol</span> and <span className="text-indigo-400 cursor-pointer font-bold">Data Handling Policies</span>.
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full group flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-wait text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all transform active:scale-[0.99] shadow-2xl shadow-indigo-600/20"
            >
              {isLoading ? "Registering..." : "Confirm Registration"}
              {!isLoading && <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="pt-6 text-center border-t border-slate-800">
            <p className="text-sm text-slate-500 font-medium">
              Already have an authorized account?
              <button
                onClick={onToggleMode}
                className="text-indigo-400 font-bold ml-2 hover:text-indigo-300 transition-colors"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
