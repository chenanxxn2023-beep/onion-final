# 缓存系统实现文档

## 📦 已创建的核心文件

### 1. `/src/lib/cache.ts` - 缓存工具库
提供底层缓存操作函数，支持：
- ✅ TTL（24小时过期）
- ✅ localStorage 持久化
- ✅ 自动过期检查
- ✅ 缓存统计和清理

### 2. `/src/hooks/useCachedFetch.ts` - 自定义 Hook
React Hook 封装，简化组件中的缓存使用。

## 🔧 如何使用新缓存系统

### 场景 A：P2 角度选择页面（修改 select-angle/page.tsx）

```typescript
import { useCachedFetch } from '@/hooks/useCachedFetch'
import { buildCacheKey, CacheType } from '@/lib/cache'

function SelectAngleContent() {
  const searchParams = useSearchParams()
  const title = searchParams.get('title') || ''
  const topicId = searchParams.get('id') || title  // 使用 topic ID
  
  // 构建缓存 Key
  const cacheKey = buildCacheKey(CacheType.ANALYSIS, topicId)
  
  // 使用带缓存的数据获取
  const { data: angles, loading, error, refetch } = useCachedFetch({
    cacheKey,
    // Fetcher: 调用 API 的函数
    fetcher: async () => {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.error)
      return result.data.angles
    },
    // 组件加载时自动执行
    autoFetch: true,
    // 成功回调（可选）
    onSuccess: (data) => {
      console.log('✅ 角度分析成功:', data)
    }
  })
  
  // 手动重新分析（忽略缓存）
  const handleRegenerate = () => {
    refetch(true)  // 参数 true 表示强制刷新
  }
  
  return (
    <div>
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage error={error} />}
      {angles && (
        <div>
          {angles.map(angle => (
            <AngleCard key={angle.title} angle={angle} />
          ))}
          <button onClick={handleRegenerate}>重新分析</button>
        </div>
      )}
    </div>
  )
}
```

### 场景 B：P3 文案生成页面（修改 script-result/page.tsx）

```typescript
import { useCachedFetch } from '@/hooks/useCachedFetch'
import { buildCacheKey, CacheType } from '@/lib/cache'

function ScriptResultContent() {
  const searchParams = useSearchParams()
  const title = searchParams.get('title') || ''
  const angle = searchParams.get('angle') || ''
  const topicId = searchParams.get('id') || title
  
  // 构建缓存 Key（topicId + angleId）
  const cacheKey = buildCacheKey(CacheType.COPY, topicId, angle)
  
  // 使用带缓存的数据获取
  const { data: scripts, loading, error, refetch } = useCachedFetch({
    cacheKey,
    // Fetcher: 调用 API 的函数
    fetcher: async () => {
      const response = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, angle }),
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    autoFetch: true
  })
  
  // 重新生成全部
  const handleRegenerateAll = () => {
    refetch(true)  // 强制刷新
  }
  
  // 重新生成单个平台
  const handleRegeneratePlatform = async (platform: string) => {
    // 单平台生成，需要手动合并缓存
    const response = await fetch('/api/generate-script', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, angle, platform }),
    })
    const result = await response.json()
    
    // 更新缓存
    if (scripts) {
      const updatedScripts = {
        ...scripts,
        scripts: {
          ...scripts.scripts,
          [platform]: result.data.scripts[platform]
        }
      }
      setCache(cacheKey, updatedScripts)
      // 触发重新获取以更新UI
      refetch()
    }
  }
  
  return (
    <div>
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage error={error} />}
      {scripts && (
        <div>
          <ScriptTabs scripts={scripts} />
          <button onClick={handleRegenerateAll}>重新生成全部</button>
        </div>
      )}
    </div>
  )
}
```

## 📊 缓存 Key 规范

| 页面 | 缓存类型 | Key 格式 | 示例 |
|------|---------|---------|------|
| P2 角度选择 | ANALYSIS | `onion_cache_analysis_{topicId}` | `onion_cache_analysis_topic123` |
| P3 文案生成 | COPY | `onion_cache_copy_{topicId}_{angleId}` | `onion_cache_copy_topic123_angle1` |
| P4 图片生成 | IMAGE | `onion_cache_image_{topicId}_{angleId}` | `onion_cache_image_topic123_angle1` |

## 🔄 工作流程示例

### 用户操作序列

```
1️⃣ 用户点击热点 A（ID: topic_A）
   ↓
   🔍 查询缓存: analysis_topic_A
   ❌ 未找到
   ⚡ 调用 DeepSeek API
   💾 保存缓存（有效期 24h）
   ✅ 显示 3 个角度

2️⃣ 用户选择角度 1
   ↓
   🔍 查询缓存: copy_topic_A_angle1
   ❌ 未找到
   ⚡ 调用 DeepSeek API
   💾 保存缓存（有效期 24h）
   ✅ 显示 5 个平台文案

3️⃣ 用户返回 → 选择角度 2
   ↓
   🔍 查询缓存: copy_topic_A_angle2
   ❌ 未找到
   ⚡ 调用 DeepSeek API
   💾 保存缓存
   ✅ 显示文案

4️⃣ 用户返回 → 选择角度 1
   ↓
   🔍 查询缓存: copy_topic_A_angle1
   ✅ 找到！（2分钟前保存）
   ✅ 直接显示缓存数据（不调用 API）

5️⃣ 用户返回首页 → 选择热点 B（ID: topic_B）
   ↓
   🔍 查询缓存: analysis_topic_B
   ❌ 未找到
   ⚡ 调用 DeepSeek API
   💾 保存缓存
   ✅ 显示 3 个角度

6️⃣ 用户返回首页 → 再次选择热点 A
   ↓
   🔍 查询缓存: analysis_topic_A
   ✅ 找到！（5分钟前保存）
   ✅ 直接显示缓存数据（不调用 API）
```

