# 🖼️ 图片生成缓存改进方案

## 🚨 当前问题

### 问题 1：不同平台生成的图片是一样的

**现象**：
```
1. 在"抖音"平台生成图片 A
2. 返回选择"B站"平台
3. 再次进入视觉生成页面 → 仍然显示图片 A ❌
```

**原因**：
- 缓存只有 `{ imageUrl, aspectRatio }`
- 没有区分 `title`、`platform`、`content`、`angle`
- 所有平台共享同一个缓存

### 问题 2：没有使用新的缓存系统

- ❌ 使用旧的 Zustand Store（内存缓存，刷新页面就丢失）
- ❌ 没有 TTL（过期时间）
- ❌ 没有 localStorage 持久化
- ❌ 没有使用 `useCachedFetch` Hook

---

## ✅ 改进方案

### 方案 A：重构为使用 `useCachedFetch` Hook

**缓存 Key 设计**：
```typescript
// 缓存 Key 应该包含所有影响图片内容的因素
buildCacheKey(
  CacheType.IMAGE,
  title,              // 热点标题
  angle,              // 切入角度
  platform,           // 平台名称
  selectedRatio       // 图片比例
)
// 示例：onion_cache_image_这大概是当老师最幸福的时刻_职业幸福感_抖快短视频_3:4
```

**代码实现**：

```typescript
// visual-generation/page.tsx

import { useCachedFetch } from '@/hooks/useCachedFetch'
import { buildCacheKey, CacheType } from '@/lib/cache'

function VisualGenerationContent() {
  const searchParams = useSearchParams()
  const title = searchParams.get('title') || ''
  const content = searchParams.get('content') || ''
  const angle = searchParams.get('angle') || ''
  const platform = searchParams.get('platform') || ''

  const [selectedRatio, setSelectedRatio] = useState('3:4')

  // ✅ 构建缓存 Key（区分 title + angle + platform + ratio）
  const cacheKey = buildCacheKey(
    CacheType.IMAGE,
    title,
    angle,
    platform,
    selectedRatio
  )

  // ✅ 使用 useCachedFetch Hook 自动处理缓存
  const { 
    data: imageData, 
    loading: isGenerating, 
    error, 
    refetch 
  } = useCachedFetch<{ imageUrl: string; aspectRatio: string }>({
    cacheKey,
    fetcher: async () => {
      console.log('📡 [P4] 发起图片生成请求:', {
        title,
        platform,
        aspectRatio: selectedRatio
      })

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      console.log('✅ [P4] 图片生成成功')
      
      return {
        imageUrl: data.imageUrl,
        aspectRatio: selectedRatio
      }
    },
    autoFetch: false,  // ⚠️ 不自动执行，等待用户点击按钮
    onSuccess: (data) => {
      console.log('✅ [P4] 图片已缓存')
    },
    onError: (error) => {
      console.error('❌ [P4] 图片生成失败:', error.message)
    }
  })

  // 提取数据
  const generatedImage = imageData?.imageUrl || null

  // 点击生成按钮
  const handleGenerate = () => {
    refetch(true)  // 强制刷新，忽略缓存
  }

  // 重新生成（清除缓存）
  const handleRegenerate = () => {
    refetch(true)
  }

  return (
    // ... UI 渲染
  )
}
```

---

## 📊 方案对比

### 当前方案 vs 改进方案

| 特性 | 当前方案 | 改进方案 |
|------|---------|---------|
| 缓存位置 | ❌ Zustand Store (内存) | ✅ localStorage (持久化) |
| 缓存区分度 | ❌ 所有平台共享 | ✅ title+angle+platform+ratio |
| 过期时间 | ❌ 无 (刷新即失效) | ✅ 24小时 TTL |
| 自动失效 | ❌ 无 | ✅ 超过24h自动清理 |
| 跨页面保持 | ❌ 只在当前会话 | ✅ 关闭浏览器也保持 |
| 管理工具 | ❌ 无 | ✅ CacheManager 组件 |
| 一致性 | ❌ 与其他页面不一致 | ✅ 与 P2/P3 一致 |

---

## 🎯 缓存行为示例

### 改进后的用户流程

```
场景 1：不同平台生成不同图片
1. 选择"抖音"平台 → 生成图片 A
   缓存 Key: onion_cache_image_热点_角度_抖快短视频_3:4
   
2. 返回，选择"B站"平台 → 生成图片 B
   缓存 Key: onion_cache_image_热点_角度_B站中长尾_16:9
   
3. 再次选择"抖音" → ✅ 显示图片 A (从缓存加载)
4. 再次选择"B站" → ✅ 显示图片 B (从缓存加载)

✅ 每个平台的图片独立缓存，互不干扰！
```

```
场景 2：不同比例生成不同图片
1. 选择 3:4 比例 → 生成竖屏图片 A
2. 切换到 16:9 比例 → 生成横屏图片 B
3. 切回 3:4 比例 → ✅ 显示图片 A (从缓存加载)

✅ 每个比例的图片独立缓存！
```

```
场景 3：缓存过期自动清理
1. 今天生成图片 A → 保存到缓存
2. 明天访问 (24h内) → ✅ 从缓存加载
3. 后天访问 (超过24h) → ❌ 缓存过期，重新生成

✅ 自动清理过期缓存，避免占用空间！
```

---

## 🚀 实施步骤

### Step 1: 重构 visual-generation/page.tsx

1. 移除 Zustand Store 相关代码
2. 引入 `useCachedFetch` Hook
3. 构建精确的缓存 Key
4. 修改 `handleGenerate` 和 `handleRegenerate` 逻辑

### Step 2: 测试缓存行为

1. 测试不同平台是否有独立缓存
2. 测试不同比例是否有独立缓存
3. 测试切换平台后返回是否使用缓存
4. 测试 24 小时后缓存是否失效

### Step 3: 优化用户体验

1. 如果有缓存，页面加载时自动显示
2. 添加"使用缓存图片"的提示
3. 添加缓存时间显示（如"3分钟前生成"）

---

## 🎓 最佳实践

### 缓存 Key 设计原则

✅ **包含所有影响结果的因素**：
- title (不同热点)
- angle (不同角度)
- platform (不同平台)
- aspectRatio (不同比例)

❌ **不要包含不影响结果的因素**：
- content (太长，且已由 title+angle+platform 确定)
- timestamp (每次都会变)
- userId (除非支持多用户)

### 自动加载 vs 手动触发

```typescript
// 场景 1：P2 角度分析 - 自动加载
autoFetch: true  // ✅ 进入页面立即分析

// 场景 2：P3 文案生成 - 自动加载
autoFetch: true  // ✅ 进入页面立即生成

// 场景 3：P4 图片生成 - 手动触发
autoFetch: false // ✅ 等待用户选择比例后点击按钮
```

---

## ✅ 预期效果

实施后，用户将体验到：

1. ✅ **每个平台的图片独立保存**
   - 抖音、B站、小红书各有专属图片
   
2. ✅ **每个比例的图片独立保存**
   - 3:4、16:9、1:1 各有专属图片
   
3. ✅ **缓存持久化**
   - 刷新页面不会丢失
   - 关闭浏览器再打开也能恢复
   
4. ✅ **自动过期**
   - 24小时后自动清理，避免占用空间
   
5. ✅ **统一的缓存管理**
   - 通过右下角的 CacheManager 统一管理
   - 可查看统计、清理缓存

---

**是否需要我立即实施这个改进方案？** 🚀
