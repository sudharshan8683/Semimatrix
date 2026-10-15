import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ThemeToggle } from '../components/ThemeToggle';
import { Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';
import { LogoMotionIntro } from '../components/common/LogoMotionIntro';

export const Login: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [email, setEmail] = useState('demo@semimatrix.local');
  const [password, setPassword] = useState('Semimatrix123!');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email.trim(), password);
    if (success) {
      navigate('/overview');
    }
  };


  return (
    <>
      {showIntro && <LogoMotionIntro onComplete={() => setShowIntro(false)} />}

      <div
        className="min-h-screen flex items-center justify-center p-4 relative font-sans text-white bg-black bg-cover bg-center bg-no-repeat overflow-hidden"
        style={{ backgroundImage: "url('/login-bg.png?v=3')" }}
      >
        {/* Top Left: Semi Matrix Fab Logo */}
        <button
          type="button"
          onClick={() => setShowIntro(true)}
          title="Click to replay motion intro"
          className="absolute top-6 left-6 sm:top-8 sm:left-10 z-20 flex items-center gap-3 select-none group text-left transition-transform hover:scale-105"
        >
          <img
            src="/logo-circle.png"
            alt="Semi Matrix Fab"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover shadow-[0_0_15px_rgba(37,99,235,0.4)] ring-1 ring-white/25 group-hover:ring-blue-400 transition-all"
          />
          <div className="flex flex-col">
            <span className="font-mono font-bold tracking-[0.2em] text-xs sm:text-sm text-white uppercase">
              SEMI MATRIX FAB
            </span>
          </div>
        </button>

        {/* Top Right: Theme toggle */}
        <div className="absolute top-6 right-6 sm:top-8 sm:right-10 z-20">
          <ThemeToggle />
        </div>

        {/* Login Card (Crisp White Card on Background Image) */}
        <div className="w-full max-w-md bg-white/95 backdrop-blur-xl p-8 rounded-2xl border border-white/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.4)] relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-500 text-neutral-900">
          {/* Brand Header */}
          <div className="flex items-center gap-3.5 mb-6 pb-5 border-b border-neutral-200">
            <img
              src="/logo-circle.png"
              alt="Semi Matrix Fab"
              className="w-11 h-11 rounded-full object-cover ring-2 ring-neutral-200 shadow-sm shrink-0"
            />
            <div>
              <h1 className="font-display font-bold text-lg text-neutral-950 tracking-tight leading-none">
                Semi Matrix Fab
              </h1>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-display font-bold text-neutral-950 tracking-tight">
              Sign In
            </h2>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1.5 text-xs">
                Email
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-3 text-neutral-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="engineer@semimatrix.local"
                  className="w-full pl-9 pr-3 py-2.5 bg-neutral-50/80 hover:bg-neutral-50 focus:bg-white border border-neutral-300 focus:border-neutral-900 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 text-xs font-mono transition-colors shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1.5 text-xs">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-3 text-neutral-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2.5 bg-neutral-50/80 hover:bg-neutral-50 focus:bg-white border border-neutral-300 focus:border-neutral-900 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 text-xs font-mono transition-colors shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-neutral-400 hover:text-neutral-900 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-neutral-950 hover:bg-neutral-800 active:bg-black text-white font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4 tracking-wide shadow-md hover:shadow-lg"
            >
              <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
              <ArrowRight size={14} className="shrink-0 text-white" />
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-neutral-200 text-center text-xs">
            <span className="text-neutral-500 text-[11px]">New user? </span>
            <Link
              to="/register"
              className="text-neutral-900 hover:text-blue-600 font-semibold text-[11px] transition-colors"
            >
              Register here →
            </Link>
          </div>
        </div>
    </div>
  </>
);
};
