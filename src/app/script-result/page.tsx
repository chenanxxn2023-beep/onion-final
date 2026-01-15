'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, AlertCircle, ArrowLeft, FileText, RefreshCw, Copy, CheckCircle2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

// ============================================
// 类型定义
// ============================================

interface PlatformScript {
  title: string
  content: string
}

interface ScriptResponse {
  success: boolean
  data?: {
    scripts: {
      douyin: PlatformScript
      bilibili: PlatformScript
      xiaohongshu: PlatformScript
      wechat: PlatformScript
      weibo: PlatformScript
    }
  }
  error?: string
  meta?: {
    title: string
    angle: string
    platform?: string | null
    mode?: 'single' | 'concurrent'
    model: string
    timestamp: string
    completeness?: 'full' | 'partial'
    error_count?: number
    success_count?: number
    duration_ms?: number
  }
}

// ============================================
// 平台配置
// ============================================

const PLATFORM_CONFIG = {
  douyin: {
    id: 'douyin',
    name: '抖快短视频',
    emoji: '📱',
    color: 'text-gray-900',
    bgColor: 'bg-gray-50',
    gradient: 'from-gray-700 to-black',
    description: '15-60秒短视频脚本',
  },
  bilibili: {
    id: 'bilibili',
    name: 'B站中长尾',
    emoji: '📺',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    gradient: 'from-pink-500 to-rose-500',
    description: '3-5分钟深度视频',
  },
  xiaohongshu: {
    id: 'xiaohongshu',
    name: '小红书',
    emoji: '📕',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    gradient: 'from-red-500 to-pink-500',
    description: '种草图文笔记',
  },
  wechat: {
    id: 'wechat',
    name: '公众号深度',
    emoji: '🟢',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    gradient: 'from-green-500 to-emerald-500',
    description: '深度图文文章',
  },
  weibo: {
    id: 'weibo',
    name: '微博',
    emoji: '📢',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    gradient: 'from-orange-500 to-red-500',
    description: '140字短评',
  },
}

// ============================================
// 骨架屏组件
// ============================================

function SkeletonScript() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-6 bg-gray-200 rounded w-3/4" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-4/6" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
      </div>
    </div>
  )
}

// ============================================
// 脚本卡片组件
// ============================================

interface ScriptCardProps {
  platformKey: keyof typeof PLATFORM_CONFIG
  script: PlatformScript
  onRegenerate: (platformKey: string) => void
  isRegenerating: boolean
}

function ScriptCard({ platformKey, script, onRegenerate, isRegenerating }: ScriptCardProps) {
  const platform = PLATFORM_CONFIG[platformKey]
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(script.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* 头部：平台信息 + 复制按钮 */}
      <div className={cn(
        "flex items-center justify-between px-5 py-4 rounded-t-2xl border-b",
        platform.bgColor
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md",
            `bg-gradient-to-br ${platform.gradient}`
          )}>
            <span className="text-lg">{platform.emoji}</span>
          </div>
          <div>
            <h3 className="font-bold text-foreground">{platform.name}</h3>
            <p className="text-xs text-muted-foreground">{platform.description}</p>
          </div>
        </div>

        {/* 操作按钮组 */}
        <div className="flex items-center gap-2">
          {/* 重新生成按钮 */}
          <button
            onClick={() => onRegenerate(platformKey)}
            disabled={isRegenerating}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              isRegenerating
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-violet-100 text-violet-700 hover:bg-violet-200"
            )}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isRegenerating && "animate-spin")} />
            {isRegenerating ? '生成中' : '重新生成'}
          </button>

          {/* 复制按钮 */}
          <button
            onClick={handleCopy}
            disabled={isRegenerating}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              copied
                ? "bg-green-100 text-green-700"
                : isRegenerating
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : `${platform.bgColor} ${platform.color} hover:opacity-80`
            )}
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                已复制
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                复制
              </>
            )}
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 p-5 bg-white rounded-b-2xl">
        <ScrollArea className="h-96">
          {/* 标题 */}
          {script.title && (
            <div className="mb-4 pb-4 border-b border-gray-100">
              <div className="text-xs text-muted-foreground mb-1">标题</div>
              <h4 className="text-base font-bold text-foreground leading-relaxed">
                {script.title}
              </h4>
            </div>
          )}

          {/* 正文 */}
          <div className="text-xs text-muted-foreground mb-2">正文内容</div>
          <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
            {script.content}
          </pre>
        </ScrollArea>
      </div>
    </div>
  )
}

// ============================================
// 主页面组件
// ============================================

function ScriptResultContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const title = searchParams.get('title') || ''
  const angle = searchParams.get('angle') || ''

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scripts, setScripts] = useState<ScriptResponse['data']>(null)
  const [activeTab, setActiveTab] = useState<string>('douyin')
  const [isPartial, setIsPartial] = useState(false)
  const [missingCount, setMissingCount] = useState(0)
  const [regeneratingPlatform, setRegeneratingPlatform] = useState<string | null>(null)

  // 生成脚本（支持全平台或单平台）
  const generateScripts = async (platform?: string) => {
    if (!title || !angle) {
      setError('缺少必要参数')
      setLoading(false)
      return
    }

    const isSinglePlatform = !!platform

    if (isSinglePlatform) {
      setRegeneratingPlatform(platform)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      console.log('📡 发起脚本生成请求:', { 
        title, 
        angle, 
        platform: platform || '全部' 
      })

      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          title, 
          angle,
          ...(platform && { platform }) // 只有单平台时才传递 platform 参数
        }),
      })

      const data: ScriptResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      if (!data.success || !data.data?.scripts) {
        throw new Error('API 返回数据格式错误')
      }

      console.log('✅ 脚本生成成功')
      
      // 如果是单平台重新生成，合并数据
      if (isSinglePlatform && scripts && platform) {
        setScripts({
          scripts: {
            ...scripts.scripts,
            [platform]: data.data!.scripts[platform as keyof typeof data.data.scripts],
          }
        })
      } else {
        // 全平台生成，直接替换
        setScripts(data.data)
      }
      
      // 检查数据完整性
      if (data.meta?.completeness === 'partial') {
        setIsPartial(true)
        setMissingCount(data.meta.error_count || 0)
        console.warn(`⚠️ 部分平台生成失败: ${data.meta.error_count} 个`)
      } else if (!isSinglePlatform) {
        // 只有全平台生成成功时才重置警告
        setIsPartial(false)
        setMissingCount(0)
      }
      
      // 打印性能日志
      if (data.meta?.duration_ms) {
        console.log(`⚡️ 生成耗时: ${data.meta.duration_ms}ms`)
      }

    } catch (err: any) {
      console.error('❌ 脚本生成失败:', err)
      if (!isSinglePlatform) {
        setError(err.message || '生成失败，请稍后重试')
      }
    } finally {
      setLoading(false)
      setRegeneratingPlatform(null)
    }
  }
  
  // 重新生成单个平台
  const handleRegeneratePlatform = (platformKey: string) => {
    generateScripts(platformKey)
  }

  // 页面加载时自动生成
  useEffect(() => {
    generateScripts()
  }, [title, angle])

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
      {/* 背景装饰 */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-bl from-violet-200/30 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        {/* 返回按钮 */}
        <button
          onClick={() => router.back()}
          className="group flex items-center gap-2 text-muted-foreground hover:text-violet-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">返回角度选择</span>
        </button>

        {/* 页面标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 text-violet-700 text-sm font-medium mb-4">
            <FileText className="w-4 h-4" />
            脚本生成 · Step 2
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-3 font-display">
            多平台文案生成
          </h1>

          {/* 上下文信息 */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            {title && (
              <div className="inline-flex items-start gap-2 px-3 py-1.5 rounded-lg bg-white/60 border border-violet-200 text-xs max-w-md h-auto">
                <span className="text-violet-500 flex-shrink-0">📰</span>
                <span className="text-foreground whitespace-normal break-words text-left">
                  {title}
                </span>
              </div>
            )}
            {angle && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/60 border border-violet-200 text-xs">
                <span className="text-violet-500">💡</span>
                <span className="text-foreground">{angle}</span>
              </div>
            )}
          </div>
        </div>

        {/* Loading 状态 */}
        {loading && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <Loader2 className="w-12 h-12 text-violet-500 animate-spin mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground">
                🤖 DeepSeek 正在为 5 个平台生成文案...
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                抖音、B站、小红书、公众号、微博
              </p>
            </div>

            {/* 骨架屏 */}
            <div className="bg-white/60 rounded-2xl p-6 border border-gray-200">
              <SkeletonScript />
            </div>
          </div>
        )}

        {/* Error 状态 */}
        {error && !loading && (
          <div className="max-w-2xl mx-auto">
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">生成失败</p>
              <p className="text-sm text-muted-foreground mb-6 text-center">
                {error}
              </p>
              <button
                onClick={generateScripts}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition-colors font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                重试
              </button>
            </div>
          </div>
        )}

        {/* Success 状态 - 显示文案 */}
        {!loading && !error && scripts && (
          <div className="max-w-6xl mx-auto">
            {/* 数据完整性提示 */}
            {isPartial && missingCount > 0 && (
              <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800">
                    部分平台生成失败
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    有 {missingCount} 个平台生成失败。可在对应平台的卡片上点击"重新生成"按钮重试。
                  </p>
                </div>
              </div>
            )}

            <p className="text-center text-muted-foreground mb-6">
              DeepSeek 已为你生成 5 个平台的差异化文案，点击 Tab 切换查看
            </p>

            {/* 平台 Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-5 mb-6 h-auto p-1.5">
                <TabsTrigger value="douyin" className="gap-1.5 py-3 flex-col h-auto">
                  <span className="text-base">{PLATFORM_CONFIG.douyin.emoji}</span>
                  <span className="text-xs">抖快短视频</span>
                </TabsTrigger>
                <TabsTrigger value="bilibili" className="gap-1.5 py-3 flex-col h-auto">
                  <span className="text-base">{PLATFORM_CONFIG.bilibili.emoji}</span>
                  <span className="text-xs">B站中长尾</span>
                </TabsTrigger>
                <TabsTrigger value="xiaohongshu" className="gap-1.5 py-3 flex-col h-auto">
                  <span className="text-base">{PLATFORM_CONFIG.xiaohongshu.emoji}</span>
                  <span className="text-xs">小红书</span>
                </TabsTrigger>
                <TabsTrigger value="wechat" className="gap-1.5 py-3 flex-col h-auto">
                  <span className="text-base">{PLATFORM_CONFIG.wechat.emoji}</span>
                  <span className="text-xs">公众号</span>
                </TabsTrigger>
                <TabsTrigger value="weibo" className="gap-1.5 py-3 flex-col h-auto">
                  <span className="text-base">{PLATFORM_CONFIG.weibo.emoji}</span>
                  <span className="text-xs">微博</span>
                </TabsTrigger>
              </TabsList>

              {/* 抖音短视频 */}
              <TabsContent value="douyin" className="mt-0">
                <div className="animate-fade-in">
                  <ScriptCard 
                    platformKey="douyin" 
                    script={scripts.scripts.douyin}
                    onRegenerate={handleRegeneratePlatform}
                    isRegenerating={regeneratingPlatform === 'douyin'}
                  />
                </div>
              </TabsContent>

              {/* B站中长视频 */}
              <TabsContent value="bilibili" className="mt-0">
                <div className="animate-fade-in">
                  <ScriptCard 
                    platformKey="bilibili" 
                    script={scripts.scripts.bilibili}
                    onRegenerate={handleRegeneratePlatform}
                    isRegenerating={regeneratingPlatform === 'bilibili'}
                  />
                </div>
              </TabsContent>

              {/* 小红书 */}
              <TabsContent value="xiaohongshu" className="mt-0">
                <div className="animate-fade-in">
                  <ScriptCard 
                    platformKey="xiaohongshu" 
                    script={scripts.scripts.xiaohongshu}
                    onRegenerate={handleRegeneratePlatform}
                    isRegenerating={regeneratingPlatform === 'xiaohongshu'}
                  />
                </div>
              </TabsContent>

              {/* 微信公众号 */}
              <TabsContent value="wechat" className="mt-0">
                <div className="animate-fade-in">
                  <ScriptCard 
                    platformKey="wechat" 
                    script={scripts.scripts.wechat}
                    onRegenerate={handleRegeneratePlatform}
                    isRegenerating={regeneratingPlatform === 'wechat'}
                  />
                </div>
              </TabsContent>

              {/* 微博 */}
              <TabsContent value="weibo" className="mt-0">
                <div className="animate-fade-in">
                  <ScriptCard 
                    platformKey="weibo" 
                    script={scripts.scripts.weibo}
                    onRegenerate={handleRegeneratePlatform}
                    isRegenerating={regeneratingPlatform === 'weibo'}
                  />
                </div>
              </TabsContent>
            </Tabs>

            {/* 底部操作区 */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => {
                  // TODO: 进入下一步（视觉生成）
                  alert('即将进入视觉生成环节...')
                }}
                className={cn(
                  "flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-bold",
                  "bg-gradient-to-r from-violet-600 to-purple-600",
                  "shadow-xl shadow-violet-500/25",
                  "hover:shadow-2xl hover:shadow-violet-500/30 hover:-translate-y-0.5",
                  "transition-all duration-300"
                )}
              >
                继续下一步
                <span className="text-xl">→</span>
              </button>

              <button
                onClick={() => generateScripts()}
                disabled={loading}
                className={cn(
                  "flex items-center gap-2 px-6 py-4 rounded-2xl font-medium transition-all duration-300",
                  loading
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white border-2 border-violet-200 text-violet-700 hover:border-violet-400 hover:bg-violet-50"
                )}
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                重新生成全部
              </button>
            </div>

            {/* 底部提示 */}
            <div className="mt-8 text-center">
              <p className="text-xs text-muted-foreground">
                💡 由 DeepSeek AI 提供多平台智能文案生成
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

export default function ScriptResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    }>
      <ScriptResultContent />
    </Suspense>
  )
}
