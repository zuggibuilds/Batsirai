import { ReactNode, useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

type ThemeMode = 'light' | 'dark';
type ThemePreference = ThemeMode | 'system';

const THEME_KEY = 'batsirai-theme-mode';

function ThemeIcon({ mode }: { mode: ThemePreference }) {
  if (mode === 'dark') {
    return (
      <svg className="theme-pill-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <path d="M11.4 1.8a5.9 5.9 0 1 0 2.8 10.9A6.4 6.4 0 0 1 11.4 1.8Z" fill="currentColor" />
      </svg>
    );
  }

  if (mode === 'system') {
    return (
      <svg className="theme-pill-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
        <rect x="1.5" y="2.2" width="13" height="8.7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M6 13.2h4M4.8 13.2h6.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg className="theme-pill-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <circle cx="8" cy="8" r="3" fill="currentColor" />
      <path
        d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M12.8 3.2l-1.4 1.4M4.6 11.4l-1.4 1.4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ThemeModeToggle() {
  const [themePreference, setThemePreference] = useState<ThemePreference>('system');
  const [systemTheme, setSystemTheme] = useState<ThemeMode>('light');

  const effectiveTheme = useMemo<ThemeMode>(() => {
    if (themePreference === 'system') {
      return systemTheme;
    }

    return themePreference;
  }, [systemTheme, themePreference]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const initialSystemTheme: ThemeMode = mediaQuery.matches ? 'dark' : 'light';
    const stored = localStorage.getItem(THEME_KEY) as ThemePreference | null;
    const initialPreference: ThemePreference =
      stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';

    setSystemTheme(initialSystemTheme);
    setThemePreference(initialPreference);

    const handleThemeChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion) {
      root.classList.add('theme-animating');
      window.setTimeout(() => {
        root.classList.remove('theme-animating');
      }, 260);
    }

    root.dataset.theme = effectiveTheme;
  }, [effectiveTheme]);

  function applyThemePreference(nextPreference: ThemePreference) {
    setThemePreference(nextPreference);
    localStorage.setItem(THEME_KEY, nextPreference);
  }

  return (
    <div className="theme-toggle" role="group" aria-label="Color theme">
      <div className="theme-pill-set">
        <button
          type="button"
          className={`theme-pill ${themePreference === 'light' ? 'theme-pill-active' : ''}`}
          onClick={() => applyThemePreference('light')}
          aria-pressed={themePreference === 'light'}
        >
          <ThemeIcon mode="light" />
          <span className="theme-pill-label">Light</span>
        </button>
        <button
          type="button"
          className={`theme-pill ${themePreference === 'dark' ? 'theme-pill-active' : ''}`}
          onClick={() => applyThemePreference('dark')}
          aria-pressed={themePreference === 'dark'}
        >
          <ThemeIcon mode="dark" />
          <span className="theme-pill-label">Dark</span>
        </button>
        <button
          type="button"
          className={`theme-pill ${themePreference === 'system' ? 'theme-pill-active' : ''}`}
          onClick={() => applyThemePreference('system')}
          aria-pressed={themePreference === 'system'}
        >
          <ThemeIcon mode="system" />
          <span className="theme-pill-label">System</span>
        </button>
      </div>
      <label className="theme-select-wrap">
        <span className="sr-only">Select theme</span>
        <select
          className="theme-select"
          value={themePreference}
          onChange={(event) => applyThemePreference(event.target.value as ThemePreference)}
          aria-label="Select color theme"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
      </label>
      {themePreference === 'system' ? (
        <span className="theme-system-indicator" aria-live="polite">
          System: {effectiveTheme === 'dark' ? 'Dark' : 'Light'}
        </span>
      ) : null}
    </div>
  );
}

export function Shell({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const path = location.pathname;
    const routeGroup = path.startsWith('/auth')
      ? 'calm'
      : path.startsWith('/dashboard') || path.startsWith('/onboarding') || path.startsWith('/profile')
        ? 'provider'
        : path.startsWith('/bookings')
          ? 'activity'
          : 'discover';

    document.documentElement.dataset.routeGroup = routeGroup;
  }, [location.pathname]);

  return (
    <motion.div
      className="app-shell page-enter"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: 'easeOut' }}
    >
      <motion.header
        className="topbar"
        initial={prefersReducedMotion ? false : { y: -16, opacity: 0 }}
        animate={prefersReducedMotion ? undefined : { y: 0, opacity: 1 }}
        transition={{ duration: 0.36, ease: 'easeOut' }}
      >
        <div className="topbar-inner mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
          <Link to="/" className="brand-mark text-brand-ink">Batsirai</Link>
          <div className="topbar-actions flex flex-wrap items-center gap-2">
            <nav className="flex flex-wrap gap-3 text-sm">
              <Link to="/categories" className="nav-pill">Categories</Link>
              <Link to="/search" className="nav-pill">Search</Link>
              <Link to="/bookings" className="nav-pill">Bookings</Link>
              <Link to="/dashboard" className="nav-pill">Provider</Link>
              <Link to="/auth/login" className="nav-pill">Login</Link>
            </nav>
            <ThemeModeToggle />
          </div>
        </div>
      </motion.header>
      <motion.main
        className="shell-main mx-auto max-w-6xl px-4 py-7 md:px-6 md:py-10"
        initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
        animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.46, ease: 'easeOut', delay: 0.04 }}
      >
        <h1 className="hero-title">{title}</h1>
        {subtitle ? <p className="hero-subtitle mt-3 text-sm md:text-base">{subtitle}</p> : null}
        <div className="mt-7">{children}</div>
      </motion.main>
    </motion.div>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return <div className="glass-card p-4 md:p-5">{children}</div>;
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="font-heading text-xl font-semibold">{title}</h2>
      {action}
    </div>
  );
}
