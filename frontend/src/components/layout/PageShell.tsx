import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { ThemeToggle } from '../ThemeToggle';
import { DataBasisBadge } from '../common/DataBasisBadge';
import {
  LayoutDashboard,
  Cpu,
  Layers,
  Wrench,
  Search,
  Database,
  Bell,
  FileSpreadsheet,
  FileCode,
  Shield,
  BookOpen,
  LogOut,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LucideIcon,
  Factory,
  Activity,
  Sliders,
  CheckCircle2,
  Lock,
  ExternalLink,
  HelpCircle,
  Pin,
  PinOff
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
    title: 'Workspace',
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
        description: 'Chamber telemetry, parameter catalogues & Nelson SPC rules',
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
    id: 'intelligence',
    title: 'Intelligence',
    shortLabel: 'ML',
    description: 'Predictive health, failure attribution & algorithms',
    icon: Activity,
    badge: '3 tools',
    items: [
      {
        to: '/predictive-maintenance',
        aliases: ['/maintenance'],
        label: 'Predictive Maintenance',
        description: 'Weibull RUL estimation & equipment degradation scoring',
        icon: Wrench,
      },
      {
        to: '/investigations',
        aliases: ['/investigation'],
        label: 'Root Cause Analysis',
        description: "Cohen's d effect size ranking & chamber diagnostic checklists",
        icon: Search,
      },
      {
        to: '/model-card',
        aliases: ['/models'],
        label: 'Process Intelligence',
        description: 'UCI SECOM benchmark metrics, holdout PR-AUC & limitations',
        icon: FileCode,
      },
    ],
  },
  {
    id: 'data',
    title: 'Data',
    shortLabel: 'Data',
    description: 'Cleanroom telemetry ingestion & exported reports',
    icon: Database,
    badge: '2 tools',
    items: [
      {
        to: '/datasets',
        aliases: ['/history', '/settings'],
        label: 'Datasets & Mapping',
        description: 'Proprietary CSV/XLSX ingestion, mapping & capability validation',
        icon: Database,
      },
      {
        to: '/reports',
        aliases: [],
        label: 'Reports & Exports',
        description: 'Automated executive summaries & defanged tabular data exports',
        icon: FileSpreadsheet,
      },
    ],
  },
  {
    id: 'system',
    title: 'System',
    shortLabel: 'Sys',
    description: 'Metrology formulas, credentials & security controls',
    icon: Shield,
    badge: '2 tools',
    items: [
      {
        to: '/glossary',
        aliases: [],
        label: 'Glossary & Metrology',
        description: '13 semiconductor metrology formulas, definitions & boundaries',
        icon: BookOpen,
      },
      {
        to: '/account',
        aliases: [],
        label: 'Workspace & Security',
        description: 'Cryptographic multi-tenant scoping & operator credentials',
        icon: Sliders,
      },
    ],
  },
];

