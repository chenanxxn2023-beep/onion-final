'use client'

import React from 'react'
import { Download, ArrowLeft, RefreshCw, Share2, CheckCircle2, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useWizardStore,
  useSelectedTrend,
  useSelectedAngle,
  useSelectedScript,
  useSelectedVisual,
} from '@/store/useWizardStore'

// ============================================
// Summary Card Component
// ============================================

interface SummaryItemProps {
  icon: string
  label: string
  value: string
  color: string
}

function SummaryItem({ icon, label, value, color }: SummaryItemProps) {
  return (
    <div className={cn(
      "flex items-start gap-3 p-4 rounded-xl border",
      color
    )}>
      <span className="text-2xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-onion-muted mb-1">{label}</div>
        <div className="text-sm font-medium text-onion-text truncate">{value}</div>
      </div>
    </div>
  )
}

// ============================================
// Main Export View Component
// ============================================

export function ExportView() {
  const goBack = useWizardStore((state) => state.goBack)
  const reset = useWizardStore((state) => state.reset)
  const selectedTrend = useSelectedTrend()
  const selectedAngle = useSelectedAngle()
  const selectedScript = useSelectedScript()
  const selectedVisual = useSelectedVisual()

  const [copied, setCopied] = React.useState(false)

  const handleCopyScript = () => {
    if (selectedScript) {
      navigator.clipboard.writeText(selectedScript.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Back Button */}
      <button
        onClick={goBack}
        className="group flex items-center gap-2 text-onion-muted hover:text-onion-blue-600 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">返回视觉选择</span>
      </button>

      {/* Page Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-onion-blue-500 to-onion-blue-500 text-white text-sm font-medium mb-4 shadow-lg shadow-onion-blue-500/25">
          <CheckCircle2 className="w-4 h-4" />
          品牌合成 · 完成
        </div>
        <h1 className="text-3xl font-bold gradient-text mb-3 font-display">
          内容生成完成！🎉
        </h1>
        <p className="text-onion-muted max-w-lg mx-auto">
          您的洋葱风格创意内容已准备就绪，可以导出使用了
        </p>
      </div>

      {/* Main Preview */}
      <div className="mb-8 rounded-3xl overflow-hidden shadow-2xl shadow-onion-blue-500/20 border-4 border-white animate-slide-up">
        {/* Visual Preview */}
        <div className={cn(
          "relative aspect-video bg-gradient-to-br from-onion-blue-400 via-onion-blue-400 to-pink-400",
        )}>
          {/* Mock Final Composition */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              {/* Onion Character */}
              <div className="text-8xl mb-4 animate-bounce-soft">🧅</div>
              
              {/* Title */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-8 py-4 shadow-xl max-w-md mx-4">
                <h2 className="text-lg font-bold text-onion-blue-700 mb-2">
                  {selectedTrend?.title.slice(0, 30)}...
                </h2>
                <div className="flex items-center justify-center gap-2 text-sm text-onion-muted">
                  <span className="px-2 py-0.5 bg-onion-blue-100 rounded-full text-onion-blue-600 text-xs font-medium">
                    {selectedAngle?.type}
                  </span>
                  <span className="px-2 py-0.5 bg-pink-100 rounded-full text-pink-600 text-xs font-medium">
                    {selectedScript?.channel}
                  </span>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute top-8 left-8 text-4xl animate-pulse-soft">✨</div>
              <div className="absolute top-12 right-12 text-3xl animate-bounce-soft">💡</div>
              <div className="absolute bottom-12 left-16 text-3xl animate-pulse-soft">📚</div>
              <div className="absolute bottom-8 right-8 text-4xl animate-bounce-soft">🎯</div>
            </div>
          </div>

          {/* Visual Style Badge */}
          {selectedVisual && (
            <div className="absolute top-4 left-4">
              <span className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-sm font-bold text-onion-blue-700 shadow-lg">
                {selectedVisual.style}
              </span>
            </div>
          )}

        </div>
      </div>

      {/* Selection Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
        <SummaryItem
          icon="📰"
          label="选中热点"
          value={selectedTrend?.title.slice(0, 20) + '...' || '-'}
          color="bg-orange-50 border-orange-200"
        />
        <SummaryItem
          icon={selectedAngle?.icon || '💡'}
          label="切入角度"
          value={selectedAngle?.type || '-'}
          color="bg-blue-50 border-blue-200"
        />
        <SummaryItem
          icon={selectedScript?.icon || '📝'}
          label="文案渠道"
          value={selectedScript?.channel || '-'}
          color="bg-pink-50 border-pink-200"
        />
        <SummaryItem
          icon="🎨"
          label="视觉风格"
          value={selectedVisual?.style || '-'}
          color="bg-onion-blue-50 border-onion-blue-200"
        />
      </div>

      {/* Script Preview & Copy */}
      {selectedScript && (
        <div className="mb-8 p-6 rounded-2xl bg-white/80 border border-onion-blue-200 shadow-sm animate-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-onion-text">📝 生成的文案</h3>
            <button
              onClick={handleCopyScript}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                copied
                  ? "bg-green-100 text-green-700"
                  : "bg-onion-blue-100 text-onion-blue-700 hover:bg-onion-blue-200"
              )}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  复制文案
                </>
              )}
            </button>
          </div>
          <pre className="text-sm text-onion-muted whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-auto">
            {selectedScript.content}
          </pre>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '400ms' }}>
        <button
          onClick={() => {
            // Mock download
            alert('🎉 图片已生成！\n\n（这是 Mock 演示，实际项目中会触发真实下载）')
          }}
          className={cn(
            "flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-bold",
            "bg-gradient-to-r from-onion-blue-600 to-onion-blue-600",
            "shadow-xl shadow-onion-blue-500/25",
            "hover:shadow-2xl hover:shadow-onion-blue-500/30 hover:-translate-y-0.5",
            "transition-all duration-300"
          )}
        >
          <Download className="w-5 h-5" />
          下载高清大图
        </button>

        <button
          onClick={() => {
            // Mock share
            alert('📤 分享功能已触发！\n\n（这是 Mock 演示）')
          }}
          className={cn(
            "flex items-center gap-3 px-6 py-4 rounded-2xl font-medium",
            "bg-white border-2 border-onion-blue-200 text-onion-blue-700",
            "hover:border-onion-blue-400 hover:bg-onion-blue-50",
            "transition-all duration-300"
          )}
        >
          <Share2 className="w-5 h-5" />
          分享到团队
        </button>

        <button
          onClick={reset}
          className={cn(
            "flex items-center gap-3 px-6 py-4 rounded-2xl font-medium",
            "bg-gray-100 text-onion-muted",
            "hover:bg-gray-200 hover:text-onion-text",
            "transition-all duration-300"
          )}
        >
          <RefreshCw className="w-5 h-5" />
          重新开始
        </button>
      </div>

      {/* Footer Tip */}
      <div className="mt-12 text-center">
        <p className="text-sm text-onion-muted">
          💜 由洋葱学园内容运营团队打造 · 让每一个热点都变成学习的契机
        </p>
      </div>
    </div>
  )
}
