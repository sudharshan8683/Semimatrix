import React, { useState, useEffect } from 'react';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

interface LogoMotionIntroProps {
  onComplete: () => void;
  minDuration?: number;
}

export const LogoMotionIntro: React.FC<LogoMotionIntroProps> = ({
  onComplete,
  minDuration = 4800,
}) => {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Stage progress updates spaced out smoothly
    const t0 = setTimeout(() => {
      setProgress(25);
    }, 700);

    const t1 = setTimeout(() => {
      setProgress(55);
    }, 1800);

    const t2 = setTimeout(() => {
      setProgress(85);
    }, 3000);

    const t3 = setTimeout(() => {
      setProgress(100);
    }, 4100);

    const t4 = setTimeout(() => {
      setIsFadingOut(true);
    }, minDuration);

    const t5 = setTimeout(() => {
      onComplete();
    }, minDuration + 600);

    const handleKeyDown = () => {
      handleSkip();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [minDuration, onComplete]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#030614] text-white select-none transition-all duration-500 cursor-pointer overflow-hidden ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      aria-label="Logo Intro Screen"
    >
      {/* Background radial atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(30,58,138,0.28)_0%,rgba(3,6,20,0.95)_70%,#02040c_100%)] pointer-events-none" />

      {/* Tech grid mesh */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#3B82F6 1px, transparent 1px), linear-gradient(90deg, #3B82F6 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Top Skip Button */}
      <div className="absolute top-6 right-6 sm:top-8 sm:right-10 z-20">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleSkip();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white text-xs font-mono transition-all backdrop-blur-md"
        >
          <span>Skip</span>
          <ArrowRight size={13} />
        </button>
      </div>

      {/* Center Motion Showcase */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-md w-full">
        {/* Orbital Ring Effects */}
        <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center mb-8">
          {/* Outward pulse wave 1 */}
          <div className="absolute inset-0 rounded-full border border-blue-500/40 animate-ring-pulse-1 pointer-events-none" />

          {/* Outward pulse wave 2 */}
          <div className="absolute inset-0 rounded-full border border-cyan-400/30 animate-ring-pulse-2 pointer-events-none" />

          {/* Outer tech reticle - Clockwise spin */}
          <div className="absolute -inset-4 sm:-inset-6 rounded-full border border-dashed border-blue-400/25 animate-reticle-spin pointer-events-none" />

          {/* Inner tech reticle - Counter-clockwise */}
          <div className="absolute -inset-2 rounded-full border border-dotted border-white/20 animate-reticle-rev pointer-events-none" />

          {/* Ambient Glow behind badge */}
          <div className="absolute inset-0 rounded-full bg-blue-600/30 blur-2xl pointer-events-none" />

          {/* The Hero Logo Emblem */}
          <div className="relative z-10 w-36 h-36 sm:w-44 sm:h-44 rounded-full p-1 bg-gradient-to-br from-blue-400/40 via-blue-900/40 to-black/60 shadow-[0_0_50px_rgba(37,99,235,0.45)] animate-logo-enter">
            <div className="relative w-full h-full rounded-full overflow-hidden bg-[#050A30] animate-logo-float">
              <img
                src="/logo-circle.png"
                alt="Semi Matrix Fab Logo"
                className="w-full h-full object-cover select-none pointer-events-none"
              />

              {/* High-gloss specular shimmer light sweep */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
                <div className="w-[200%] h-12 bg-gradient-to-r from-transparent via-white/40 to-transparent -rotate-45 animate-shimmer-sweep" />
              </div>
            </div>
          </div>
        </div>

        {/* Identity & Typography */}
        <div className="space-y-2 mb-7">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 font-mono text-[11px] uppercase tracking-wider mb-1">
            <Sparkles size={11} className="text-blue-400 animate-pulse" />
            <span>Cleanroom Intelligence Platform</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-[0.2em] text-white uppercase drop-shadow-md">
            SEMI MATRIX FAB
          </h1>

          <p className="text-xs sm:text-sm font-mono tracking-widest text-neutral-400 uppercase">
            MERN STACK ARCHITECTURE
          </p>
        </div>

        {/* Progress Track */}
        <div className="w-full max-w-xs pt-2">
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-white transition-all duration-1000 ease-out rounded-full shadow-[0_0_12px_rgba(56,189,248,0.8)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
