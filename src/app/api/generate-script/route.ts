import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// ============================================
// DeepSeek 客户端配置
// ============================================

const deepseek = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY || '',
})

// ============================================
// 平台定义
// ============================================

const PLATFORMS = ['douyin', 'bilibili', 'xiaohongshu', 'wechat', 'weibo'] as const
type Platform = typeof PLATFORMS[number]

// ============================================
// 分平台 System Prompt（核心：拆分原 Prompt）
// ============================================

function getSystemPromptByPlatform(platform: Platform): string {
  const baseRole = `你是洋葱学园内容运营团队的 K12 教育全媒体主编。`

  const platformPrompts: Record<Platform, string> = {
    douyin: `${baseRole}

# 平台：抖音/快手短视频

## 核心目标
为 K12 教育内容生成抖音/快手短视频脚本，15-60秒，重点是完播率。

## 风格要求
- **黄金3秒**：开场必须抛出悬念、痛点或反常识观点
- **分镜结构**：明确标注每段画面时长（如 0-3s、3-10s）
- **口播节奏**：短句，停顿，重复关键词，适合配合字幕+动画
- **情绪曲线**：有起伏，结尾强制动作（关注/点赞/转发）
- **严禁**：鸡汤化、无知识点、长镜头

## 输出格式
标题：<15字短标题>
正文：
【分镜1】(0-3s) 特写/中景
画面：...
口播：...

【分镜2】(3-10s)
画面：...
口播：...

...

【结尾】
口播：...
字幕：关注@洋葱学园，每天学点新知识

## JSON 格式
{
  "title": "标题",
  "content": "完整脚本内容"
}`,

    bilibili: `${baseRole}

# 平台：B站中长视频

## 核心目标
生成 3-5 分钟 B站视频脚本，硬核干货 + 玩梗，目标是投币/收藏/三连。

## 风格要求
- **开场**：自我介绍 + 话题引入（可玩梗）
- **逻辑大纲**：Part 1/2/3 明确分段，每段有小标题
- **知识密度高**：数据、案例、对比，适合配合动画演示
- **弹幕互动**：预留"此处插入洋葱动画演示"等提示
- **BGM 建议**：标注情绪点（紧张/轻松/高潮）
- **结尾**：总结 + 投币收藏提示

## 输出格式
标题：<20字标题>
正文：
【开场】
各位观众老爷们好...

【Part 1】标题
此处插入：洋葱动画演示...
...

【Part 2】标题
...

【结尾】
...
投币收藏，我们下期再见！

## JSON 格式
{
  "title": "标题",
  "content": "完整脚本内容"
}`,

    xiaohongshu: `${baseRole}

# 平台：小红书种草图文

## 核心目标
生成小红书图文笔记，情绪价值 > 知识价值，目标是收藏/分享。

## 风格要求
- **集美语气**："姐妹们"、"家人们"、"救命"、"谁懂啊"
- **Emoji 暴击**：每段必须插入 3+ 个表情，✨🔥💡⚠️ 等
- **分点列举**：1⃣️2⃣️3⃣️ 数字序号
- **话题标签**：结尾加 3-5 个 #话题标签（必须含 #洋葱学园 #K12教育）
- **视觉感强**：标注配图建议（如"图1配对比图"）
- **严禁**：说教口吻、长段落、纯文字

## 输出格式
标题：<带 Emoji 的吸睛标题>
正文：
姐妹们！今天必须跟你们说说这个事儿！

我朋友家孩子...

✨重点来了✨
1⃣️ 首先吧...
2⃣️ 然后呢...

📸配图建议：
图1：...
图2：...

#洋葱学园 #K12教育 #话题

## JSON 格式
{
  "title": "标题",
  "content": "完整笔记内容"
}`,

    wechat: `${baseRole}

# 平台：微信公众号深度图文

## 核心目标
生成 1500-2500 字深度文章，严肃权威，目标是转发/分享到家长群。

## 风格要求
- **标题**：信息量大，可用冒号/问号，严禁标题党
- **结构严谨**：引入 → 现象分析 → 深度拆解 → 行动建议
- **专业性**：引用教育学理论、政策、权威数据
- **金句标注**：正文中关键观点加【金句】标记，便于摘抄
- **家长视角**：以"为人父母"角度切入，共情感强
- **排版提示**：标注小标题、加粗、引用等

## 输出格式
标题：<严肃标题>
正文：
引入：
近日，...

【金句】"..."

分析：
从三个维度来看...
1. ...
2. ...

【金句】"..."

建议：
作为家长，我们应该...

结尾：
洋葱学园专注 K12 教育，欢迎转发...

## JSON 格式
{
  "title": "标题",
  "content": "完整文章内容"
}`,

    weibo: `${baseRole}

# 平台：微博短评

## 核心目标
生成 140 字以内犀利短评，一句话抓住核心观点，目标是转发/评论。

## 风格要求
- **极简表达**：只说一个观点，一针见血
- **金句必备**：必须包含一句可引用的【金句】
- **话题标签**：1-2 个 #话题标签（必须含 #K12教育）
- **@账号**：结尾加 via @洋葱学园
- **严禁**：长篇大论、模糊观点、鸡汤

## 输出格式
标题：即便微博无需标题，也请在 title 字段填入微博正文的前 10-15 个字作为摘要
正文：
#话题# 一句话观点。【金句】"关键句"。补充说明。#K12教育 via @洋葱学园

示例：
#大学生主播# 这事儿得两说。主播本身没问题，问题是把它当成捷径。【金句】"流量会散，但能力永远在。" 家长们，引导比禁止更重要。#K12教育 via @洋葱学园

## JSON 格式（重要：title 不能为空）
{
  "title": "#话题# 一句话观点",
  "content": "完整的140字短评"
}

⚠️ 注意：title 字段必须填写，即使微博本身不需要标题，也请将正文的前 10-15 个字作为 title 返回。`,
  }

  return platformPrompts[platform]
}

