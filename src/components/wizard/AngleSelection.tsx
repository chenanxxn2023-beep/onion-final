'use client'

import React from 'react'
import { Lightbulb, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useWizardStore,
  useSelectedTrend,
  MOCK_ANGLES,
  type Angle,
} from '@/store/useWizardStore'

// ============================================
// Angle Card Component
// ============================================

interface AngleCardProps {
  angle: Angle
  onSelect: (angle: Angle) => void
  delay?: number
}

function AngleCard({ angle, onSelect, delay = 0 }: AngleCardProps) {
  const typeColors: Record<string, string> = {
    '硬核科普': 'from-blue-500 to-cyan-500',
    '升学政策': 'from-emerald-500 to-teal-500',
    '趣味脑洞': 'from-pink-500 to-rose-500',
  }

  return (
    <button
      onClick={() => onSelect(angle)}
      className={cn(
        "group relative w-full text-left p-6 rounded-2xl border-2 border-transparent",
        "bg-white/80 backdrop-blur-sm shadow-sm",
        "transition-all duration-300 ease-out",
        "hover:border-violet-300 hover:bg-white hover:shadow-xl hover:shadow-violet-500/15",
        "hover:-translate-y-2 hover:scale-[1.02]",
        "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2",
        "animate-slide-up"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Icon */}
      <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform">
        {angle.icon}
      </div>

      {/* Type Badge */}
      <div className={cn(
        "inline-flex px-3 py-1 rounded-full text-xs font-bold text-white mb-3",
        `bg-gradient-to-r ${typeColors[angle.type] || 'from-violet-500 to-purple-500'}`
      )}>
        {angle.type}
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-onion-text mb-2 group-hover:text-violet-700 transition-colors">
        {angle.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-onion-muted leading-relaxed">
        {angle.description}
      </p>

      {/* Hover Effect Overlay */}
      <div className={cn(
        "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none",
        `bg-gradient-to-br ${typeColors[angle.type] || 'from-violet-500 to-purple-500'}`,
        "opacity-0 group-hover:opacity-[0.03]"
      )} />

      {/* Arrow Indicator */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
        <div className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center text-white shadow-lg">
          →
        </div>
      </div>
    </button>
  )
}

// ============================================
// Main Angle Selection Component
// ============================================

export function AngleSelection() {
  const selectAngle = useWizardStore((state) => state.selectAngle)
  const goBack = useWizardStore((state) => state.goBack)
  const selectedTrend = useSelectedTrend()

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Back Button */}
      <button
        onClick={goBack}
        className="group flex items-center gap-2 text-onion-muted hover:text-violet-600 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">返回热点选择</span>
      </button>

      {/* Page Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 text-violet-700 text-sm font-medium mb-4">
          <Lightbulb className="w-4 h-4" />
          角度发散 · Step 1
        </div>
        <h1 className="text-3xl font-bold gradient-text mb-3 font-display">
          选择切入角度
        </h1>
        <p className="text-onion-muted max-w-lg mx-auto mb-6">
          AI 已基于热点生成 3 个 K12 教育切入角度，点击选择最适合的方向
        </p>

        {/* Selected Trend Preview */}
        {selectedTrend && (
          <div className="inline-flex items-start gap-2 px-4 py-3 rounded-xl bg-white/60 border border-violet-200 text-sm max-w-full sm:max-w-xl mx-4 sm:mx-auto h-auto">
            <span className="text-violet-500 flex-shrink-0 mt-0.5">📰</span>
            <span className="text-onion-text font-medium whitespace-normal break-words text-left">
              {selectedTrend.title}
            </span>
          </div>
        )}
      </div>

      {/* Angle Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MOCK_ANGLES.map((angle, index) => (
          <AngleCard
            key={angle.id}
            angle={angle}
            onSelect={selectAngle}
            delay={index * 150}
          />
        ))}
      </div>
    </div>
  )
}
