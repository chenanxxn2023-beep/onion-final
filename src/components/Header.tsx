'use client'

import React from 'react'
import { Sparkles, Home } from 'lucide-react'
import { useWizardStore, useCurrentStep } from '@/store/useWizardStore'
import { cn } from '@/lib/utils'

export function Header() {
  const reset = useWizardStore((state) => state.reset)
  const currentStep = useCurrentStep()

  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-lg border-b border-violet-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={reset}
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xl shadow-lg shadow-violet-500/25 group-hover:scale-105 transition-transform">
              🧅
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-onion-text font-display">
                洋葱热点灵感捕手
              </h1>
              <p className="text-xs text-onion-muted -mt-0.5">
                Onion Daily Trend Catcher
              </p>
            </div>
          </button>

          {/* Center - Current Step Badge (Mobile) */}
          <div className="sm:hidden">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100 text-violet-700 text-xs font-medium">
              <Sparkles className="w-3 h-3" />
              Step {currentStep + 1}/5
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {currentStep > 0 && (
              <button
                onClick={reset}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium",
                  "bg-violet-100 text-violet-700 hover:bg-violet-200",
                  "transition-colors duration-200"
                )}
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">返回首页</span>
              </button>
            )}
            
            {/* User Avatar Placeholder */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-300 to-purple-400 flex items-center justify-center text-white text-sm font-bold shadow-sm">
              运
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
