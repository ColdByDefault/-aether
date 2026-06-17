'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="inline-flex items-center gap-2 border border-border bg-muted/40 px-2.5 py-1.5 font-mono text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
      aria-label="Toggle color theme"
    >
      <span className="accent-text">$theme</span>
      <span className="text-foreground">{mounted ? (isDark ? 'dark' : 'light') : '...'}</span>
    </button>
  )
}
