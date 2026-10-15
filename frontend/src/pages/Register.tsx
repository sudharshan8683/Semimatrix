import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ThemeToggle } from '../components/ThemeToggle';
import { Lock, Mail, User, Building, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';

export const Register: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { register, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await register(
      email.trim(),
      password,
      fullName.trim(),
      workspaceName.trim() || undefined
    );
    if (success) {
      navigate('/overview');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0B111D] p-4 relative font-sans">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md bg-white dark:bg-[#131D31] p-8 rounded-2xl border border-slate-200 dark:border-navy-700/80 shadow-card relative overflow-hidden">
        {/* Subtle decorative top bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-navy-900 via-amber-500 to-navy-700 dark:from-navy-600 dark:via-amber-400 dark:to-navy-500" />

        {/* Brand Header */}
        <div className="flex items-center gap-3.5 mb-6 pb-5 border-b border-slate-100 dark:border-navy-700/80">
          <div className="w-10 h-10 rounded-xl bg-navy-900 dark:bg-slate-100 text-white dark:text-navy-950 flex items-center justify-center font-display font-black text-sm shrink-0 shadow-sm">
            SM
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-xl text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                Semimatrix
              </h1>
              <span className="text-[10px] font-sans font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                Fab Intelligence
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans">
              Semiconductor Manufacturing Process Platform
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-base font-display font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
            Provision Isolated Workspace
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
            Every workspace has cryptographic data isolation. No telemetry or reports are shared across tenants.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-[11px] uppercase tracking-wider">
              Operator Full Name
            </label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. Eleanor Vance"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-navy-700 dark:focus:border-amber-500 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-[11px] uppercase tracking-wider">
              Work Email Address
            </label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.vance@fabcorp.com"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-navy-700 dark:focus:border-amber-500 text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-[11px] uppercase tracking-wider">
              Fab / Facility Name
            </label>
            <div className="relative">
              <Building size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="Fab-12 Cleanroom Operations"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-navy-700 dark:focus:border-amber-500 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-[11px] uppercase tracking-wider">
              Password (Min 8 Characters)
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-navy-700 dark:focus:border-amber-500 text-xs font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-slate-950 font-display font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4 tracking-wide uppercase"
          >
            <span>{isLoading ? 'Provisioning Workspace...' : 'Provision Workspace'}</span>
            <ArrowRight size={16} className="text-slate-950 shrink-0" />
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-navy-700/80 text-center text-xs">
          <Link
            to="/login"
            className="text-amber-700 dark:text-amber-400 hover:underline font-semibold text-[11px]"
          >
            Already provisioned? Sign in →
          </Link>
        </div>
      </div>
    </div>
  );
};
