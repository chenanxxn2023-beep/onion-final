'use client'

import React, { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, AlertCircle, ArrowLeft, FileText, RefreshCw, Copy, CheckCircle2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useCachedFetch } from '@/hooks/useCachedFetch'
import { buildCacheKey, CacheType } from '@/lib/cache'

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
    color: 'text-onion-blue-700',
    bgColor: 'bg-onion-blue-100',
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
    <div className="h-full flex flex-col border-2 border-onion-blue-200 rounded-2xl shadow-lg overflow-hidden">
      {/* 头部：平台信息 + 复制按钮 */}
      <div className={cn(
        "flex items-center justify-between px-5 py-4 border-b",
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
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border-2",
              isRegenerating
                ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                : "bg-onion-blue-100 text-onion-blue-700 hover:bg-onion-blue-200 border-onion-blue-300 hover:border-onion-blue-400 shadow-sm hover:shadow-md"
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
              "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border-2",
              copied
                ? "bg-green-100 text-green-700 border-green-300 shadow-sm"
                : isRegenerating
                ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                : `${platform.bgColor} ${platform.color} hover:opacity-80 border-onion-blue-300 hover:border-onion-blue-400 shadow-sm hover:shadow-md`
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
      <div className="flex-1 p-5 bg-white">
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

  // ========== 🎯 使用新的缓存系统 ==========
  // 构建缓存 Key：基于 title 和 angle
  const cacheKey = buildCacheKey(CacheType.COPY, title, angle)

  // ✅ 使用 useCachedFetch Hook 自动处理缓存逻辑
  // 当 title 或 angle 变化时，Hook 会自动：
  // 1️⃣ 检查新组合的缓存
  // 2️⃣ 如果有缓存，直接使用（不显示 loading）
  // 3️⃣ 如果无缓存，才调用 API
  const { data: scripts, loading, error, refetch } = useCachedFetch<ScriptResponse['data']>({
    cacheKey,
    fetcher: async () => {
      if (!title || !angle) {
        throw new Error('缺少必要参数')
      }

      console.log('📡 [P3] 发起 DeepSeek 脚本生成请求:', { title, angle })

      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, angle }),
      })

      const data: ScriptResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      if (!data.success || !data.data?.scripts) {
        throw new Error('API 返回数据格式错误')
      }

      console.log('✅ [P3] DeepSeek 脚本生成成功')
      
      // 检查数据完整性
      if (data.meta?.completeness === 'partial') {
        console.warn(`⚠️ 部分平台生成失败: ${data.meta.error_count} 个`)
      }
      
      // 打印性能日志
      if (data.meta?.duration_ms) {
        console.log(`⚡️ 生成耗时: ${data.meta.duration_ms}ms`)
      }

      return data.data
    },
    autoFetch: true,  // 组件加载时自动执行
    onSuccess: (data) => {
      console.log('✅ [P3] 脚本生成完成，已缓存:', Object.keys(data.scripts).length, '个平台')
    },
    onError: (error) => {
      console.error('❌ [P3] 脚本生成失败:', error.message)
    }
  })

  const [activeTab, setActiveTab] = useState<string>('douyin')
  const [isPartial, setIsPartial] = useState(false)
  const [missingCount, setMissingCount] = useState(0)
  const [regeneratingPlatform, setRegeneratingPlatform] = useState<string | null>(null)

  // 手动重新生成全部平台（忽略缓存）
  const handleRegenerateAll = () => {
    console.log('🔄 [P3] 手动触发：重新生成全部文案（忽略缓存）')
    setIsPartial(false)
    setMissingCount(0)
    refetch(true)  // 参数 true 表示强制刷新
  }
  
  // 重新生成单个平台
  const handleRegeneratePlatform = async (platformKey: string) => {
    if (!title || !angle || !scripts) return

    setRegeneratingPlatform(platformKey)

    try {
      console.log('📡 [P3] 重新生成单个平台:', platformKey)

      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          title, 
          angle,
          platform: platformKey  // 传递平台参数
        }),
      })

      const data: ScriptResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      if (!data.success || !data.data?.scripts) {
        throw new Error('API 返回数据格式错误')
      }

      console.log('✅ [P3] 单平台重新生成成功:', platformKey)
      
      // 手动更新缓存：合并新数据
      const updatedScripts = {
        scripts: {
          ...scripts.scripts,
          [platformKey]: data.data.scripts[platformKey as keyof typeof data.data.scripts],
        }
      }
      
      // 直接设置到 localStorage 缓存
      const { setCache } = await import('@/lib/cache')
      setCache(cacheKey, updatedScripts)
      
      // 触发 refetch 以更新 UI
      refetch()

    } catch (err: any) {
      console.error('❌ [P3] 单平台重新生成失败:', err.message)
      // 不阻断用户，继续允许操作其他平台
    } finally {
      setRegeneratingPlatform(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-onion-blue-50 via-white to-onion-blue-50">
      {/* 背景装饰 */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-bl from-onion-blue-200/30 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        {/* 返回按钮 */}
        <button
          onClick={() => router.back()}
          className="group flex items-center gap-2 text-muted-foreground hover:text-onion-blue-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">返回角度选择</span>
        </button>

        {/* 页面标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-onion-blue-100 text-onion-blue-700 text-sm font-medium mb-4">
            <FileText className="w-4 h-4" />
            脚本生成 · Step 2
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-3 font-display">
            多平台文案生成
          </h1>

          {/* 上下文信息 */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            {title && (
              <div className="inline-flex items-start gap-2 px-3 py-1.5 rounded-lg bg-white/60 border border-onion-blue-200 text-xs max-w-md h-auto">
                <span className="text-onion-blue-500 flex-shrink-0">📰</span>
                <span className="text-foreground whitespace-normal break-words text-left">
                  {title}
                </span>
              </div>
            )}
            {angle && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/60 border border-onion-blue-200 text-xs">
                <span className="text-onion-blue-500">💡</span>
                <span className="text-foreground">{angle}</span>
              </div>
            )}
          </div>
        </div>

        {/* Loading 状态 */}
        {loading && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <Loader2 className="w-12 h-12 text-onion-blue-500 animate-spin mx-auto mb-4" />
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
                {error.message}
              </p>
              <button
                onClick={handleRegenerateAll}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-onion-blue-600 text-white hover:bg-onion-blue-700 transition-colors font-medium"
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
                  // 获取当前活动平台的脚本内容作为 content
                  const currentScript = scripts.scripts[activeTab as keyof typeof scripts.scripts]
                  const content = currentScript?.content || ''
                  
                  // 跳转到视觉生成页面，传递参数
                  router.push(`/visual-generation?title=${encodeURIComponent(title)}&content=${encodeURIComponent(content)}&angle=${encodeURIComponent(angle)}&platform=${encodeURIComponent(PLATFORM_CONFIG[activeTab as keyof typeof PLATFORM_CONFIG].name)}`)
                }}
                className={cn(
                  "flex items-center gap-2 px-6 py-4 rounded-2xl font-medium transition-all duration-300",
                  "bg-[#2295FE] border-2 border-[#2295FE] text-white hover:border-[#1a85ed] hover:bg-[#1a85ed] shadow-md hover:shadow-lg"
                )}
              >
                继续下一步
                <span className="text-xl">→</span>
              </button>

              <button
                onClick={handleRegenerateAll}
                disabled={loading}
                className={cn(
                  "flex items-center gap-2 px-6 py-4 rounded-2xl font-medium transition-all duration-300",
                  loading
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-200"
                    : "bg-[#2295FE] border-2 border-[#2295FE] text-white hover:border-[#1a85ed] hover:bg-[#1a85ed] shadow-md hover:shadow-lg"
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
        <Loader2 className="w-8 h-8 text-onion-blue-500 animate-spin" />
      </div>
    }>
      <ScriptResultContent />
    </Suspense>
  )
}
