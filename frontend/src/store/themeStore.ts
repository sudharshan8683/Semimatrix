import { create } from 'zustand';

export type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem('semimatrix_theme') || localStorage.getItem('fabsense_theme');
  if (saved === 'light' || saved === 'dark') {
    return saved as Theme;
  }
  return 'light';
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: getInitialTheme(),
  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(nextTheme);
  },
  setTheme: (theme: Theme) => {
    localStorage.setItem('semimatrix_theme', theme);
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
    }
    set({ theme });
  }
}));

// Apply theme class on page load
if (typeof document !== 'undefined') {
  const currentTheme = getInitialTheme();
  if (currentTheme === 'dark') {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
  }
}
