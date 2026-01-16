'use client'

import React, { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, Sparkles, Download, Loader2, Image as ImageIcon, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWizardStore, useGeneratedImage } from '@/store/useWizardStore'

// ============================================
// 比例选项配置 (8种SDXL推荐比例)
// ============================================

const ASPECT_RATIOS = [
  {
    id: '21:9',
    label: '21:9',
    description: '超宽屏',
    icon: '🖼️',
    example: '1792x768 | 电影级宽幅'
  },
  {
    id: '16:9',
    label: '16:9',
    description: '横屏',
    icon: '🖥️',
    example: '1792x1024 | B站封面'
  },
  {
    id: '3:2',
    label: '3:2',
    description: '相机比例',
    icon: '📷',
    example: '1536x1024 | 摄影作品'
  },
  {
    id: '4:3',
    label: '4:3',
    description: '传统屏幕',
    icon: '🖼️',
    example: '1280x960 | 经典比例'
  },
  {
    id: '1:1',
    label: '1:1',
    description: '正方形',
    icon: '⬛',
    example: '1024x1024 | 头像/朋友圈'
  },
  {
    id: '3:4',
    label: '3:4',
    description: '竖屏',
    icon: '📱',
    example: '960x1280 | 手机屏幕',
    isDefault: true
  },
  {
    id: '2:3',
    label: '2:3',
    description: '竖屏长图',
    icon: '📄',
    example: '1024x1536 | 海报'
  },
  {
    id: '9:16',
    label: '9:16',
    description: '手机全屏',
    icon: '📲',
    example: '1024x1792 | 抖音/小红书'
  }
]

// ============================================
// 比例选择卡片组件
// ============================================

interface AspectRatioCardProps {
  ratio: typeof ASPECT_RATIOS[0]
  isSelected: boolean
  onClick: () => void
}

function AspectRatioCard({ ratio, isSelected, onClick }: AspectRatioCardProps) {
  return (
    <button
      onClick={onClick}
      style={isSelected ? { backgroundColor: 'rgba(34, 149, 254, 1)' } : undefined}
      className={cn(
        "relative p-4 rounded-xl border-2 transition-all duration-200 text-left",
        "hover:shadow-md hover:-translate-y-0.5",
        isSelected
          ? "border-onion-blue-600 text-white shadow-lg shadow-onion-blue-500/25"
          : "border-gray-300 bg-white hover:border-onion-blue-400"
      )}
    >
      {/* 选中标记 */}
      {isSelected && (
        <div className="absolute top-2 right-2">
          <CheckCircle2 className="w-5 h-5 text-white drop-shadow-lg" />
        </div>
      )}

      {/* 图标 */}
      <div className={cn(
        "text-3xl mb-2",
        isSelected && "drop-shadow-lg"
      )}>
        {ratio.icon}
      </div>

      {/* 标签 */}
      <div className={cn(
        "font-extrabold text-lg mb-1",
        isSelected ? "text-white drop-shadow-md" : "text-foreground"
      )}>
        {ratio.label}
      </div>
      <div className={cn(
        "text-sm font-bold mb-1",
        isSelected ? "text-white drop-shadow-md" : "text-onion-blue-600"
      )}>
        {ratio.description}
      </div>
      <div className={cn(
        "text-xs font-medium",
        isSelected ? "text-white/90 drop-shadow-sm" : "text-muted-foreground"
      )}>
        {ratio.example}
      </div>

      {/* 推荐标签 */}
      {ratio.isDefault && !isSelected && (
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-onion-blue-100 text-onion-blue-600 text-xs font-bold rounded-full">
          推荐
        </div>
      )}
    </button>
  )
}

// ============================================
// 加载动画组件
// ============================================

function LoadingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      {/* 狗蛋动画 */}
      <div className="relative mb-8">
        <div className="text-8xl animate-bounce-soft">
          🧅
        </div>
        {/* 魔法粒子效果 */}
        <div className="absolute -top-4 -right-4 text-3xl animate-spin-slow">✨</div>
        <div className="absolute -bottom-4 -left-4 text-2xl animate-pulse-soft">🎨</div>
        <div className="absolute top-0 -left-8 text-2xl animate-bounce-soft" style={{ animationDelay: '0.2s' }}>💫</div>
        <div className="absolute -top-2 right-8 text-xl animate-pulse-soft" style={{ animationDelay: '0.4s' }}>⭐</div>
      </div>

      {/* 加载文案 */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-foreground mb-2">
          正在召唤画师狗蛋...
        </h3>
        <p className="text-sm text-muted-foreground">
          即梦 AI 正在为您生成精美海报，预计需要 5-10 秒
        </p>
      </div>

      {/* 进度条 */}
      <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-onion-blue-500 to-onion-blue-500 animate-loading-bar" />
      </div>
    </div>
  )
}

