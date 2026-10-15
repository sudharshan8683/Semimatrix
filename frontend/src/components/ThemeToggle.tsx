import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
        isDark
          ? 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700/80 hover:text-white'
          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm'
      } ${className}`}
    >
      {isDark ? (
        <Sun size={14} className="text-amber-400" />
      ) : (
        <Moon size={14} className="text-slate-500" />
      )}
      {showLabel && (
        <span className="capitalize">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
      )}
    </button>
  );
};
