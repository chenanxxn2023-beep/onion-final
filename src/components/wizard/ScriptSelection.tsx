'use client'

import React from 'react'
import { FileText, ArrowLeft, Smartphone, BookOpen, Video } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  useWizardStore,
  useSelectedTrend,
  useSelectedAngle,
  MOCK_SCRIPTS,
  type Script,
} from '@/store/useWizardStore'

// ============================================
// Script Card Component
// ============================================

interface ScriptCardProps {
  script: Script
  onSelect: (script: Script) => void
  delay?: number
}

function ScriptCard({ script, onSelect, delay = 0 }: ScriptCardProps) {
  const channelConfig: Record<string, { icon: React.ReactNode; gradient: string; bgColor: string }> = {
    '朋友圈海报': {
      icon: <Smartphone className="w-5 h-5" />,
      gradient: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
    },
    '小红书种草': {
      icon: <BookOpen className="w-5 h-5" />,
      gradient: 'from-red-500 to-pink-500',
      bgColor: 'bg-red-50',
    },
    '短视频分镜': {
      icon: <Video className="w-5 h-5" />,
      gradient: 'from-violet-500 to-purple-500',
      bgColor: 'bg-violet-50',
    },
  }

  const config = channelConfig[script.channel] || {
    icon: <FileText className="w-5 h-5" />,
    gradient: 'from-gray-500 to-slate-500',
    bgColor: 'bg-gray-50',
  }

  return (
    <button
      onClick={() => onSelect(script)}
      className={cn(
        "group relative w-full h-full text-left flex flex-col rounded-2xl border-2 border-transparent overflow-hidden",
        "bg-white/80 backdrop-blur-sm shadow-sm",
        "transition-all duration-300 ease-out",
        "hover:border-violet-300 hover:bg-white hover:shadow-xl hover:shadow-violet-500/15",
        "hover:-translate-y-1",
        "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2",
        "animate-slide-up"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Header */}
      <div className={cn("px-5 py-4 border-b border-gray-100", config.bgColor)}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center text-white",
            `bg-gradient-to-br ${config.gradient}`
          )}>
            {config.icon}
          </div>
          <div>
            <div className="text-xs text-onion-muted mb-0.5">{script.channel}</div>
            <h3 className="font-bold text-onion-text group-hover:text-violet-700 transition-colors">
              {script.title}
            </h3>
          </div>
        </div>
      </div>

      {/* Content Preview */}
      <div className="flex-1 p-5">
        <ScrollArea className="h-48">
          <pre className="text-xs text-onion-muted whitespace-pre-wrap font-sans leading-relaxed">
            {script.content}
          </pre>
        </ScrollArea>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between">
          <span className="text-xs text-onion-muted">点击选择此文案</span>
          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity">
            →
          </div>
        </div>
      </div>
    </button>
  )
}

// ============================================
// Main Script Selection Component
// ============================================

export function ScriptSelection() {
  const selectScript = useWizardStore((state) => state.selectScript)
  const goBack = useWizardStore((state) => state.goBack)
  const selectedTrend = useSelectedTrend()
  const selectedAngle = useSelectedAngle()

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Back Button */}
      <button
        onClick={goBack}
        className="group flex items-center gap-2 text-onion-muted hover:text-violet-600 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">返回角度选择</span>
      </button>

      {/* Page Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 text-violet-700 text-sm font-medium mb-4">
          <FileText className="w-4 h-4" />
          脚本生成 · Step 2
        </div>
        <h1 className="text-3xl font-bold gradient-text mb-3 font-display">
          选择文案渠道
        </h1>
        <p className="text-onion-muted max-w-lg mx-auto mb-6">
          AI 已生成 3 种不同渠道的文案风格，选择最适合的投放渠道
        </p>

        {/* Context Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 px-4">
          {selectedTrend && (
            <div className="inline-flex items-start gap-2 px-3 py-1.5 rounded-lg bg-white/60 border border-violet-200 text-xs max-w-full sm:max-w-md h-auto">
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
        </div>
      </div>

      {/* Script Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MOCK_SCRIPTS.map((script, index) => (
          <ScriptCard
            key={script.id}
            script={script}
            onSelect={selectScript}
            delay={index * 150}
          />
        ))}
      </div>
    </div>
  )
}