## 🔄 关键修复：切换 ID 时正确使用缓存

### ⚠️ Bug 说明（已修复）
**之前的问题**：在 Page 2 内部切换不同热点时（如 热点A -> 热点B -> 热点A），即使热点 A 已有缓存，系统仍会重新调用 API。

**根本原因**：`useEffect` 没有监听 `cacheKey` 的变化。

### ✅ 修复方案
在 `/src/hooks/useCachedFetch.ts` 中：

```typescript
// ❌ 之前：只在组件加载时执行一次
useEffect(() => {
  if (autoFetch && cacheKey) {
    fetchData()
  }
}, [])  // 空依赖数组

// ✅ 现在：监听 cacheKey 变化
useEffect(() => {
  if (autoFetch && cacheKey) {
    console.log('🔄 [useCachedFetch] cacheKey 变化，重新获取数据')
    fetchData()
  }
}, [cacheKey, autoFetch, fetchData])  // 依赖 cacheKey
```

### 🎯 修复后的行为

```
场景：在 Page 2 内部切换热点

1️⃣ 选择热点 A
   - cacheKey = "analysis_A"
   - 缓存未命中 → 调用 API
   - 保存到缓存

2️⃣ 切换到热点 B（下拉菜单）
   - cacheKey 变化：analysis_A → analysis_B
   - useEffect 触发 ✅
   - 缓存未命中 → 调用 API
   - 保存到缓存

3️⃣ 切回热点 A（下拉菜单）
   - cacheKey 变化：analysis_B → analysis_A
   - useEffect 触发 ✅
   - ✅ 缓存命中！直接使用缓存数据
   - ❌ 不会调用 API
   - ⚡ 数据瞬间显示，无 loading
```

### 📋 验证清单

请确保你的页面组件满足以下条件：

- ✅ `cacheKey` 必须包含动态 ID（如 `analysis_${topicId}`）
- ✅ 当 ID 变化时，`cacheKey` 也会随之变化
- ✅ `useCachedFetch` 的 `autoFetch` 设为 `true`
- ✅ 不要在组件内部手动管理缓存逻辑

### 🧪 如何测试

```bash
# 1. 打开浏览器控制台
# 2. 访问 P2 页面，选择热点 A
# 应看到: "⚡ 开始调用 API..." → "✅ API 调用成功，数据已缓存"

# 3. 在页面内切换到热点 B
# 应看到: "🔄 cacheKey 变化..." → "⚡ 开始调用 API..."

# 4. 切回热点 A
# 应看到: "🔄 cacheKey 变化..." → "✅ 缓存命中！使用缓存数据" → "⚡ 跳过 API 调用"
# ❌ 绝不应该看到: "开始调用 API"
```

## 🧹 缓存管理

### 清理过期缓存（自动）
```typescript
// 在 /src/lib/cache.ts 中已自动执行
// 每次应用启动时自动清理过期（>24h）的缓存
```

### 手动清理（可选）
```typescript
import { cleanExpiredCache, cleanAllCache, getCacheStats } from '@/lib/cache'

// 1. 查看缓存统计
const stats = getCacheStats()
console.log('缓存统计:', stats)
// 输出: { total: 15, byType: { analysis: 5, copy: 10 }, totalSizeKB: "234.56", expiredCount: 2 }

// 2. 清理过期缓存
cleanExpiredCache()

// 3. 清理所有缓存
cleanAllCache()
```

## ⚡ 性能优势

| 场景 | 之前 | 现在 |
|------|------|------|
| 返回上一页 | ❌ 重新调用 API | ✅ 使用缓存，即时显示 |
| 切换不同角度 | ❌ 每次都调用 API | ✅ 已生成的角度使用缓存 |
| 24小时内重复访问 | ❌ 重复调用 API | ✅ 使用缓存 |
| API 调用次数 | 🔴 N 次 | 🟢 首次 + 强制刷新 |
| 用户等待时间 | 🔴 5-10秒 | 🟢 <100ms（缓存） |

## 🎯 下一步实施

### Step 1: 修改 P2 角度选择页面
```bash
/src/app/select-angle/page.tsx
```
- ✅ 引入 useCachedFetch
- ✅ 替换原有的 useState + useEffect
- ✅ 添加"重新分析"按钮调用 refetch(true)

### Step 2: 修改 P3 文案生成页面
```bash
/src/app/script-result/page.tsx
```
- ✅ 引入 useCachedFetch
- ✅ 使用 buildCacheKey(CacheType.COPY, topicId, angleId)
- ✅ 保持"重新生成"功能

### Step 3: 可选优化
- 在首页添加缓存统计面板（开发模式）
- 添加"清理缓存"按钮（设置页面）

## 📝 注意事项

1. ✅ **Topic ID**: 确保每个热点有唯一的 ID，不要只用 title
2. ✅ **过期时间**: 默认 24小时，可根据需要调整
3. ✅ **强制刷新**: 用户点击"重新生成"时传递 `refetch(true)`
4. ✅ **缓存大小**: localStorage 有 5-10MB 限制，注意监控
5. ✅ **错误处理**: 缓存解析失败会自动删除并重新请求

## 🚀 立即开始

所有核心工具已创建完成：
- ✅ `/src/lib/cache.ts` - 缓存工具库
- ✅ `/src/hooks/useCachedFetch.ts` - React Hook

现在只需要在页面组件中引入使用即可！
