'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, AlertCircle, ArrowLeft, Sparkles, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================
// 类型定义
// ============================================

interface Angle {
  title: string
  content: string
}

interface AnalysisResponse {
  success: boolean
  data?: {
    angles: Angle[]
  }
  error?: string
  meta?: {
    title: string
    model: string
    timestamp: string
  }
}

// ============================================
// 骨架屏组件
// ============================================

function SkeletonCard() {
  return (
    <div className="p-6 rounded-2xl border-2 border-gray-200 bg-white/50 animate-pulse">
      {/* 图标骨架 */}
      <div className="w-12 h-12 bg-gray-200 rounded-xl mb-4" />
      
      {/* 标题骨架 */}
      <div className="h-6 bg-gray-200 rounded w-2/3 mb-3" />
      
      {/* 内容骨架 */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-4/6" />
      </div>
    </div>
  )
}

// ============================================
// 分析卡片组件
// ============================================

interface AngleCardProps {
  angle: Angle
  index: number
  onSelect: () => void
}

function AngleCard({ angle, index, onSelect }: AngleCardProps) {
  const gradients = [
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-pink-500 to-rose-500',
  ]

  return (
    <button
      onClick={onSelect}
      className={cn(
        "group relative w-full text-left p-6 rounded-2xl border-2 border-transparent",
        "bg-white/80 backdrop-blur-sm shadow-sm",
        "transition-all duration-300 ease-out",
        "hover:border-violet-300 hover:bg-white hover:shadow-xl hover:shadow-violet-500/15",
        "hover:-translate-y-2 hover:scale-[1.02]",
        "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2",
        "animate-slide-up"
      )}
      style={{ animationDelay: `${index * 150}ms` }}
    >
      {/* 标题行：角度标签 + 标题 */}
      <div className="flex items-center gap-3 mb-4">
        {/* 类型标签 */}
        <div className={cn(
          "flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold text-white",
          `bg-gradient-to-r ${gradients[index] || 'from-violet-500 to-purple-500'}`
        )}>
          角度 {index + 1}
        </div>

        {/* 标题 */}
        <h3 className="text-xl font-bold text-foreground group-hover:text-violet-700 transition-colors flex-1">
          {angle.title}
        </h3>
      </div>

      {/* 内容 */}
      <p className="text-sm text-muted-foreground leading-relaxed">
        {angle.content}
      </p>

      {/* 渐变背景效果 */}
      <div className={cn(
        "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none",
        `bg-gradient-to-br ${gradients[index] || 'from-violet-500 to-purple-500'}`,
        "opacity-0 group-hover:opacity-[0.03]"
      )} />

      {/* 箭头指示器 */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
        <div className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center text-white shadow-lg">
          →
        </div>
      </div>
    </button>
  )
}

// ============================================
// 主页面组件（需要 Suspense 包裹）
// ============================================

function SelectAngleContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const title = searchParams.get('title') || ''

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [angles, setAngles] = useState<Angle[]>([])

  // 分析新闻
  const analyzeNews = async () => {
    if (!title) {
      setError('缺少新闻标题参数')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('📡 发起分析请求:', title)

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      })

      const data: AnalysisResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      if (!data.success || !data.data?.angles) {
        throw new Error('API 返回数据格式错误')
      }

      console.log('✅ 分析成功:', data.data.angles)
      setAngles(data.data.angles)
      
    } catch (err: any) {
      console.error('❌ 分析失败:', err)
      setError(err.message || '分析失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 页面加载时自动分析
  useEffect(() => {
    analyzeNews()
  }, [title])

  // 选择角度
  const handleSelectAngle = (angle: Angle) => {
    console.log('选择角度:', angle.title)
    // 跳转到脚本生成页面，传递标题和角度参数
    router.push(
      `/script-result?title=${encodeURIComponent(title)}&angle=${encodeURIComponent(angle.title)}`
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
      {/* 背景装饰 */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-bl from-violet-200/30 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-purple-200/20 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        {/* 返回按钮 */}
        <button
          onClick={() => router.back()}
          className="group flex items-center gap-2 text-muted-foreground hover:text-violet-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">返回热点列表</span>
        </button>

        {/* 页面标题 */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 text-violet-700 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            AI 智能分析 · Step 1
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-3 font-display">
            选择切入角度
          </h1>
          
          {/* 显示新闻标题 */}
          {title && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/60 border border-violet-200 text-sm max-w-2xl">
              <span className="text-violet-500">📰</span>
              <span className="text-foreground font-medium truncate">
                {title}
              </span>
            </div>
          )}
        </div>

        {/* Loading 状态 */}
        {loading && (
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <Loader2 className="w-12 h-12 text-violet-500 animate-spin mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground">
                🤖 正在 DeepSeek 大脑中分析事件
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                《{title.slice(0, 30)}...》
              </p>
            </div>

            {/* 骨架屏 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        )}

        {/* Error 状态 */}
        {error && !loading && (
          <div className="max-w-2xl mx-auto">
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">分析失败</p>
              <p className="text-sm text-muted-foreground mb-6 text-center">
                {error}
              </p>
              <button
                onClick={analyzeNews}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-colors font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                重试
              </button>
            </div>
          </div>
        )}

        {/* Success 状态 - 显示分析结果 */}
        {!loading && !error && angles.length > 0 && (
          <div className="max-w-5xl mx-auto">
            <p className="text-center text-muted-foreground mb-8">
              DeepSeek 已为你生成 3 个 K12 教育切入角度，点击选择最适合的方向
            </p>

            {/* 角度卡片网格 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {angles.map((angle, index) => (
                <AngleCard
                  key={index}
                  angle={angle}
                  index={index}
                  onSelect={() => handleSelectAngle(angle)}
                />
              ))}
            </div>

            {/* 底部提示 */}
            <div className="mt-8 text-center">
              <p className="text-xs text-muted-foreground">
                💡 由 DeepSeek AI 提供智能分析支持
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// 导出页面（包裹 Suspense）
// ============================================

export default function SelectAnglePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    }>
      <SelectAngleContent />
    </Suspense>
  )
}
