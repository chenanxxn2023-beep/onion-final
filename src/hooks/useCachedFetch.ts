/**
 * useCachedFetch Hook
 * 带有 TTL 的缓存 API 调用
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { getCache, setCache, type CacheOptions } from '@/lib/cache'

interface UseCachedFetchOptions<T> extends CacheOptions {
  // 缓存 Key
  cacheKey: string
  // 数据获取函数
  fetcher: () => Promise<T>
  // 是否在组件加载时自动执行
  autoFetch?: boolean
  // 初始数据
  initialData?: T | null
  // 成功回调
  onSuccess?: (data: T) => void
  // 错误回调
  onError?: (error: Error) => void
}

interface UseCachedFetchResult<T> {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: (forceRefresh?: boolean) => Promise<void>
  reset: () => void
}

/**
 * 带缓存的数据获取 Hook
 * 
 * @param options - 配置选项（包含 cacheKey 和 fetcher）
 */
export function useCachedFetch<T>(
  options: UseCachedFetchOptions<T>
): UseCachedFetchResult<T> {
  const {
    cacheKey,
    fetcher,
    autoFetch = true,
    initialData = null,
    forceRefresh = false,
    ttl,
    onSuccess,
    onError
  } = options

  const [data, setData] = useState<T | null>(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // ========== 使用 ref 存储回调函数，避免无限循环 ==========
  const fetcherRef = useRef(fetcher)
  const onSuccessRef = useRef(onSuccess)
  const onErrorRef = useRef(onError)

  // 每次渲染时更新 ref
  useEffect(() => {
    fetcherRef.current = fetcher
    onSuccessRef.current = onSuccess
    onErrorRef.current = onError
  })

  // ========== 关键修改：执行数据获取（优化缓存查询逻辑）==========
  const fetchData = useCallback(async (force: boolean = false) => {
    // 如果没有 cacheKey，不执行
    if (!cacheKey) {
      console.log('⚠️ [useCachedFetch] cacheKey 为空，跳过')
      return
    }

    try {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('🔍 [useCachedFetch] 开始获取数据')
      console.log('  📍 Cache Key:', cacheKey)
      console.log('  🔄 强制刷新:', force ? '是' : '否')

      // ========== 步骤 1：优先查询缓存 ==========
      if (!force && !forceRefresh) {
        const cached = getCache<T>(cacheKey, { ttl })
        if (cached !== null) {
          console.log('  ✅ 缓存命中！使用缓存数据')
          console.log('  ⚡ 跳过 API 调用')
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
          
          // 直接使用缓存，不显示 loading
          setData(cached)
          setError(null)
          setLoading(false)
          onSuccessRef.current?.(cached)
          return  // ✅ 关键：拦截后续的 API 请求
        }
      }

      // ========== 步骤 2：缓存未命中，调用 API ==========
      console.log('  ❌ 缓存未命中')
      console.log('  ⚡ 开始调用 API...')
      
      setLoading(true)
      setError(null)
      
      const result = await fetcherRef.current()
      
      // ========== 步骤 3：保存到缓存 ==========
      setCache(cacheKey, result)
      
      // ========== 步骤 4：更新状态 ==========
      setData(result)
      setLoading(false)
      onSuccessRef.current?.(result)
      
      console.log('  ✅ API 调用成功，数据已缓存')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('未知错误')
      console.error('  ❌ 数据获取失败:', error.message)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
      
      setError(error)
      setLoading(false)
      onErrorRef.current?.(error)
    }
  }, [cacheKey, forceRefresh, ttl])  // ✅ 移除回调函数依赖，避免无限循环

  // 重新获取（支持强制刷新）
  const refetch = useCallback((force: boolean = false) => {
    return fetchData(force)
  }, [fetchData])

  // 重置状态
  const reset = useCallback(() => {
    setData(initialData)
    setLoading(false)
    setError(null)
  }, [initialData])

  // ========== 关键修改：监听 cacheKey 变化 ==========
  useEffect(() => {
    if (autoFetch && cacheKey) {
      console.log('🔄 [useCachedFetch] cacheKey 变化，重新获取数据')
      fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, autoFetch])  // ✅ 只依赖 cacheKey 和 autoFetch，fetchData 通过 useCallback 保持稳定

  return {
    data,
    loading,
    error,
    refetch,
    reset
  }
}
