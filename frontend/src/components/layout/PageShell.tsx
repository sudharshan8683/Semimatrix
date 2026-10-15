import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { ThemeToggle } from '../ThemeToggle';
import {
  LayoutDashboard,
  Cpu,
  Layers,
  Database,
  Bell,
  LogOut,
  Menu,
  X,
  LucideIcon
} from 'lucide-react';

export interface NavSubItem {
  to: string;
  aliases: string[];
  label: string;
  description: string;
  icon: LucideIcon;
}

export interface NavCategory {
  id: string;
  title: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
  items: NavSubItem[];
}

export const NAV_CATEGORIES: NavCategory[] = [
  {
    id: 'workspace',
    title: 'Fab Operations',
    shortLabel: 'Fab',
    description: 'Cleanroom operations & wafer line monitoring',
    icon: LayoutDashboard,
    badge: '4 tools',
    items: [
      {
        to: '/overview',
        aliases: ['/', '/dashboard'],
        label: 'Operations Overview',
        description: 'Real-time cleanroom status, line yield & KPI rollups',
        icon: LayoutDashboard,
      },
      {
        to: '/equipment',
        aliases: ['/floor'],
        label: 'Equipment Health',
        description: 'Chamber telemetry, parameter catalogues & SPC rules',
        icon: Cpu,
      },
      {
        to: '/yield',
        aliases: ['/analytics'],
        label: 'Production & Yield',
        description: 'Stage-by-stage scrap loss decomposition & lot tracking',
        icon: Layers,
      },
      {
        to: '/alerts',
        aliases: [],
        label: 'Alerts & Incidents',
        description: 'Automated excursion notifications & incident lifecycle triage',
        icon: Bell,
      },
    ],
  },
  {
    id: 'data',
    title: 'Data & Telemetry',
    shortLabel: 'Data',
    description: 'Cleanroom telemetry ingestion & mapping',
    icon: Database,
    badge: '1 tool',
    items: [
      {
        to: '/datasets',
        aliases: ['/history', '/settings'],
        label: 'Datasets & Mapping',
        description: 'CSV, XLSX, and ZIP cleanroom dataset ingestion',
        icon: Database,
      },
    ],
  },
];

export const PageShell: React.FC = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  const isSubItemActive = (item: NavSubItem) => {
    if (location.pathname === item.to) return true;
    return item.aliases.includes(location.pathname);
  };

  const getCurrentPageTitle = (): string => {
    for (const cat of NAV_CATEGORIES) {
      for (const item of cat.items) {
        if (isSubItemActive(item)) return item.label;
      }
    }
    if (location.pathname === '/onboarding' || location.pathname === '/getting-started') {
      return 'Onboarding';
    }
    return 'Operations Overview';
  };

  const operatorInitials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'OP';

  return (
    <div className="flex h-screen w-full bg-neutral-50 dark:bg-black text-neutral-900 dark:text-neutral-100 font-sans antialiased overflow-hidden select-none">
      {/* 1. SINGLE UNIFIED SIDEBAR (DESKTOP) */}
      <aside
        className="hidden lg:flex flex-col justify-between w-64 h-full bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800 shrink-0 z-30"
        aria-label="Main Navigation Sidebar"
      >
        {/* App Brand Header */}
        <div className="h-16 px-4 flex items-center gap-3 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
          <Link
            to="/overview"
            title="Semi Matrix Fab"
            className="group flex items-center justify-center w-10 h-10 rounded-xl overflow-hidden hover:opacity-90 hover:scale-105 transition-all shadow-sm ring-1 ring-neutral-300 dark:ring-neutral-700 bg-black shrink-0"
          >
            <img
              src="/logo-circle.png"
              alt="Semi Matrix Fab"
              className="w-9 h-9 rounded-full object-cover"
            />
          </Link>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm text-neutral-900 dark:text-white truncate tracking-tight font-display">
              Semi Matrix Fab
            </span>
            <span className="text-[10px] text-neutral-500 font-mono truncate">
              Cleanroom Intelligence
            </span>
          </div>
        </div>

        {/* Scrollable Single Navigation List */}
        <div className="flex-1 p-3 space-y-4 overflow-y-auto">
          {NAV_CATEGORIES.map((cat) => (
            <div key={cat.id} className="space-y-1">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {cat.title}
              </div>
              <div className="space-y-0.5">
                {cat.items.map((item) => {
                  const Icon = item.icon;
                  const active = isSubItemActive(item);

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
                        active
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold shadow-sm'
                          : 'text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
                      }`}
                    >
                      <Icon
                        size={16}
                        className={active ? 'text-white dark:text-neutral-950' : 'text-neutral-600 dark:text-neutral-300'}
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Footer: Status & User Profile */}
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 space-y-2 shrink-0 bg-neutral-50/50 dark:bg-neutral-900/30">
          <div className="px-2 flex items-center justify-between text-[11px] text-neutral-500">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-neutral-600 dark:text-neutral-400">Connected</span>
            </span>
            <span className="text-[10px] font-mono text-neutral-400">v1.0</span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold text-xs flex items-center justify-center shrink-0">
                {operatorInitials}
              </div>
              <div className="truncate">
                <div className="font-semibold text-xs text-neutral-900 dark:text-white truncate">
                  {user?.fullName || 'Cleanroom Engineer'}
                </div>
                <div className="text-[10px] text-neutral-400 truncate">
                  {user?.workspaceName || 'Fab Operations'}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="p-1.5 rounded-md text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MOBILE NAVIGATION DRAWER */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileDrawerOpen(false)}
          />

          <div className="relative flex flex-col w-4/5 max-w-xs h-full bg-white dark:bg-neutral-950 shadow-2xl border-r border-neutral-200 dark:border-neutral-800 z-10">
            <div className="h-16 px-4 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2.5">
                <img
                  src="/logo-circle.png"
                  alt="Semi Matrix Fab"
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-neutral-300 dark:ring-neutral-700 shadow-sm"
                />
                <div>
                  <div className="font-bold text-sm text-neutral-900 dark:text-white leading-none">
                    Semi Matrix Fab
                  </div>
                  <div className="text-[10px] font-mono text-neutral-400">
                    Cleanroom Intelligence
                  </div>
                </div>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 p-3 space-y-4 overflow-y-auto">
              {NAV_CATEGORIES.map((cat) => (
                <div key={cat.id} className="space-y-1">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    {cat.title}
                  </div>
                  <div className="space-y-0.5">
                    {cat.items.map((item) => {
                      const Icon = item.icon;
                      const active = isSubItemActive(item);
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setMobileDrawerOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors ${
                            active
                              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 font-semibold shadow-sm'
                              : 'text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
                          }`}
                        >
                          <Icon size={16} />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <div className="text-xs">
                <div className="font-medium text-neutral-800 dark:text-neutral-200">{user?.fullName || 'Operator'}</div>
                <div className="text-[10px] text-neutral-400">{user?.workspaceName || 'Fab Operations'}</div>
              </div>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="text-rose-600 text-xs font-medium flex items-center gap-1"
              >
                <LogOut size={13} />
                <span>Exit</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
        <header className="h-14 px-4 sm:px-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex items-center justify-between shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300"
              aria-label="Open navigation"
            >
              <Menu size={18} />
            </button>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-sm font-semibold text-neutral-900 dark:text-white font-display">
                {getCurrentPageTitle()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-neutral-50 dark:bg-black relative">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
