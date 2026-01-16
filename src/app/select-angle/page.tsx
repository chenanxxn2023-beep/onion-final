'use client'

import React, { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, AlertCircle, ArrowLeft, Sparkles, RefreshCw, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCachedFetch } from '@/hooks/useCachedFetch'
import { buildCacheKey, CacheType } from '@/lib/cache'

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
        "group relative w-full text-left p-6 rounded-2xl border-2 border-onion-blue-200",
        "bg-white/80 backdrop-blur-sm shadow-sm",
        "transition-all duration-300 ease-out",
        "hover:border-onion-blue-400 hover:bg-white hover:shadow-xl hover:shadow-onion-blue-500/15",
        "focus:outline-none focus:ring-2 focus:ring-onion-blue-500 focus:ring-offset-2",
        "animate-slide-up"
      )}
      style={{ animationDelay: `${index * 150}ms` }}
    >
      {/* 标题行：角度标签 + 标题 */}
      <div className="flex items-center gap-3 mb-4">
        {/* 类型标签 */}
        <div className={cn(
          "flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold text-white",
          `bg-gradient-to-r ${gradients[index] || 'from-onion-blue-500 to-onion-blue-500'}`
        )}>
          角度 {index + 1}
        </div>

        {/* 标题 */}
        <h3 className="text-xl font-bold text-foreground group-hover:text-onion-blue-700 transition-colors flex-1">
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
        `bg-gradient-to-br ${gradients[index] || 'from-onion-blue-500 to-onion-blue-500'}`,
        "opacity-0 group-hover:opacity-[0.03]"
      )} />

      {/* 箭头指示器 */}
      <div className="absolute bottom-4 right-4 opacity-50 group-hover:opacity-100 transition-all transform group-hover:scale-110">
        <div className="w-12 h-12 rounded-full bg-white border-2 border-onion-blue-500 flex items-center justify-center text-onion-blue-600 shadow-xl">
          <ArrowRight className="w-6 h-6" strokeWidth={3} />
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

  // ========== 🎯 使用新的缓存系统 ==========
  // 构建缓存 Key：基于 title（作为 topicId）
  const cacheKey = buildCacheKey(CacheType.ANALYSIS, title)

  // ✅ 使用 useCachedFetch Hook 自动处理缓存逻辑
  // 当 title 变化时（切换热点），Hook 会自动：
  // 1️⃣ 检查新 title 的缓存
  // 2️⃣ 如果有缓存，直接使用（不显示 loading）
  // 3️⃣ 如果无缓存，才调用 API
  const { data: angles, loading, error, refetch } = useCachedFetch<Angle[]>({
    cacheKey,
    fetcher: async () => {
      if (!title) {
        throw new Error('缺少新闻标题参数')
      }

      console.log('📡 [P2] 发起 DeepSeek 分析请求:', { title })

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

      console.log('✅ [P2] DeepSeek 分析成功:', data.data.angles)
      return data.data.angles
    },
    autoFetch: true,  // 组件加载时自动执行
    onSuccess: (data) => {
      console.log('✅ [P2] 角度分析完成，已缓存:', data.length, '个角度')
    },
    onError: (error) => {
      console.error('❌ [P2] 角度分析失败:', error.message)
    }
  })

  // 选择角度
  const handleSelectAngle = (angle: Angle) => {
    console.log('✅ [P2] 选择角度:', angle.title)
    // 跳转到脚本生成页面，传递标题和角度参数
    router.push(
      `/script-result?title=${encodeURIComponent(title)}&angle=${encodeURIComponent(angle.title)}`
    )
  }

  // 手动重新分析（忽略缓存）
  const handleRegenerate = () => {
    console.log('🔄 [P2] 手动触发：重新分析角度（忽略缓存）')
    refetch(true)  // 参数 true 表示强制刷新
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-onion-blue-50 via-white to-onion-blue-50">
      {/* 背景装饰 */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-bl from-onion-blue-200/30 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-onion-blue-200/20 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        {/* 返回按钮 */}
        <button
          onClick={() => router.back()}
          className="group flex items-center gap-2 text-muted-foreground hover:text-onion-blue-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">返回热点列表</span>
        </button>

        {/* 页面标题 */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-onion-blue-100 text-onion-blue-700 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            AI 智能分析 · Step 1
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-3 font-display">
            选择切入角度
          </h1>
          
          {/* 显示新闻标题 */}
          {title && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/60 border border-onion-blue-200 text-sm max-w-2xl">
              <span className="text-onion-blue-500">📰</span>
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
              <Loader2 className="w-12 h-12 text-onion-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground">
                正在 DeepSeek 大脑中分析事件
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
                {error.message}
              </p>
              <button
                onClick={handleRegenerate}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-onion-blue-600 text-white hover:bg-onion-blue-700 transition-colors font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                重试
              </button>
            </div>
          </div>
        )}

        {/* Success 状态 - 显示分析结果 */}
        {!loading && !error && angles && angles.length > 0 && (
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-8 border-2 border-onion-blue-200 rounded-lg py-2 px-4 bg-white/50">
              <p className="text-center text-muted-foreground text-sm">
                DeepSeek 已为你生成 3 个 K12 教育切入角度，点击选择最适合的方向
              </p>
              <button
                onClick={handleRegenerate}
                disabled={loading}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 shadow-sm",
                  loading
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-[#2295FE] text-white hover:bg-[#1a85ed] hover:shadow-md"
                )}
              >
                <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                重新分析
              </button>
            </div>

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
        <Loader2 className="w-8 h-8 text-onion-blue-500 animate-spin" />
      </div>
    }>
      <SelectAngleContent />
    </Suspense>
  )
}
