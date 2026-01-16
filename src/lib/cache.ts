/**
 * 缓存管理工具库
 * 支持 TTL（24小时）和 localStorage 持久化
 */

// ============================================
// 类型定义
// ============================================

export interface CacheItem<T> {
  data: T
  timestamp: number  // 存入时间（毫秒）
}

export interface CacheOptions {
  ttl?: number  // 过期时间（毫秒），默认 24 小时
  forceRefresh?: boolean  // 是否强制刷新（忽略缓存）
}

// ============================================
// 常量配置
// ============================================

// 默认 TTL: 24 小时
export const DEFAULT_TTL = 24 * 60 * 60 * 1000

// 缓存 Key 前缀
export const CACHE_PREFIX = 'onion_cache_'

// 缓存类型
export enum CacheType {
  ANALYSIS = 'analysis',      // P2: 角度分析
  COPY = 'copy',              // P3: 文案生成
  IMAGE = 'image',            // P4: 图片生成
}

// ============================================
// 核心缓存函数
// ============================================

/**
 * 构建缓存 Key
 */
export function buildCacheKey(type: CacheType, ...params: string[]): string {
  const cleanParams = params.filter(Boolean).join('_')
  return `${CACHE_PREFIX}${type}_${cleanParams}`
}

/**
 * 检查缓存是否过期
 */
export function isCacheExpired(timestamp: number, ttl: number = DEFAULT_TTL): boolean {
  return Date.now() - timestamp > ttl
}

/**
 * 保存数据到缓存
 */
export function setCache<T>(key: string, data: T): void {
  try {
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now()
    }
    localStorage.setItem(key, JSON.stringify(cacheItem))
    console.log(`💾 [缓存] 保存数据: ${key}`)
    console.log(`  - 时间: ${new Date().toLocaleString('zh-CN')}`)
  } catch (error) {
    console.error('❌ [缓存] 保存失败:', error)
  }
}

/**
 * 从缓存读取数据（带 TTL 检查）
 */
export function getCache<T>(
  key: string, 
  options: CacheOptions = {}
): T | null {
  const { ttl = DEFAULT_TTL, forceRefresh = false } = options

  // 如果强制刷新，直接返回 null
  if (forceRefresh) {
    console.log(`🔄 [缓存] 强制刷新，忽略缓存: ${key}`)
    return null
  }

  try {
    const cached = localStorage.getItem(key)
    if (!cached) {
      console.log(`❌ [缓存] 未找到: ${key}`)
      return null
    }

    const cacheItem: CacheItem<T> = JSON.parse(cached)
    
    // 检查是否过期
    if (isCacheExpired(cacheItem.timestamp, ttl)) {
      const ageHours = Math.floor((Date.now() - cacheItem.timestamp) / (60 * 60 * 1000))
      console.log(`⏰ [缓存] 已过期: ${key} (年龄: ${ageHours}小时)`)
      removeCache(key)
      return null
    }

    const ageMinutes = Math.floor((Date.now() - cacheItem.timestamp) / (60 * 1000))
    console.log(`✅ [缓存] 命中: ${key}`)
    console.log(`  - 年龄: ${ageMinutes} 分钟`)
    console.log(`  - 保存时间: ${new Date(cacheItem.timestamp).toLocaleString('zh-CN')}`)
    
    return cacheItem.data
  } catch (error) {
    console.error('❌ [缓存] 读取失败:', error)
    removeCache(key)
    return null
  }
}

/**
 * 删除单个缓存
 */
export function removeCache(key: string): void {
  try {
    localStorage.removeItem(key)
    console.log(`🗑️ [缓存] 删除: ${key}`)
  } catch (error) {
    console.error('❌ [缓存] 删除失败:', error)
  }
}

/**
 * 清理所有过期缓存
 */
export function cleanExpiredCache(): void {
  try {
    console.log('🧹 [缓存] 开始清理过期缓存...')
    let cleanedCount = 0
    
    const keys = Object.keys(localStorage)
    for (const key of keys) {
      // 只处理应用缓存
      if (!key.startsWith(CACHE_PREFIX)) continue
      
      try {
        const cached = localStorage.getItem(key)
        if (!cached) continue
        
        const cacheItem: CacheItem<any> = JSON.parse(cached)
        if (isCacheExpired(cacheItem.timestamp)) {
          localStorage.removeItem(key)
          cleanedCount++
        }
      } catch (e) {
        // 解析失败的缓存也删除
        localStorage.removeItem(key)
        cleanedCount++
      }
    }
    
    console.log(`✅ [缓存] 清理完成，删除 ${cleanedCount} 个过期项`)
  } catch (error) {
    console.error('❌ [缓存] 清理失败:', error)
  }
}

/**
 * 清理指定类型的所有缓存
 */
export function cleanCacheByType(type: CacheType): void {
  try {
    console.log(`🧹 [缓存] 清理类型: ${type}`)
    let cleanedCount = 0
    
    const prefix = `${CACHE_PREFIX}${type}_`
    const keys = Object.keys(localStorage)
    
    for (const key of keys) {
      if (key.startsWith(prefix)) {
        localStorage.removeItem(key)
        cleanedCount++
      }
    }
    
    console.log(`✅ [缓存] 清理完成，删除 ${cleanedCount} 个 ${type} 类型缓存`)
  } catch (error) {
    console.error('❌ [缓存] 清理失败:', error)
  }
}

/**
 * 清理所有应用缓存
 */
export function cleanAllCache(): void {
  try {
    console.log('🧹 [缓存] 清理所有应用缓存...')
    let cleanedCount = 0
    
    const keys = Object.keys(localStorage)
    for (const key of keys) {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key)
        cleanedCount++
      }
    }
    
    console.log(`✅ [缓存] 清理完成，删除 ${cleanedCount} 个缓存项`)
  } catch (error) {
    console.error('❌ [缓存] 清理失败:', error)
  }
}

/**
 * 获取缓存统计信息
 */
export function getCacheStats() {
  try {
    const keys = Object.keys(localStorage)
    const appCaches = keys.filter(k => k.startsWith(CACHE_PREFIX))
    
    const byType: Record<string, number> = {}
    let totalSize = 0
    let expiredCount = 0
    
    for (const key of appCaches) {
      // 统计类型
      const type = key.split('_')[2]
      byType[type] = (byType[type] || 0) + 1
      
      // 统计大小
      const value = localStorage.getItem(key)
      if (value) {
        totalSize += value.length
        
        // 检查是否过期
        try {
          const cacheItem: CacheItem<any> = JSON.parse(value)
          if (isCacheExpired(cacheItem.timestamp)) {
            expiredCount++
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    }
    
    return {
      total: appCaches.length,
      byType,
      totalSizeKB: (totalSize / 1024).toFixed(2),
      expiredCount
    }
  } catch (error) {
    console.error('❌ [缓存] 统计失败:', error)
    return null
  }
}

// ============================================
// 自动清理（页面加载时执行）
// ============================================

if (typeof window !== 'undefined') {
  // 每次应用启动时清理过期缓存
  cleanExpiredCache()
}
