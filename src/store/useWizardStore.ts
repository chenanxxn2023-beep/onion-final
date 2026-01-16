import { create } from 'zustand'

// ============================================
// Types & Interfaces
// ============================================

export type TrendCategory = '24h' | 'weekly'
export type TrendSource = 'weibo' | 'baidu' | 'zhihu' | '360'

export interface Trend {
  id: string
  title: string
  url: string
  source: TrendSource | string
  category: TrendCategory
  hot_score?: number
  is_k12_related?: boolean
}

export interface Angle {
  id: string
  type: '硬核科普' | '升学政策' | '趣味脑洞'
  title: string
  description: string
  icon: string
}

export interface Script {
  id: string
  channel: '朋友圈海报' | '小红书种草' | '短视频分镜'
  title: string
  content: string
  icon: string
}

// 生成的脚本数据结构（对应 API 返回）
export interface GeneratedScripts {
  scripts: {
    douyin: { title: string; content: string }
    bilibili: { title: string; content: string }
    xiaohongshu: { title: string; content: string }
    wechat: { title: string; content: string }
    weibo: { title: string; content: string }
  }
}

export interface Visual {
  id: string
  style: string
  imageUrl: string
  description: string
}

export type WizardStep = 0 | 1 | 2 | 3 | 4

// ============================================
// Mock Data (Fallback when API is unavailable)
// ============================================

export const MOCK_TRENDS: Trend[] = [
  // 24小时极速热点 (Fresh - 24h)
  {
    id: 'mock-1',
    title: '教育部今日发布：2026年中考体育改革新规正式落地',
    url: 'https://edu.gov.cn/news/2026/zhongkao-reform',
    category: '24h',
    source: 'baidu',
    is_k12_related: true,
  },
  {
    id: 'mock-2',
    title: '昨晚双子座流星雨达到峰值，多地学生熬夜观测',
    url: 'https://astro.sina.com.cn/2026/meteor-shower',
    category: '24h',
    source: 'weibo',
    is_k12_related: false,
  },
  {
    id: 'mock-3',
    title: 'ChatGPT-5 发布：AI 助教时代正式来临？',
    url: 'https://tech.qq.com/openai-gpt5-edu',
    category: '24h',
    source: 'zhihu',
    is_k12_related: true,
  },
  {
    id: 'mock-4',
    title: '北京今晨气温骤降至-15°C，中小学延时上学',
    url: 'https://weather.cma.cn/beijing-cold-wave',
    category: '24h',
    source: '360',
    is_k12_related: true,
  },
]

export const MOCK_ANGLES: Angle[] = [
  {
    id: 'angle-1',
    type: '硬核科普',
    title: '知识点深挖',
    description: '从热点事件中提炼核心知识点，用科学原理解释现象，打造"涨知识"型内容',
    icon: '🔬',
  },
  {
    id: 'angle-2',
    type: '升学政策',
    title: '政策解读',
    description: '关联中高考、升学规划，解读对学生和家长的实际影响，提供行动建议',
    icon: '📋',
  },
  {
    id: 'angle-3',
    type: '趣味脑洞',
    title: '创意联想',
    description: '用趣味视角重新解构热点，结合学科知识玩梗，打造"好玩又有料"的内容',
    icon: '💡',
  },
]

