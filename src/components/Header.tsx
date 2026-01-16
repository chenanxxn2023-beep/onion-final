'use client'

import React from 'react'
import Image from 'next/image'
import { Sparkles, Home } from 'lucide-react'
import { useWizardStore, useCurrentStep } from '@/store/useWizardStore'
import { cn } from '@/lib/utils'

export function Header() {
  const reset = useWizardStore((state) => state.reset)
  const currentStep = useCurrentStep()

  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-lg border-b border-onion-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={reset}
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-onion-blue-500 to-onion-blue-600 flex items-center justify-center shadow-lg shadow-onion-blue-500/25 group-hover:scale-105 transition-transform">
              <Image 
                src="/images/yangcong-icon.png" 
                alt="洋葱" 
                width={40} 
                height={40} 
                className="w-full h-full object-contain" 
              />
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
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-onion-blue-100 text-onion-blue-700 text-xs font-medium">
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
                  "bg-onion-blue-100 text-onion-blue-700 hover:bg-onion-blue-200",
                  "transition-colors duration-200"
                )}
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">返回首页</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
