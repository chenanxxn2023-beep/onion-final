'use client'

import React from 'react'
import { Palette, ArrowLeft, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useWizardStore,
  useSelectedTrend,
  useSelectedAngle,
  useSelectedScript,
  MOCK_VISUALS,
  type Visual,
} from '@/store/useWizardStore'

// ============================================
// Visual Card Component
// ============================================

interface VisualCardProps {
  visual: Visual
  onSelect: (visual: Visual) => void
  delay?: number
}

function VisualCard({ visual, onSelect, delay = 0 }: VisualCardProps) {
  // Generate placeholder gradient colors based on visual style
  const gradientMap: Record<string, string> = {
    '2.5D 等距插画': 'from-violet-400 via-purple-400 to-pink-400',
    '扁平矢量风': 'from-blue-400 via-cyan-400 to-teal-400',
    '卡通漫画风': 'from-orange-400 via-amber-400 to-yellow-400',
    '动态海报风': 'from-rose-400 via-red-400 to-orange-400',
  }

  const gradient = gradientMap[visual.style] || 'from-violet-400 to-purple-400'

  return (
    <button
      onClick={() => onSelect(visual)}
      className={cn(
        "group relative w-full text-left rounded-2xl border-2 border-transparent overflow-hidden",
        "bg-white/80 backdrop-blur-sm shadow-sm",
        "transition-all duration-300 ease-out",
        "hover:border-violet-300 hover:bg-white hover:shadow-xl hover:shadow-violet-500/15",
        "hover:-translate-y-2 hover:scale-[1.02]",
        "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2",
        "animate-slide-up"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Visual Preview (Placeholder) */}
      <div className={cn(
        "relative aspect-[4/3] bg-gradient-to-br overflow-hidden",
        gradient
      )}>
        {/* Onion Style Visual Elements */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* 2.5D Classroom Elements */}
          <div className="relative">
            {/* Desk */}
            <div className="w-32 h-16 bg-white/30 rounded-lg transform -skew-x-6 shadow-lg" />
            {/* Character */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2">
              <div className="w-12 h-12 bg-white/50 rounded-full shadow-lg flex items-center justify-center text-2xl">
                🧅
              </div>
            </div>
            {/* Book */}
            <div className="absolute top-2 left-4 w-8 h-6 bg-white/40 rounded transform rotate-6" />
            {/* Floating elements */}
            <div className="absolute -top-6 -right-8 text-3xl animate-bounce-soft">✨</div>
            <div className="absolute -bottom-4 -left-6 text-2xl animate-pulse-soft">💡</div>
          </div>
        </div>

        {/* Style Label */}
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-gray-700 shadow-sm">
            {visual.style}
          </span>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-violet-900/0 group-hover:bg-violet-900/20 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100">
            <div className="w-14 h-14 rounded-full bg-white shadow-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-violet-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="p-4">
        <p className="text-sm text-onion-muted leading-relaxed group-hover:text-onion-text transition-colors">
          {visual.description}
        </p>
      </div>
    </button>
  )
}

// ============================================
// Main Visual Selection Component
// ============================================

export function VisualSelection() {
  const selectVisual = useWizardStore((state) => state.selectVisual)
  const goBack = useWizardStore((state) => state.goBack)
  const selectedTrend = useSelectedTrend()
  const selectedAngle = useSelectedAngle()
  const selectedScript = useSelectedScript()

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Back Button */}
      <button
        onClick={goBack}
        className="group flex items-center gap-2 text-onion-muted hover:text-violet-600 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">返回文案选择</span>
      </button>

      {/* Page Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 text-violet-700 text-sm font-medium mb-4">
          <Palette className="w-4 h-4" />
          视觉转化 · Step 3
        </div>
        <h1 className="text-3xl font-bold gradient-text mb-3 font-display">
          选择视觉风格
        </h1>
        <p className="text-onion-muted max-w-lg mx-auto mb-6">
          AI 已生成 4 种洋葱风格的视觉草图，选择最吸睛的设计方向
        </p>

        {/* Context Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 px-4">
          {selectedTrend && (
            <div className="inline-flex items-start gap-2 px-3 py-1.5 rounded-lg bg-white/60 border border-violet-200 text-xs max-w-full sm:max-w-sm h-auto">
              <span className="text-violet-500 flex-shrink-0 mt-0.5">📰</span>
              <span className="text-onion-text whitespace-normal break-words text-left">
                {selectedTrend.title}
              </span>
            </div>
          )}
          {selectedAngle && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/60 border border-violet-200 text-xs">
              <span>{selectedAngle.icon}</span>
              <span className="text-onion-text">{selectedAngle.type}</span>
            </div>
          )}
          {selectedScript && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/60 border border-violet-200 text-xs">
              <span>{selectedScript.icon}</span>
              <span className="text-onion-text">{selectedScript.channel}</span>
            </div>
          )}
        </div>
      </div>

      {/* Visual Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {MOCK_VISUALS.map((visual, index) => (
          <VisualCard
            key={visual.id}
            visual={visual}
            onSelect={selectVisual}
            delay={index * 100}
          />
        ))}
      </div>

      {/* Style Tip */}
      <div className="mt-8 p-4 rounded-xl bg-violet-50 border border-violet-100 text-center">
        <p className="text-sm text-violet-700">
          💡 <strong>洋葱风格</strong>: 2.5D 插画 · 明亮色彩 · 卡通形象 · 干货满满
        </p>
      </div>
    </div>
  )
}
