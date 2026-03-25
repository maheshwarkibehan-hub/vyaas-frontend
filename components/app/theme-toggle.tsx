'use client';

import { useEffect, useState } from 'react';
import { MonitorIcon, MoonIcon, SunIcon } from '@phosphor-icons/react';
import { THEME_MEDIA_QUERY, THEME_STORAGE_KEY, cn } from '@/lib/utils';

const THEME_SCRIPT = `
  const doc = document.documentElement;
  doc.classList.add("dark");
  doc.classList.remove("light");
`
  .trim()
  .replace(/\n/g, '')
  .replace(/\s+/g, ' ');

export type ThemeMode = 'dark' | 'light' | 'system';

function applyTheme(theme: ThemeMode) {
  const doc = document.documentElement;
  doc.classList.add('dark');
  doc.classList.remove('light');
  localStorage.setItem(THEME_STORAGE_KEY, 'dark');
}

interface ThemeToggleProps {
  className?: string;
}

export function ApplyThemeScript() {
  return <script id="theme-script">{THEME_SCRIPT}</script>;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [theme, setTheme] = useState<ThemeMode | undefined>(undefined);

  useEffect(() => {
    setTheme('dark');
    applyTheme('dark');
  }, []);

  function handleThemeChange(theme: ThemeMode) {
    applyTheme('dark');
    setTheme('dark');
  }

  return (
    <div
      className={cn(
        'text-foreground bg-background flex w-full flex-row justify-end divide-x overflow-hidden rounded-full border',
        className
      )}
    >
      <span className="sr-only">Color scheme toggle</span>
      <button
        type="button"
        onClick={() => handleThemeChange('dark')}
        className="cursor-pointer p-1 pl-1.5"
      >
        <span className="sr-only">Enable dark color scheme</span>
        <MoonIcon size={16} weight="bold" className={cn(theme !== 'dark' && 'opacity-25')} />
      </button>
      <button
        type="button"
        onClick={() => handleThemeChange('light')}
        className="cursor-pointer px-1.5 py-1"
      >
        <span className="sr-only">Enable light color scheme</span>
        <SunIcon size={16} weight="bold" className={cn(theme !== 'light' && 'opacity-25')} />
      </button>
      <button
        type="button"
        onClick={() => handleThemeChange('system')}
        className="cursor-pointer p-1 pr-1.5"
      >
        <span className="sr-only">Enable system color scheme</span>
        <MonitorIcon size={16} weight="bold" className={cn(theme !== 'system' && 'opacity-25')} />
      </button>
    </div>
  );
}
