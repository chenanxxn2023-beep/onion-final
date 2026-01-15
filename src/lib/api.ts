/**
 * 洋葱热点灵感捕手 - API Service
 * Frontend API client for trend aggregation
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface TrendResponse {
  id: string
  title: string
  url: string
  source: 'weibo' | 'baidu' | 'zhihu' | '360'
  category: '24h' | 'weekly'
  hot_score: number
  is_k12_related: boolean
}

export interface TrendsAPIResponse {
  success: boolean
  count: number
  data: TrendResponse[]
  meta: {
    sources: string[]
    k12_filtered: boolean
    timestamp: number
  }
}

/**
 * Fetch all trends from the aggregator API
 */
export async function fetchTrends(options?: {
  limit?: number
  k12Only?: boolean
  source?: string
}): Promise<TrendResponse[]> {
  try {
    const params = new URLSearchParams()
    
    if (options?.limit) {
      params.append('limit', options.limit.toString())
    }
    if (options?.k12Only) {
      params.append('k12_only', 'true')
    }
    if (options?.source) {
      params.append('source', options.source)
    }
    
    const queryString = params.toString()
    const url = `${API_BASE_URL}/api/trends${queryString ? `?${queryString}` : ''}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Don't cache to ensure fresh data
      cache: 'no-store',
    })
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    
    const data: TrendsAPIResponse = await response.json()
    
    if (!data.success) {
      throw new Error('API returned unsuccessful response')
    }
    
    return data.data
    
  } catch (error) {
    console.error('❌ Failed to fetch trends:', error)
    // Return empty array on error - UI will show fallback
    return []
  }
}

/**
 * Fetch trends from a specific source
 */
export async function fetchTrendsBySource(
  source: 'weibo' | 'baidu' | 'zhihu' | '360',
  limit: number = 15
): Promise<TrendResponse[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/trends/${source}?limit=${limit}`,
      {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store',
      }
    )
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    
    const data = await response.json()
    return data.data || []
    
  } catch (error) {
    console.error(`❌ Failed to fetch ${source} trends:`, error)
    return []
  }
}

/**
 * Check API health
 */
export async function checkAPIHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      cache: 'no-store',
    })
    return response.ok
  } catch {
    return false
  }
}

/**
 * Get source display info
 */
export function getSourceInfo(source: string): {
  name: string
  emoji: string
  color: string
  bgColor: string
} {
  const sourceMap: Record<string, { name: string; emoji: string; color: string; bgColor: string }> = {
    weibo: {
      name: '微博',
      emoji: '🔴',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    baidu: {
      name: '百度',
      emoji: '🔵',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    zhihu: {
      name: '知乎',
      emoji: '🟢',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    '360': {
      name: '360',
      emoji: '🟠',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  }
  
  return sourceMap[source] || {
    name: source,
    emoji: '⚪',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  }
}