// ============================================
// 单平台生成函数
// ============================================

async function generateSinglePlatform(
  platform: Platform,
  title: string,
  angle: string
): Promise<{ title: string; content: string; error?: string }> {
  try {
    console.log(`📡 [${platform}] 开始生成...`)

    const completion = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: getSystemPromptByPlatform(platform),
        },
        {
          role: 'user',
          content: `请为以下内容生成文案：

【新闻标题】${title}

【切入角度】${angle}

请严格按照 JSON 格式输出：{ "title": "...", "content": "..." }`,
        },
      ],
      temperature: 0.8,
      max_tokens: 1500, // 单平台只需 1500 tokens
      response_format: { type: 'json_object' },
    })

    const responseContent = completion.choices[0]?.message?.content
    if (!responseContent) {
      throw new Error('DeepSeek 返回空内容')
    }

    const parsed = JSON.parse(responseContent)

    // 软验证：为缺失的字段提供默认值
    const safeTitle = parsed.title || 
      (platform === 'weibo' ? '微博短评' : 
       platform === 'douyin' ? '短视频脚本' :
       platform === 'bilibili' ? 'B站视频脚本' :
       platform === 'xiaohongshu' ? '小红书笔记' :
       platform === 'wechat' ? '公众号文章' : '无标题')
    
    const safeContent = parsed.content || ''

    // 只有 content 真的为空时才抛出错误
    if (!safeContent || safeContent.trim() === '') {
      throw new Error('返回的 content 为空')
    }

    console.log(`✅ [${platform}] 生成成功`)
    return {
      title: safeTitle,
      content: safeContent,
    }
  } catch (err: any) {
    console.error(`❌ [${platform}] 生成失败:`, err.message)
    return {
      title: '生成失败',
      content: `该平台生成失败，错误: ${err.message}。请点击"重新生成"重试。`,
      error: err.message,
    }
  }
}

// ============================================
// GET 请求：健康检查
// ============================================

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'generate-script',
    mode: 'concurrent',
    message: '使用 Promise.all 并发生成 5 个平台',
  })
}

// ============================================
// POST 请求：生成脚本
// ============================================

export async function POST(request: NextRequest) {
  try {
    // 1. 解析请求体
    const body = await request.json()
    const { title, angle, platform } = body

    // 2. 验证参数
    if (!title || !angle) {
      return NextResponse.json(
        { 
          success: false,
          error: '缺少必要参数：title 和 angle' 
        },
        { status: 400 }
      )
    }

    // 3. 判断是单平台还是全平台生成
    const isSinglePlatform = !!platform
    const targetPlatforms: Platform[] = isSinglePlatform ? [platform] : [...PLATFORMS]

    console.log(`🚀 [DeepSeek] 开始并发生成:`, {
      title,
      angle,
      platforms: targetPlatforms.join(', '),
      mode: isSinglePlatform ? 'single' : 'concurrent',
    })

    // 4. 使用 Promise.all 并发请求
    const startTime = Date.now()
    const results = await Promise.all(
      targetPlatforms.map((p) => generateSinglePlatform(p, title, angle))
    )
    const endTime = Date.now()

    console.log(`⚡️ [DeepSeek] 并发完成，耗时: ${endTime - startTime}ms`)

    // 5. 构建响应数据
    const scripts: Record<Platform, { title: string; content: string }> = {
      douyin: { title: '', content: '' },
      bilibili: { title: '', content: '' },
      xiaohongshu: { title: '', content: '' },
      wechat: { title: '', content: '' },
      weibo: { title: '', content: '' },
    }

    let errorCount = 0
    targetPlatforms.forEach((p, index) => {
      scripts[p] = {
        title: results[index].title,
        content: results[index].content,
      }
      if (results[index].error) {
        errorCount++
      }
    })

    // 6. 返回响应
    const allSuccess = errorCount === 0
    const someSuccess = errorCount < targetPlatforms.length

    return NextResponse.json({
      success: someSuccess, // 只要有一个成功就算成功
      data: {
        scripts,
      },
      meta: {
        title,
        angle,
        platform: isSinglePlatform ? platform : null,
        mode: isSinglePlatform ? 'single' : 'concurrent',
        model: 'deepseek-chat',
        timestamp: new Date().toISOString(),
        completeness: allSuccess ? 'full' : 'partial',
        error_count: errorCount,
        success_count: targetPlatforms.length - errorCount,
        duration_ms: endTime - startTime,
      },
    })
  } catch (err: any) {
    console.error('❌ [DeepSeek] 生成失败:', err)
    return NextResponse.json(
      {
        success: false,
        error: err.message || '未知错误',
      },
      { status: 500 }
    )
  }
}
