'use client'

import React, { useState, useEffect } from 'react'
import { Trash2, RefreshCw, Database, Clock, HardDrive, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  getCacheStats, 
  cleanExpiredCache, 
  cleanAllCache, 
  cleanCacheByType, 
  CacheType 
} from '@/lib/cache'

/**
 * 缓存管理组件
 * 用于开发调试和用户管理缓存
 */
export function CacheManager() {
  const [stats, setStats] = useState<ReturnType<typeof getCacheStats> | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  // 刷新统计数据
  const refreshStats = () => {
    const newStats = getCacheStats()
    setStats(newStats)
    console.log('📊 缓存统计:', newStats)
  }

  // 组件加载时获取统计
  useEffect(() => {
    refreshStats()
  }, [])

  // 清理过期缓存
  const handleCleanExpired = () => {
    cleanExpiredCache()
    refreshStats()
    alert('✅ 已清理过期缓存')
  }

  // 清理指定类型
  const handleCleanType = (type: CacheType) => {
    if (confirm(`确定要清理所有 "${type}" 类型的缓存吗？`)) {
      cleanCacheByType(type)
      refreshStats()
      alert(`✅ 已清理 ${type} 类型的缓存`)
    }
  }

  // 清理所有缓存
  const handleCleanAll = () => {
    if (confirm('⚠️ 确定要清理所有应用缓存吗？这将删除所有已生成的内容。')) {
      cleanAllCache()
      refreshStats()
      alert('✅ 已清理所有缓存')
    }
  }

  if (!isOpen) {
    // 折叠状态：只显示一个小按钮
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 w-12 h-12 rounded-full bg-onion-blue-600 text-white shadow-lg hover:bg-onion-blue-700 transition-colors flex items-center justify-center z-50"
        title="缓存管理"
      >
        <Database className="w-5 h-5" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-onion-blue-600 to-onion-blue-600 text-white px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          <h3 className="font-bold">缓存管理</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="w-6 h-6 rounded-full hover:bg-white/20 transition-colors flex items-center justify-center text-[#2295FE]"
        >
          ✕
        </button>
      </div>

      {/* 统计信息 */}
      {stats && (
        <div className="p-5 border-b border-gray-100">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <HardDrive className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                <div className="text-xs text-muted-foreground">缓存项</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Database className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{stats.totalSizeKB}</div>
                <div className="text-xs text-muted-foreground">KB</div>
              </div>
            </div>
          </div>

          {/* 过期提示 */}
          {stats.expiredCount > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p className="text-xs text-amber-800">
                检测到 {stats.expiredCount} 个过期缓存
              </p>
            </div>
          )}

          {/* 类型分布 */}
          <div className="mt-4 space-y-2">
            <div className="text-xs font-medium text-muted-foreground mb-2">类型分布</div>
            {Object.entries(stats.byType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between text-sm">
                <span className="text-foreground capitalize">{type}</span>
                <span className="text-muted-foreground">{count} 项</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="p-5 space-y-3">
        <button
          onClick={refreshStats}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-onion-blue-100 text-onion-blue-700 hover:bg-onion-blue-200 transition-colors text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          刷新统计
        </button>

        <button
          onClick={handleCleanExpired}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors text-sm font-medium"
        >
          <Clock className="w-4 h-4" />
          清理过期缓存
        </button>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleCleanType(CacheType.ANALYSIS)}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-xs"
          >
            <span>角度</span>
          </button>
          <button
            onClick={() => handleCleanType(CacheType.COPY)}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-xs"
          >
            <span>文案</span>
          </button>
          <button
            onClick={() => handleCleanType(CacheType.IMAGE)}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-xs"
          >
            <span>图片</span>
          </button>
        </div>

        <button
          onClick={handleCleanAll}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 transition-colors text-sm font-medium"
        >
          <Trash2 className="w-4 h-4" />
          清理所有缓存
        </button>
      </div>

      {/* 底部提示 */}
      <div className="px-5 pb-4">
        <p className="text-xs text-muted-foreground text-center">
          缓存有效期：24 小时
        </p>
      </div>
    </div>
  )
}
