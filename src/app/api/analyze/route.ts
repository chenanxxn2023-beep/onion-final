import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// ============================================
// DeepSeek API 配置
// ============================================

const deepseek = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY || '', // 👈 显式传入 API Key
})

// ============================================
// System Prompt - 动态匹配设计
// ============================================

const SYSTEM_PROMPT = `你是一个敏锐的 K12 教育情报专家。

**你的任务：**
用户会提供一个新闻标题。请先判断该新闻的属性（是政策公文、社会热点、科技突破，还是校园安全事件？），然后智能匹配最适合该新闻的 3 个分析维度。

**要求：**
- 不要死板地套用固定模板
- 根据新闻类型灵活选择切入点
- 例如：
  - 遇到《大学生主播》应分析"职业观与媒介素养"
  - 遇到《新课标》应分析"考点变化与教学调整"
  - 遇到《AI 助教》应分析"技术如何改变教学方式"
  - 遇到《校园安全》应分析"家校责任与应急预案"

**输出格式：**
必须返回严格的 JSON 格式，包含 3 个分析角度：

\`\`\`json
{
  "angles": [
    {
      "title": "切入点名称（8字以内）",
      "content": "简短分析，100-150字，语言风趣、有洞察力"
    },
    {
      "title": "切入点名称",
      "content": "简短分析"
    },
    {
      "title": "切入点名称",
      "content": "简短分析"
    }
  ]
}
\`\`\`

**风格要求：**
- 语言风趣、接地气，符合"洋葱学园"品牌调性
- 每个分析要有实用价值，能给家长/老师带来启发
- 标题要吸引人，内容要有干货`

// ============================================
// POST /api/analyze
// ============================================

export async function POST(request: NextRequest) {
  try {
    // 1. 解析请求体
    const body = await request.json()
    const { title } = body

    // 2. 验证参数
    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: '缺少新闻标题参数' },
        { status: 400 }
      )
    }

    console.log('🤖 [DeepSeek] 开始分析新闻:', title)

    // 3. 检查 API Key
    if (!process.env.DEEPSEEK_API_KEY) {
      console.error('❌ [DeepSeek] API Key 未配置')
      return NextResponse.json(
        { error: 'DeepSeek API Key 未配置，请检查 .env.local' },
        { status: 500 }
      )
    }

    // 4. 调用 DeepSeek API
    const completion = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: `请分析这条新闻：《${title}》`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: 'json_object' }, // 强制 JSON 输出
    })

    // 5. 解析响应
    const responseContent = completion.choices[0]?.message?.content
    
    if (!responseContent) {
      throw new Error('DeepSeek 返回空内容')
    }

    console.log('✅ [DeepSeek] 原始响应:', responseContent)

    // 6. 解析 JSON
    let result
    try {
      result = JSON.parse(responseContent)
    } catch (parseError) {
      console.error('❌ [DeepSeek] JSON 解析失败:', parseError)
      throw new Error('AI 返回的不是有效的 JSON 格式')
    }

    // 7. 验证响应结构
    if (!result.angles || !Array.isArray(result.angles) || result.angles.length !== 3) {
      console.error('❌ [DeepSeek] 响应格式错误:', result)
      throw new Error('AI 返回的数据结构不正确')
    }

    // 8. 验证每个 angle 的结构
    for (const angle of result.angles) {
      if (!angle.title || !angle.content) {
        throw new Error('AI 返回的角度缺少必要字段')
      }
    }

    console.log('✅ [DeepSeek] 分析成功，返回 3 个角度')

    // 9. 返回成功响应
    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        title,
        model: 'deepseek-chat',
        timestamp: new Date().toISOString(),
      },
    })

  } catch (error: any) {
    // 错误处理
    console.error('❌ [DeepSeek] API 调用失败:', error)

    // 判断错误类型
    let errorMessage = '分析失败，请稍后重试'
    let statusCode = 500

    if (error.code === 'ECONNREFUSED' || error.message?.includes('fetch')) {
      errorMessage = '无法连接到 DeepSeek API，请检查网络'
      statusCode = 503
    } else if (error.status === 401) {
      errorMessage = 'API Key 无效，请检查配置'
      statusCode = 401
    } else if (error.status === 429) {
      errorMessage = 'API 请求频率过高，请稍后重试'
      statusCode = 429
    } else if (error.message) {
      errorMessage = error.message
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: statusCode }
    )
  }
}

// ============================================
// GET /api/analyze (健康检查)
// ============================================

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'DeepSeek Analysis API',
    configured: !!process.env.DEEPSEEK_API_KEY,
  })
}
