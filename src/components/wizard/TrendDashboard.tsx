'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Calendar, ExternalLink, TrendingUp, RefreshCw, AlertCircle, Loader2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  useWizardStore,
  type Trend,
} from '@/store/useWizardStore'

// ============================================
// 数据源配置
// ============================================

const REAL_API_URL = 'https://raw.githubusercontent.com/chenanxxn2023-beep/TrendRadar-Deploy/refs/heads/master/output/daily_hot_news.json'

// 平台显示信息映射
const PLATFORM_INFO: Record<string, { name: string; emoji: string; color: string; bgColor: string }> = {
  baidu: { name: '百度', emoji: '🔵', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  weibo: { name: '微博', emoji: '🔴', color: 'text-red-600', bgColor: 'bg-red-50' },
  zhihu: { name: '知乎', emoji: '🟢', color: 'text-green-600', bgColor: 'bg-green-50' },
  toutiao: { name: '头条', emoji: '🔶', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  douyin: { name: '抖音', emoji: '⚫', color: 'text-gray-900', bgColor: 'bg-gray-50' },
  bilibili: { name: 'B站', emoji: '🩷', color: 'text-pink-600', bgColor: 'bg-pink-50' },
  'bilibili-hot-search': { name: 'B站', emoji: '🩷', color: 'text-pink-600', bgColor: 'bg-pink-50' },
  tieba: { name: '贴吧', emoji: '🔷', color: 'text-blue-500', bgColor: 'bg-blue-50' },
  thepaper: { name: '澎湃', emoji: '📰', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  ifeng: { name: '凤凰', emoji: '🦅', color: 'text-rose-600', bgColor: 'bg-rose-50' },
  zaobao: { name: '早报', emoji: '📄', color: 'text-teal-600', bgColor: 'bg-teal-50' },
  cankaoxiaoxi: { name: '参考', emoji: '📋', color: 'text-slate-600', bgColor: 'bg-slate-50' },
  chongbuluo: { name: '虫部落', emoji: '🐛', color: 'text-lime-600', bgColor: 'bg-lime-50' },
}

// K12 教育关键词
const K12_KEYWORDS = [
  '教育', '考试', '清华', '北大', '小学', '初中', '高中', '大学',
  '数学', '英语', '物理', '化学', '生物', '语文', '历史', '地理',
  '假期', '学习', '家长', '孩子', '学生', '老师', '学校',
  '中考', '高考', '升学', '作业', '补习', '课程', '教材',
]

// ============================================
// 辅助函数
// ============================================

function getPlatformInfo(platformId: string) {
  return PLATFORM_INFO[platformId] || {
    name: platformId,
    emoji: '⚪',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  }
}

function checkK12Related(title: string): boolean {
  return K12_KEYWORDS.some(keyword => title.includes(keyword))
}

function formatTime(timeStr: string): string {
  try {
    // 尝试多种时间格式
    if (timeStr.includes('T')) {
      // ISO format: 2026-01-14T14:28:34
      const date = new Date(timeStr)
      return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    } else if (timeStr.includes('-')) {
      // Format: 14-28
      return timeStr
    } else {
      return timeStr
    }
  } catch {
    return timeStr
  }
}

// ============================================
// Trend Card Component
// ============================================

interface TrendCardProps {
  trend: Trend
  onSelect: (trend: Trend) => void
  delay?: number
}

function TrendCard({ trend, onSelect, delay = 0 }: TrendCardProps) {
  const router = useRouter()
  const platformInfo = getPlatformInfo(trend.source)
  
  const truncateUrl = (url: string) => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch {
      return url.slice(0, 30) + '...'
    }
  }

  return (
    <div
      className={cn(
        "group w-full rounded-2xl border-2 border-onion-blue-200 overflow-hidden",
        "bg-white/70 backdrop-blur-sm shadow-sm",
        "transition-all duration-300 ease-out",
        "hover:border-onion-blue-400 hover:bg-white hover:shadow-lg hover:shadow-onion-blue-500/10",
        "animate-slide-up",
        "flex items-stretch"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* 👈 左侧：阅读区 (Flex-1) */}
      <a
        href={trend.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 p-5 min-w-0 hover:bg-gray-50/50 transition-colors"
      >
        {/* Header: Source Badge + K12 Tag + Rank */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {/* Source Badge */}
          <span className={cn(
            "text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1",
            platformInfo.bgColor, platformInfo.color
          )}>
            <span>{platformInfo.emoji}</span>
            {platformInfo.name}
          </span>
          
          {/* K12 Badge */}
          {trend.is_k12_related && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gradient-to-r from-onion-blue-100 to-onion-blue-200 text-onion-blue-700">
              教育相关
            </span>
          )}
          
          {/* Rank Badge */}
          {trend.hot_score && trend.hot_score <= 10 && (
            <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-gradient-to-r from-orange-400 to-red-400 text-white">
              TOP {trend.hot_score}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-foreground leading-relaxed mb-3 group-hover:text-onion-blue-700 transition-colors line-clamp-2">
          {trend.title}
        </h3>

        {/* Footer: Source Link + Time */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-sm text-blue-500 group-hover:text-blue-600 transition-colors min-w-0 flex-1">
            <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{truncateUrl(trend.url)}</span>
          </div>
          
          {trend.category && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {trend.category}
            </span>
          )}
        </div>
      </a>

      {/* 👉 右侧：AI 分析功能区 (固定宽度) */}
      <button
        onClick={() => {
          // 跳转到 AI 分析页面，传递标题参数
          router.push(`/select-angle?title=${encodeURIComponent(trend.title)}`)
        }}
        style={{ backgroundColor: 'rgba(32, 178, 255, 0.8)' }}
        className={cn(
          "w-20 shrink-0 flex flex-col items-center justify-center gap-2",
          "border-l-2 border-onion-blue-200",
          "hover:opacity-90",
          "transition-all duration-300",
          "group/ai"
        )}
      >
        {/* AI 分析图标 */}
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md group-hover/ai:shadow-lg group-hover/ai:scale-110 transition-all">
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="#0062cc"
              strokeWidth="2"
              strokeLinecap="round" 
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          {/* 闪烁效果 */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse shadow-sm" />
        </div>
        
        {/* 文字标签 */}
        <span className="text-xs font-bold text-onion-blue-700 group-hover/ai:text-onion-blue-900 transition-colors">
          AI 分析
        </span>
      </button>
    </div>
  )
}

// ============================================
// Loading State Component
// ============================================

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Loader2 className="w-10 h-10 text-onion-blue-500 animate-spin mb-4" />
      <p className="text-muted-foreground font-medium">正在获取最新教育资讯...</p>
      <p className="text-sm text-muted-foreground mt-1">
        连接百度、微博、知乎、头条、B站等12个平台...
      </p>
    </div>
  )
}

// ============================================
// Error State Component
// ============================================

interface ErrorStateProps {
  error: string
  onRetry: () => void
}

function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
      <p className="text-foreground font-medium mb-2">无法获取热搜数据</p>
      <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
        {error}
      </p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-6 py-2 rounded-lg bg-onion-blue-600 text-white hover:bg-onion-blue-700 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        重试
      </button>
    </div>
  )
}

// ============================================
// Main Dashboard Component
// ============================================

export function TrendDashboard() {
  // Store
  const selectTrend = useWizardStore((state) => state.selectTrend)
  
  // Local state
  const [trends, setTrends] = useState<Trend[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'k12'>('k12') // 默认显示教育相关
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showToast, setShowToast] = useState(false)

  // Fetch real data
  const fetchRealData = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }
    setError(null)
    
    try {
      console.log('🔄 Fetching real trends from GitHub...')
      
      // 添加精确时间戳避免缓存
      const timestamp = new Date().getTime()
      const url = `${REAL_API_URL}?timestamp=${timestamp}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-store',
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // 解析数据结构
      const newsItems = data.news_items || []
      const platforms = data.platforms || []
      
      // 创建平台映射
      const platformMap = new Map()
      platforms.forEach((p: any) => {
        platformMap.set(p.id, p.name)
      })
      
      // 转换为 Trend 格式
      const formattedTrends: Trend[] = newsItems.map((item: any) => {
        const platformId = item.platform_id || 'unknown'
        const title = item.title || ''
        const url = item.url || ''
        const rank = item.rank || 999
        const timeStr = item.updated_at || item.created_at || item.last_crawl_time || ''
        
        return {
          id: `${platformId}_${item.id || Math.random()}`,
          title,
          url,
          source: platformId,
          category: formatTime(timeStr),
          hot_score: rank,
          is_k12_related: checkK12Related(title),
        }
      })
      
      // 按 rank 排序（数字小的排前面）
      formattedTrends.sort((a, b) => (a.hot_score || 999) - (b.hot_score || 999))
      
      console.log(`✅ Successfully fetched ${formattedTrends.length} real trends`)
      
      setTrends(formattedTrends)
      setLastUpdateTime(new Date().toLocaleString('zh-CN'))
      setIsLoading(false)
      setIsRefreshing(false)
      
      // 显示 Toast 提示（仅手动刷新时）
      if (isManualRefresh) {
        setShowToast(true)
        setTimeout(() => setShowToast(false), 3000)
      }
      
    } catch (err) {
      console.error('❌ Failed to fetch real data:', err)
      setError(err instanceof Error ? err.message : '网络请求失败')
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }
  
  // 手动刷新
  const handleRefresh = () => {
    fetchRealData(true)
  }

  // Fetch on mount
  useEffect(() => {
    fetchRealData()
  }, [])

  // Filter trends
  const allTrends = trends
  const k12Trends = trends.filter(t => t.is_k12_related)
  
  // Group by source for display
  const trendsBySource = trends.reduce((acc, trend) => {
    const source = trend.source
    if (!acc[source]) {
      acc[source] = []
    }
    acc[source].push(trend)
    return acc
  }, {} as Record<string, Trend[]>)

  // Render loading state
  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-onion-blue-100 text-onion-blue-700 text-sm font-medium mb-4">
            <TrendingUp className="w-4 h-4" />
            热点雷达 · Trend Radar
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-3 font-display">
            发现今日灵感
          </h1>
        </div>
        <LoadingState />
      </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-onion-blue-100 text-onion-blue-700 text-sm font-medium mb-4">
            <TrendingUp className="w-4 h-4" />
            热点雷达 · Trend Radar
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-3 font-display">
            发现今日灵感
          </h1>
        </div>
        <ErrorState error={error} onRetry={fetchRealData} />
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="text-center mb-4 mt-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-onion-blue-100 text-onion-blue-700 text-sm font-medium mb-3">
          <TrendingUp className="w-4 h-4" />
          热点雷达 · Trend Radar
        </div>
        <h1 className="text-3xl font-bold gradient-text mb-2 font-display">
          发现今日灵感
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto mb-4">
          实时聚合百度、微博、知乎、头条、B站等12个平台热搜
        </p>
        
        {/* Update Info */}
        {lastUpdateTime && (
          <p className="text-xs text-muted-foreground mb-2">
            最后更新: {lastUpdateTime}
          </p>
        )}
        
        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            isRefreshing 
              ? "bg-onion-blue-100 text-onion-blue-700 cursor-not-allowed"
              : "bg-white border border-onion-blue-200 text-onion-blue-700 hover:bg-onion-blue-50 hover:border-onion-blue-300 hover:shadow-sm"
          )}
        >
          <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          {isRefreshing ? '更新中...' : '刷新热搜'}
        </button>
      </div>

      {/* Toast 提示 */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border-2 border-green-200 shadow-lg shadow-green-500/20">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-800">已同步最新资讯</span>
          </div>
        </div>
      )}

      {/* Tabs for K12 vs All（教育相关优先） */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'k12')} className="w-full">
        <TabsList className="w-full max-w-md mx-auto grid grid-cols-2 mb-4">
          <TabsTrigger value="k12" className="gap-2">
            <Calendar className="w-4 h-4" />
            教育相关 ({k12Trends.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            <Zap className="w-4 h-4" />
            全部热搜 ({allTrends.length})
          </TabsTrigger>
        </TabsList>

        {/* K12 Education Trends（默认显示） */}
        <TabsContent value="k12">
          <section className="animate-fade-in pt-2">
            <div className="mb-4 p-4 rounded-xl bg-onion-blue-50 border border-onion-blue-100">
              <p className="text-sm text-onion-blue-700">
                <strong>🎓 智能筛选</strong>：已自动识别包含教育关键词的热搜（教育、考试、学校、数学、高考等）
              </p>
            </div>
            
            <ScrollArea className="h-auto">
              <div className="grid gap-4">
                {k12Trends.length > 0 ? (
                  k12Trends.map((trend, index) => (
                    <TrendCard
                      key={trend.id}
                      trend={trend}
                      onSelect={selectTrend}
                      delay={index * 30}
                    />
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="text-lg mb-2">暂无教育相关热搜</p>
                    <p className="text-sm">切换到"全部热搜"查看更多内容</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </section>
        </TabsContent>

        {/* All Trends */}
        <TabsContent value="all">
          <section className="animate-fade-in pt-2">
            {/* Platform Pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(trendsBySource)
                .sort((a, b) => b[1].length - a[1].length)
                .slice(0, 8)
                .map(([source, items]) => {
                  const info = getPlatformInfo(source)
                  return (
                    <span 
                      key={source}
                      className={cn(
                        "text-xs px-3 py-1.5 rounded-full flex items-center gap-1",
                        info.bgColor, info.color
                      )}
                    >
                      {info.emoji} {info.name}: {items.length}
                    </span>
                  )
                })}
            </div>
            
            <ScrollArea className="h-auto">
              <div className="grid gap-4">
                {allTrends.slice(0, 50).map((trend, index) => (
                  <TrendCard
                    key={trend.id}
                    trend={trend}
                    onSelect={selectTrend}
                    delay={index * 30}
                  />
                ))}
              </div>
            </ScrollArea>
          </section>
        </TabsContent>
      </Tabs>

      {/* Data Source Info */}
      <div className="mt-8 text-center text-xs text-muted-foreground">
        <p>
          数据来源: 
          <a 
            href={REAL_API_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-onion-blue-600 hover:underline ml-1"
          >
            TrendRadar 多源聚合
          </a>
        </p>
      </div>
    </div>
  )
}
