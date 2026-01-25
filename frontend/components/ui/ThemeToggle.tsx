'use client'

import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '@/lib/theme/ThemeProvider'

interface ThemeToggleProps {
  showLabel?: boolean
  variant?: 'icon' | 'dropdown'
}

export function ThemeToggle({ showLabel = false, variant = 'icon' }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme()

  if (variant === 'icon') {
    return (
      <button
        onClick={toggleTheme}
        className="relative p-2 rounded-xl bg-surface-light-elevated dark:bg-surface-dark-elevated border border-slate-200 dark:border-slate-700 hover:border-brand-500/50 transition-all duration-200 cursor-pointer group"
        aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
      >
        <Sun className="w-5 h-5 text-amber-500 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute top-2 left-2 w-5 h-5 text-brand-400 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-light-elevated dark:bg-surface-dark-elevated border border-slate-200 dark:border-slate-700">
      {[
        { value: 'light' as const, icon: Sun, label: 'Light' },
        { value: 'dark' as const, icon: Moon, label: 'Dark' },
        { value: 'system' as const, icon: Monitor, label: 'System' },
      ].map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
            theme === value
              ? 'bg-brand-500 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
          aria-label={`Use ${label} theme`}
        >
          <Icon className="w-4 h-4" />
          {showLabel && <span>{label}</span>}
        </button>
      ))}
    </div>
  )
}

export default ThemeToggle