// ============================================
// 主页面组件内容
// ============================================

function VisualGenerationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const title = searchParams.get('title') || ''
  const content = searchParams.get('content') || ''
  const angle = searchParams.get('angle') || ''
  const platform = searchParams.get('platform') || ''

  // ========== 从 Store 获取缓存数据 ==========
  const cachedImage = useGeneratedImage()
  const setGeneratedImageToStore = useWizardStore((state) => state.setGeneratedImage)

  const [selectedRatio, setSelectedRatio] = useState(cachedImage.aspectRatio || '3:4')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(cachedImage.imageUrl)
  const [error, setError] = useState<string | null>(null)

  // ========== 监听缓存变化，自动恢复状态 ==========
  useEffect(() => {
    if (cachedImage.imageUrl) {
      console.log('✅ 发现缓存图片，自动加载:', cachedImage.imageUrl.substring(0, 50) + '...')
      setGeneratedImage(cachedImage.imageUrl)
      if (cachedImage.aspectRatio) {
        setSelectedRatio(cachedImage.aspectRatio)
      }
    }
  }, [])

  // 生成图片
  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)
    setGeneratedImage(null)

    try {
      console.log('📡 发起图片生成请求:', {
        title,
        content: content.substring(0, 50) + '...',
        platform,
        aspectRatio: selectedRatio
      })

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          platform,
          aspectRatio: selectedRatio
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      if (!data.imageUrl) {
        throw new Error('API 未返回图片 URL')
      }

      console.log('✅ 图片生成成功:', data.imageUrl)
      setGeneratedImage(data.imageUrl)
      
      // ✅ 保存到 Store（缓存）
      setGeneratedImageToStore(data.imageUrl, selectedRatio)

    } catch (err: any) {
      console.error('❌ 图片生成失败:', err)
      
      // 针对 API Key 错误给出友好提示
      let errorMessage = err.message || '生成失败，请稍后重试'
      if (errorMessage.toLowerCase().includes('api key') || 
          errorMessage.toLowerCase().includes('jimeng_api_key') ||
          errorMessage.toLowerCase().includes('unauthorized') ||
          errorMessage.toLowerCase().includes('401')) {
        errorMessage = '⚠️ API Key 未配置或无效\n\n请检查 .env.local 文件中的 JIMENG_API_KEY 配置，并重启服务'
      }
      
      setError(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  // 下载图片
  const handleDownload = async () => {
    if (!generatedImage) return

    try {
      const response = await fetch(generatedImage)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `洋葱热点海报-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('下载失败:', err)
      alert('下载失败，请右键图片另存为')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-onion-blue-50 via-white to-onion-blue-50">
      {/* 背景装饰 */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-bl from-onion-blue-200/30 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        {/* 返回按钮 */}
        <button
          onClick={() => router.back()}
          className="group flex items-center gap-2 text-muted-foreground hover:text-onion-blue-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">返回文案选择</span>
        </button>

        {/* 页面标题 */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-onion-blue-100 text-onion-blue-700 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            视觉生成 · Step 3
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-3 font-display">
            AI 视觉生成
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto mb-6">
            选择图片比例，让即梦 AI 为您的内容配上精美的视觉海报
          </p>

          {/* 上下文信息 */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {title && (
              <div className="inline-flex items-start gap-2 px-3 py-1.5 rounded-lg bg-white/60 border border-onion-blue-200 text-xs max-w-md">
                <span className="text-onion-blue-500 flex-shrink-0">📰</span>
                <span className="text-foreground whitespace-normal break-words text-left">
                  {title}
                </span>
              </div>
            )}
            {platform && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/60 border border-onion-blue-200 text-xs">
                <span className="text-onion-blue-500">📱</span>
                <span className="text-foreground">{platform}</span>
              </div>
            )}
          </div>
        </div>

        {/* 主内容区 */}
        <div className="max-w-3xl mx-auto">
          {/* 比例选择器 */}
          {!generatedImage && !isGenerating && (
            <div className="mb-8 animate-slide-up">
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-onion-blue-600" />
                选择图片比例
                <span className="text-xs font-normal text-muted-foreground ml-2">
                  (SDXL 推荐分辨率)
                </span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {ASPECT_RATIOS.map((ratio) => (
                  <AspectRatioCard
                    key={ratio.id}
                    ratio={ratio}
                    isSelected={selectedRatio === ratio.id}
                    onClick={() => setSelectedRatio(ratio.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 生成按钮 */}
          {!generatedImage && !isGenerating && (
            <div className="text-center mb-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <button
                onClick={handleGenerate}
                disabled={!title || !content}
                className={cn(
                  "flex items-center gap-3 px-10 py-5 rounded-2xl text-white font-bold text-lg mx-auto",
                  "bg-[rgba(34,149,254,1)]",
                  "shadow-xl shadow-onion-blue-500/25",
                  "hover:shadow-2xl hover:shadow-onion-blue-500/30 hover:-translate-y-1",
                  "transition-all duration-300",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                )}
              >
                <Sparkles className="w-6 h-6" />
                调用即梦生成海报
              </button>
              <p className="text-xs text-muted-foreground mt-3">
                点击后将调用即梦 AI 生成精美海报
              </p>
            </div>
          )}

          {/* 加载状态 */}
          {isGenerating && (
            <div className="bg-white/80 rounded-3xl p-8 border border-onion-blue-200 shadow-lg animate-fade-in">
              <LoadingAnimation />
            </div>
          )}

          {/* 错误提示 */}
          {error && !isGenerating && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center animate-fade-in">
              <div className="text-4xl mb-4">😢</div>
              <h3 className="font-bold text-red-800 mb-2">生成失败</h3>
              <pre className="text-sm text-red-600 mb-4 whitespace-pre-wrap font-sans max-w-md mx-auto text-left">
                {error}
              </pre>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleGenerate}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  重试
                </button>
                {error.includes('API Key') && (
                  <a
                    href="https://www.doubao.com/api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-2 bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm"
                  >
                    获取 API Key
                  </a>
                )}
              </div>
            </div>
          )}

          {/* 结果展示 */}
          {generatedImage && !isGenerating && (
            <div className="animate-fade-in">
              {/* 成功提示 */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm font-medium mb-3">
                  <CheckCircle2 className="w-4 h-4" />
                  生成成功
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  🎉 您的专属海报已生成！
                </h2>
                <p className="text-sm text-muted-foreground">
                  由即梦 4.0 AI 为您精心绘制
                </p>
              </div>

              {/* 图片展示 */}
              <div className="relative mb-6 rounded-3xl overflow-hidden shadow-2xl shadow-onion-blue-500/20 border-4 border-white bg-white">
                <img
                  src={generatedImage}
                  alt="生成的海报"
                  className="w-full h-auto"
                  style={{ maxHeight: '70vh', objectFit: 'contain' }}
                />
              </div>

              {/* 操作按钮 */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={handleDownload}
                  style={{ backgroundColor: 'rgba(44, 156, 252, 1)' }}
                  className={cn(
                    "flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-bold",
                    "bg-gradient-to-r from-onion-blue-600 to-onion-blue-600",
                    "shadow-xl shadow-onion-blue-500/25",
                    "hover:shadow-2xl hover:shadow-onion-blue-500/30 hover:-translate-y-0.5",
                    "transition-all duration-300"
                  )}
                >
                  <Download className="w-5 h-5" />
                  下载图片
                </button>

                <button
                  onClick={() => {
                    console.log('🔄 手动触发：重新生成图片')
                    setGeneratedImage(null)
                    setError(null)
                    // 清除缓存
                    setGeneratedImageToStore(null, null)
                  }}
                  className={cn(
                    "flex items-center gap-2 px-6 py-4 rounded-2xl font-medium",
                    "bg-white border-2 border-onion-blue-200 text-onion-blue-700",
                    "hover:border-onion-blue-400 hover:bg-onion-blue-50",
                    "transition-all duration-300"
                  )}
                >
                  <Sparkles className="w-5 h-5" />
                  重新生成
                </button>
              </div>

              {/* 提示信息 */}
              <div className="mt-6 text-center">
                <p className="text-xs text-muted-foreground">
                  💡 提示：如果图片未显示，请检查网络连接或稍后重试
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 底部提示 */}
        {!generatedImage && !isGenerating && (
          <div className="mt-12 text-center">
            <p className="text-xs text-muted-foreground">
              🎨 由即梦 4.0 AI 提供视觉生成服务 · 保持角色一致性的多图参考生成
            </p>
          </div>
        )}
      </div>

      {/* 自定义样式 */}
      <style jsx>{`
        @keyframes loading-bar {
          0% {
            width: 0%;
          }
          50% {
            width: 70%;
          }
          100% {
            width: 100%;
          }
        }

        @keyframes bounce-soft {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes pulse-soft {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-loading-bar {
          animation: loading-bar 8s ease-in-out infinite;
        }

        .animate-bounce-soft {
          animation: bounce-soft 2s ease-in-out infinite;
        }

        .animate-pulse-soft {
          animation: pulse-soft 2s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  )
}

// ============================================
// 导出页面（包裹 Suspense）
// ============================================

export default function VisualGenerationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-onion-blue-500 animate-spin" />
      </div>
    }>
      <VisualGenerationContent />
    </Suspense>
  )
}