export const MOCK_SCRIPTS: Script[] = [
  {
    id: 'script-1',
    channel: '朋友圈海报',
    title: '朋友圈爆款海报',
    content: `【标题】🔥 这个热点，和你家娃的考试有关！

【主文案】
刚刚！教育部重磅发布...
🎯 核心变化：体育分值提升至70分
📚 影响学科：体育、健康教育
⏰ 生效时间：2026年秋季学期

【行动号召】
👆 长按识别，查看完整解读
让孩子赢在政策变化前！

【底部标签】
#中考新政 #教育热点 #洋葱学园`,
    icon: '📱',
  },
  {
    id: 'script-2',
    channel: '小红书种草',
    title: '小红书种草笔记',
    content: `姐妹们！这个教育新闻你们看了吗？？

（崩溃脸）刚看到教育部发的通知，我整个人都不好了...

但是！冷静下来仔细研究了一下，发现其实是个好事：

✅ 变化1：xxx更加科学合理
✅ 变化2：xxx减轻学生负担
✅ 变化3：xxx增加选择灵活性

🌟 划重点：家长们现在需要做的是...
1. 首先，不要焦虑
2. 其次，了解具体细则
3. 最后，合理规划孩子的时间

💜 关注洋葱学园，第一时间获取教育热点解读~

#教育干货 #中考 #家长必看 #升学规划`,
    icon: '📕',
  },
  {
    id: 'script-3',
    channel: '短视频分镜',
    title: '短视频分镜脚本',
    content: `【时长】60秒 | 【比例】9:16竖版

—— 分镜 1（0-5s）——
画面：洋葱学园 IP 形象从屏幕外跳入
台词："等等！这条新闻你看了吗？"
字幕：紧急！教育部最新通知
BGM：紧张感音效

—— 分镜 2（5-20s）——
画面：新闻截图 + 重点标注动画
台词：简述新闻核心内容
字幕：同步显示关键数字

—— 分镜 3（20-45s）——
画面：2.5D 教室场景 + 知识点浮窗
台词：用洋葱风格解释背后原理
字幕：知识点关键词

—— 分镜 4（45-60s）——
画面：IP 形象 + 互动引导
台词："想知道更多？关注洋葱学园！"
字幕：点赞 + 关注 + 评论区见`,
    icon: '🎬',
  },
]

export const MOCK_VISUALS: Visual[] = [
  {
    id: 'visual-1',
    style: '2.5D 等距插画',
    imageUrl: '/placeholder-visual-1.png',
    description: '明亮色彩的等距视角教室场景，洋葱 IP 形象作为讲解员',
  },
  {
    id: 'visual-2',
    style: '扁平矢量风',
    imageUrl: '/placeholder-visual-2.png',
    description: '简洁扁平的信息图表风格，突出数据和关键信息',
  },
  {
    id: 'visual-3',
    style: '卡通漫画风',
    imageUrl: '/placeholder-visual-3.png',
    description: '四格漫画形式呈现，用幽默对话传递知识点',
  },
  {
    id: 'visual-4',
    style: '动态海报风',
    imageUrl: '/placeholder-visual-4.png',
    description: '适合动图/短视频封面的动感设计，抓眼球',
  },
]

// ============================================
// Store Definition
// ============================================

interface WizardState {
  // Current wizard step
  currentStep: WizardStep
  
  // Trends data
  trends: Trend[]
  isLoadingTrends: boolean
  trendsError: string | null
  
  // Selected items at each step
  selectedTrend: Trend | null
  selectedAngle: Angle | null
  selectedScript: Script | null
  selectedVisual: Visual | null
  
  // ========== 新增：缓存生成的内容 ==========
  // Step 1: 分析的角度数据（缓存）+ 对应的标题
  analyzedAngles: Array<{ title: string; content: string }> | null
  analyzedAnglesTitle: string | null  // 记录是哪个标题的分析结果
  // Step 2: 生成的脚本数据（缓存） - 支持多个角度的缓存
  generatedScriptsCache: Record<string, GeneratedScripts>  // key: "标题::角度", value: 脚本数据
  // Step 3: 生成的图片 URL（缓存）
  generatedImageUrl: string | null
  generatedImageRatio: string | null
  
  // Actions
  setStep: (step: WizardStep) => void
  setTrends: (trends: Trend[]) => void
  setLoadingTrends: (loading: boolean) => void
  setTrendsError: (error: string | null) => void
  selectTrend: (trend: Trend) => void
  selectAngle: (angle: Angle) => void
  selectScript: (script: Script) => void
  selectVisual: (visual: Visual) => void
  
  // ========== 新增：缓存管理 ==========
  setAnalyzedAngles: (angles: Array<{ title: string; content: string }> | null, title?: string | null) => void
  setGeneratedScripts: (scripts: GeneratedScripts, cacheKey: string) => void
  getGeneratedScripts: (cacheKey: string) => GeneratedScripts | null
  clearScriptsCache: () => void
  setGeneratedImage: (imageUrl: string | null, aspectRatio?: string | null) => void
  clearGeneratedData: () => void
  
  reset: () => void
  goBack: () => void
}