export const PageShell: React.FC = () => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Helper to find category matching current route
  const findCategoryForPath = (path: string): string => {
    for (const cat of NAV_CATEGORIES) {
      for (const item of cat.items) {
        if (path === item.to || item.aliases.includes(path)) {
          return cat.id;
        }
      }
    }
    return 'workspace';
  };

  // Active Category state on the icon rail
  const [activeCategoryId, setActiveCategoryId] = useState<string>(() => {
    if (typeof window === 'undefined') return 'workspace';
    return findCategoryForPath(location.pathname);
  });

  // Secondary expandable navigation panel state (persisted)
  const [panelOpen, setPanelOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem('semimatrix_nav_panel_open');
    return stored === null ? true : stored === 'true';
  });

  // User Profile popover state
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Mobile drawer state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Sync category with current route if user navigates via in-page links
  useEffect(() => {
    const matchedCategory = findCategoryForPath(location.pathname);
    setActiveCategoryId(matchedCategory);
    setMobileDrawerOpen(false);
    setProfileMenuOpen(false);
  }, [location.pathname]);

  // Click outside to close profile popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileMenuOpen]);

  // Toggle Panel Open / Closed
  const togglePanel = () => {
    setPanelOpen((prev) => {
      const next = !prev;
      localStorage.setItem('semimatrix_nav_panel_open', String(next));
      return next;
    });
  };

  // Rail category click handler
  const handleRailCategoryClick = (categoryId: string) => {
    if (activeCategoryId === categoryId) {
      // Toggle panel if clicking same category
      togglePanel();
    } else {
      setActiveCategoryId(categoryId);
      if (!panelOpen) {
        setPanelOpen(true);
        localStorage.setItem('semimatrix_nav_panel_open', 'true');
      }
    }
  };

  const activeCategory = NAV_CATEGORIES.find((c) => c.id === activeCategoryId) || NAV_CATEGORIES[0];

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
      return 'Guided Cleanroom Onboarding';
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
    <div className="flex h-screen w-full bg-[#F4F6F8] dark:bg-[#0B111D] text-slate-900 dark:text-slate-100 font-sans antialiased overflow-hidden select-none">
      {/* =========================================================================
          1. COMPACT 68PX PERMANENT ICON RAIL (DESKTOP)
          ========================================================================= */}
      <aside
        className="hidden lg:flex flex-col items-center justify-between w-[68px] h-full bg-[#0D1520] dark:bg-[#090F17] border-r border-[#1B293A] shrink-0 z-30 py-4"
        aria-label="Main Navigation Rail"
      >
        {/* Top: Semimatrix Industrial Logo Mark */}
        <div className="flex flex-col items-center gap-6 w-full">
          <Link
            to="/overview"
            title="Semimatrix Fab Intelligence"
            className="group relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-b from-[#16324F] to-[#0F2238] border border-cyan-500/40 text-white shadow-md hover:border-cyan-400 transition-all duration-200"
          >
            {/* Silicon wafer chip icon representation */}
            <div className="relative flex items-center justify-center">
              <span className="font-display font-black text-sm tracking-tighter text-cyan-400 group-hover:scale-105 transition-transform">
                SM
              </span>
              {/* Active cleanroom beacon dot */}
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-[#0D1520] animate-pulse" />
            </div>

            {/* Hover Tooltip */}
            <div className="absolute left-[76px] px-3 py-1.5 bg-[#0F1E2E] text-slate-100 text-xs font-medium rounded-lg shadow-xl border border-cyan-500/30 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50">
              <div className="font-display font-bold text-cyan-400">Semimatrix</div>
              <div className="text-[10px] text-slate-400">Fab Process Intelligence</div>
            </div>
          </Link>

          {/* Module Category Rail Icons */}
          <nav className="flex flex-col items-center gap-2.5 w-full px-2" aria-label="Module Categories">
            {NAV_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = activeCategoryId === cat.id;
              const categoryHasActiveRoute = cat.items.some((item) => isSubItemActive(item));

              return (
                <div key={cat.id} className="relative group w-full flex justify-center">
                  {/* Refined Cyan Active Indicator Bar */}
                  {isSelected && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-cyan-400 rounded-r shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                  )}

                  <button
                    type="button"
                    onClick={() => handleRailCategoryClick(cat.id)}
                    aria-label={cat.title}
                    aria-expanded={isSelected && panelOpen}
                    className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${
                      isSelected
                        ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/40 shadow-sm'
                        : categoryHasActiveRoute
                        ? 'bg-white/5 text-slate-200 border border-slate-700/60'
                        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <Icon size={19} className="transition-transform group-hover:scale-105" />
                    <span className="text-[9px] font-mono tracking-tight mt-0.5 opacity-80">
                      {cat.shortLabel}
                    </span>

                    {/* Has active route indicator badge if not currently selected */}
                    {!isSelected && categoryHasActiveRoute && (
                      <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    )}
                  </button>

                  {/* Tooltip on hover */}
                  <div className="absolute left-[76px] top-1/2 -translate-y-1/2 px-3 py-2 bg-[#0F1E2E] text-slate-100 text-xs rounded-lg shadow-xl border border-slate-700/80 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-white uppercase text-[11px] tracking-wider">
                        {cat.title}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
                        {cat.badge}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{cat.description}</div>
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom Rail: Setup Shortcut & User Avatar Button */}
        <div className="flex flex-col items-center gap-3 w-full px-2 pt-3 border-t border-[#1B293A]">
          {/* Quick Setup Wizard Button */}
          <Link
            to="/onboarding"
            title="Getting Started Wizard"
            className="group relative flex items-center justify-center w-10 h-10 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 transition-colors"
          >
            <Sparkles size={18} />
            <div className="absolute left-[76px] px-2.5 py-1.5 bg-[#0F1E2E] text-slate-200 text-xs rounded-lg shadow-xl border border-amber-500/30 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50">
              <span className="font-semibold text-amber-400">Cleanroom Setup</span>
              <div className="text-[10px] text-slate-400">Simulate sample cleanroom line</div>
            </div>
          </Link>

          {/* User Profile & Workspace Avatar Button */}
          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              aria-label="User Profile & Workspace Options"
              aria-expanded={profileMenuOpen}
              className={`relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200 ${
                profileMenuOpen
                  ? 'ring-2 ring-cyan-400 bg-cyan-950/60'
                  : 'hover:ring-1 hover:ring-slate-600'
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#16324F] to-[#2A6FA8] text-white font-display font-bold text-xs flex items-center justify-center shadow-inner">
                {operatorInitials}
              </div>
              {/* Online indicator */}
              <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0D1520]" />
            </button>

            {/* Profile & Workspace Popover Flyout */}
            {profileMenuOpen && (
              <div className="fixed bottom-5 left-[76px] w-72 bg-white dark:bg-[#131D31] border border-slate-200 dark:border-[#1E2D4A] rounded-2xl shadow-2xl p-4 z-50 text-xs font-sans animate-in fade-in slide-in-from-left-2 duration-150">
                {/* User Header */}
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-[#1E2D4A]">
                  <div className="w-10 h-10 rounded-xl bg-navy-900 dark:bg-slate-100 text-white dark:text-navy-950 flex items-center justify-center font-display font-bold text-sm shadow-sm shrink-0">
                    {operatorInitials}
                  </div>
                  <div className="truncate flex-1">
                    <div className="font-display font-bold text-slate-900 dark:text-slate-100 truncate">
                      {user?.fullName || 'Cleanroom Engineer'}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate">
                      {user?.email || 'engineer@semimatrix.local'}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                    {user?.role || 'owner'}
                  </span>
                </div>

                {/* Workspace Selector */}
                <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-[#0B111D] border border-slate-200/80 dark:border-[#1E2D4A]">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-400 mb-1 font-semibold">
                    <span>Active Workspace</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[9px] flex items-center gap-1">
                      <Lock size={10} /> AES-256
                    </span>
                  </div>
                  <div className="font-display font-bold text-slate-900 dark:text-slate-100 text-xs truncate">
                    {user?.workspaceName || 'Fab 300mm Operations'}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    Tenant ID: {user?.workspaceId || 'workspace_demo_primary'}
                  </div>
                </div>

                {/* Utility Navigation Links */}
                <div className="mt-3 space-y-1">
                  <Link
                    to="/onboarding"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <Sparkles size={14} className="text-amber-500" />
                    <span>Getting Started Wizard</span>
                  </Link>

                  <Link
                    to="/account"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <Shield size={14} className="text-cyan-500" />
                    <span>Workspace & Security</span>
                  </Link>

                  <Link
                    to="/glossary"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <BookOpen size={14} className="text-slate-400" />
                    <span>Metrology Glossary</span>
                  </Link>
                </div>

                {/* Sign Out Button */}
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-[#1E2D4A]">
                  <button
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors font-semibold"
                  >
                    <LogOut size={13} />
                    <span>Sign Out of Cleanroom</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* =========================================================================
          2. EXPANDABLE SECONDARY NAVIGATION PANEL (DESKTOP)
          ========================================================================= */}
      <nav
        className={`hidden lg:flex flex-col h-full bg-white dark:bg-[#101827] border-r border-slate-200 dark:border-[#1E2D4A] shrink-0 z-20 transition-all duration-200 ease-out select-none ${
          panelOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 overflow-hidden border-r-0 pointer-events-none'
        }`}
        aria-label={`${activeCategory.title} Submenu`}
      >
        <div className="w-64 flex flex-col h-full">
          {/* Submenu Header */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 dark:border-[#1E2D4A] shrink-0 bg-slate-50/50 dark:bg-[#0D1424]/50">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  {activeCategory.title}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                  {activeCategory.badge}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-400 truncate max-w-[170px] mt-0.5">
                {activeCategory.description}
              </p>
            </div>

            {/* Collapse Panel Button */}
            <button
              type="button"
              onClick={togglePanel}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Collapse secondary navigation"
              aria-label="Collapse secondary navigation"
            >
              <ChevronLeft size={16} />
            </button>
          </div>

          {/* Submenu Item Cards */}
          <div className="flex-1 p-3 space-y-1.5 overflow-y-auto">
            {activeCategory.items.map((item) => {
              const Icon = item.icon;
              const active = isSubItemActive(item);

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`group relative flex items-start gap-3 p-2.5 rounded-xl transition-all duration-150 ${
                    active
                      ? 'bg-cyan-50/80 dark:bg-cyan-950/30 text-slate-900 dark:text-white border-l-[3px] border-cyan-500 shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white border-l-[3px] border-transparent'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg shrink-0 transition-colors ${
                      active
                        ? 'bg-cyan-500 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 group-hover:bg-cyan-50 dark:group-hover:bg-cyan-950/40'
                    }`}
                  >
                    <Icon size={16} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-display text-xs font-semibold truncate ${
                          active ? 'text-cyan-950 dark:text-cyan-200' : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {item.label}
                      </span>
                      {active && (
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0 ml-1" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5 line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Submenu Footer Information */}
          <div className="p-3 border-t border-slate-200 dark:border-[#1E2D4A] bg-slate-50/70 dark:bg-[#0D1424]/60 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Cleanroom Live</span>
            </span>
            <span className="font-mono text-[9px] text-slate-400">v2.4.0-ind</span>
          </div>
        </div>
      </nav>

      {/* =========================================================================
          3. MOBILE NAVIGATION DRAWER
          ========================================================================= */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Drawer Body */}
          <div className="relative flex flex-col w-4/5 max-w-sm h-full bg-white dark:bg-[#101827] shadow-2xl border-r border-slate-200 dark:border-[#1E2D4A] z-10">
            {/* Header */}
            <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 dark:border-[#1E2D4A] bg-[#0D1520] text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-navy-800 border border-cyan-500/40 text-cyan-400 font-display font-black text-xs flex items-center justify-center">
                  SM
                </div>
                <div>
                  <div className="font-display font-bold text-sm tracking-tight leading-none text-white">
                    Semimatrix
                  </div>
                  <span className="text-[10px] text-cyan-400 font-mono">Fab Intelligence</span>
                </div>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Category Switcher Tabs */}
            <div className="flex border-b border-slate-200 dark:border-[#1E2D4A] bg-slate-50 dark:bg-[#0B111D]">
              {NAV_CATEGORIES.map((cat) => {
                const isSelected = activeCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategoryId(cat.id)}
                    className={`flex-1 py-2 text-center text-xs font-semibold transition-colors border-b-2 ${
                      isSelected
                        ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400 bg-white dark:bg-[#101827]'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {cat.shortLabel}
                  </button>
                );
              })}
            </div>

            {/* Menu Items */}
            <div className="flex-1 p-3 space-y-2 overflow-y-auto">
              {activeCategory.items.map((item) => {
                const Icon = item.icon;
                const active = isSubItemActive(item);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
                      active
                        ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-900 dark:text-cyan-200 border border-cyan-200 dark:border-cyan-800'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon size={18} className={active ? 'text-cyan-500' : 'text-slate-400'} />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-xs">{item.label}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.description}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-[#1E2D4A] flex items-center justify-between">
              <div className="text-xs">
                <div className="font-bold text-slate-800 dark:text-slate-200">{user?.fullName || 'Operator'}</div>
                <div className="text-[10px] text-slate-400">{user?.workspaceName || 'Fab 300mm'}</div>
              </div>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="text-rose-600 text-xs font-semibold flex items-center gap-1"
              >
                <LogOut size={13} />
                <span>Exit</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          4. MAIN VIEWPORT CONTAINER
          ========================================================================= */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
        {/* Top Operational Header */}
        <header className="h-16 px-4 sm:px-6 border-b border-slate-200 dark:border-[#1E2D4A] bg-white dark:bg-[#131D31] flex items-center justify-between shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-1.5 rounded-lg border border-slate-200 dark:border-[#1E2D4A] text-slate-600 dark:text-slate-300"
              aria-label="Open mobile navigation"
            >
              <Menu size={18} />
            </button>

            {/* Desktop Panel Expand Toggle (visible when panel is collapsed) */}
            {!panelOpen && (
              <button
                type="button"
                onClick={togglePanel}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#1E2D4A] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-medium"
                title="Expand navigation panel"
              >
                <ChevronRight size={14} />
                <span>Modules</span>
              </button>
            )}

            {/* Breadcrumb Path */}
            <div className="flex items-center gap-2 text-xs">
              <Factory size={15} className="text-cyan-600 dark:text-cyan-400 hidden sm:inline" />
              <span className="text-slate-400 font-medium hidden sm:inline">
                {activeCategory.title} /
              </span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white font-display">
                {getCurrentPageTitle()}
              </span>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2.5">
            <DataBasisBadge sourceType="synthetic" />
            <div className="h-4 w-px bg-slate-200 dark:bg-[#1E2D4A] hidden sm:block" />

            <Link
              to="/onboarding"
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-[#1E2D4A] transition-colors"
            >
              <Sparkles size={13} className="text-amber-500" />
              <span>Guided Setup</span>
            </Link>

            <ThemeToggle />
          </div>
        </header>

        {/* Viewport Content Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F4F6F8] dark:bg-[#0B111D] relative">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