const initialState = {
  currentStep: 0 as WizardStep,
  trends: [] as Trend[],
  isLoadingTrends: false,
  trendsError: null as string | null,
  selectedTrend: null,
  selectedAngle: null,
  selectedScript: null,
  selectedVisual: null,
  // 新增：缓存数据
  analyzedAngles: null as Array<{ title: string; content: string }> | null,
  analyzedAnglesTitle: null as string | null,
  generatedScriptsCache: {} as Record<string, GeneratedScripts>,  // 支持多个角度的缓存
  generatedImageUrl: null as string | null,
  generatedImageRatio: null as string | null,
}

export const useWizardStore = create<WizardState>((set, get) => ({
  ...initialState,

  setStep: (step) => set({ currentStep: step }),

  setTrends: (trends) => set({ trends, isLoadingTrends: false, trendsError: null }),
  
  setLoadingTrends: (loading) => set({ isLoadingTrends: loading }),
  
  setTrendsError: (error) => set({ trendsError: error, isLoadingTrends: false }),

  selectTrend: (trend) => {
    set({ selectedTrend: trend, currentStep: 1 })
  },

  selectAngle: (angle) => {
    set({ selectedAngle: angle, currentStep: 2 })
  },

  selectScript: (script) => {
    set({ selectedScript: script, currentStep: 3 })
  },

  selectVisual: (visual) => {
    set({ selectedVisual: visual, currentStep: 4 })
  },

  // ========== 新增：缓存管理函数 ==========
  setAnalyzedAngles: (angles, title = null) => {
    set({ 
      analyzedAngles: angles,
      analyzedAnglesTitle: title
    })
  },

  // 保存脚本到缓存（支持多个角度）
  setGeneratedScripts: (scripts, cacheKey) => {
    const { generatedScriptsCache } = get()
    set({ 
      generatedScriptsCache: {
        ...generatedScriptsCache,
        [cacheKey]: scripts
      }
    })
    console.log(`💾 [缓存] 保存脚本数据: ${cacheKey}`)
  },

  // 获取指定角度的脚本缓存
  getGeneratedScripts: (cacheKey) => {
    const { generatedScriptsCache } = get()
    const cached = generatedScriptsCache[cacheKey] || null
    console.log(`🔍 [缓存] 查询脚本数据: ${cacheKey} - ${cached ? '✅ 找到' : '❌ 未找到'}`)
    return cached
  },

  // 清除所有脚本缓存
  clearScriptsCache: () => {
    set({ generatedScriptsCache: {} })
    console.log('🗑️ [缓存] 清除所有脚本缓存')
  },

  setGeneratedImage: (imageUrl, aspectRatio = null) => {
    set({ 
      generatedImageUrl: imageUrl, 
      generatedImageRatio: aspectRatio 
    })
  },

  clearGeneratedData: () => {
    set({ 
      analyzedAngles: null,
      analyzedAnglesTitle: null,
      generatedScriptsCache: {},
      generatedImageUrl: null,
      generatedImageRatio: null
    })
  },

  goBack: () => {
    const { currentStep } = get()
    if (currentStep > 0) {
      set({ currentStep: (currentStep - 1) as WizardStep })
    }
  },

  reset: () => set(initialState),
}))

// Selector hooks for better performance
export const useCurrentStep = () => useWizardStore((state) => state.currentStep)
export const useTrends = () => useWizardStore((state) => state.trends)
export const useIsLoadingTrends = () => useWizardStore((state) => state.isLoadingTrends)
export const useTrendsError = () => useWizardStore((state) => state.trendsError)
export const useSelectedTrend = () => useWizardStore((state) => state.selectedTrend)
export const useSelectedAngle = () => useWizardStore((state) => state.selectedAngle)
export const useSelectedScript = () => useWizardStore((state) => state.selectedScript)
export const useSelectedVisual = () => useWizardStore((state) => state.selectedVisual)

// 新增：缓存数据的 selector hooks
export const useAnalyzedAngles = () => useWizardStore((state) => ({
  angles: state.analyzedAngles,
  title: state.analyzedAnglesTitle
}))

// 不再需要单独的 selector，直接使用 getGeneratedScripts 方法

export const useGeneratedImage = () => useWizardStore((state) => ({
  imageUrl: state.generatedImageUrl,
  aspectRatio: state.generatedImageRatio
}))
