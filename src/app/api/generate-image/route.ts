import { NextRequest, NextResponse } from 'next/server';
import { IP_LIBRARY } from '@/lib/ip-library';

export const maxDuration = 60; // 设置超时时间

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, aspectRatio } = body;

    // ==========================================
    // 1. 密钥与配置检查 (调试核心)
    // ==========================================
    
    // 优先从环境变量获取，如果没有则使用空字符串(或在此处暂时硬编码用于测试)
    const DS_KEY = process.env.DEEPSEEK_API_KEY || "sk-68af1d1391c04bf4be0929208d96692d";
    const YUNAI_KEY = process.env.YUNAI_API_KEY || "sk-K2D9VCTOiOTS2gOsatyuxsovJAkG1fVx9U3ylHaY3dRn8euA";
    const YUNAI_URL = process.env.YUNAI_BASE_URL || "https://yunai.chat";

    // 打印调试日志 (在终端查看)
    console.log("----------------------------------------");
    console.log("🔧 配置检查:");
    console.log(`- DeepSeek Key 长度: ${DS_KEY ? DS_KEY.length : 0}`);
    console.log(`- YunAi Key 长度: ${YUNAI_KEY ? YUNAI_KEY.length : 0}`);
    console.log(`- YunAi Base URL: ${YUNAI_URL}`);
    console.log("----------------------------------------");

    if (!YUNAI_KEY || YUNAI_KEY.length < 10) {
      throw new Error("❌ 未检测到有效的 YUNAI_API_KEY，请检查 .env.local 文件并重启服务");
    }

    // ==========================================
    // 2. 准备参考图
    // ==========================================
    const publicHost = process.env.NEXT_PUBLIC_HOST || 'https://onion-final-smlp.vercel.app';
    const referenceImageObj = IP_LIBRARY[0];
    let referenceImageUrl = referenceImageObj.src;
    
    // 确保图片是绝对路径
    if (!referenceImageUrl.startsWith('http')) {
      const cleanSrc = referenceImageUrl.startsWith('/') ? referenceImageUrl : `/${referenceImageUrl}`;
      referenceImageUrl = `${publicHost}${cleanSrc}`;
    }
    console.log(`🖼️ 参考图地址: ${referenceImageUrl}`);

    // ==========================================
    // 3. DeepSeek 生成提示词
    // ==========================================
    console.log(`🐶 [1/2] DeepSeek 设计提示词...`);
    const dsResponse = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DS_KEY}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "你是一个插画导演。请根据文章内容，设计一段**中文**画面描述。主角是'狗蛋'，描述动作和场景，不要描述长相。字数80字以内。" },
          { role: "user", content: `标题：${title}\n内容片段：${content.substring(0, 200)}` }
        ],
        temperature: 0.7
      })
    });

    if (!dsResponse.ok) {
        const err = await dsResponse.text();
        throw new Error(`DeepSeek Error (${dsResponse.status}): ${err}`);
    }
    const dsData = await dsResponse.json();
    const prompt = dsData.choices?.[0]?.message?.content?.replace(/[\n\r]/g, " ").trim() || "可爱的狗蛋";
    console.log(`✨ 提示词: ${prompt}`);

    // ==========================================
    // 4. 调用凌云 API (即梦)
    // ==========================================
    console.log(`🎨 [2/2] 调用即梦生图...`);
    
    let size = "2048x2048"; 
    if (aspectRatio === '16:9') size = "2560x1440";
    if (aspectRatio === '9:16') size = "1440x2560";
    if (aspectRatio === '3:4') size = "1728x2304"; 
    if (aspectRatio === '4:3') size = "2304x1728";
    
    // 凌云 API 参数构造
    const payload = {
      model: "doubao-seedream-4-0-250828",
      prompt: prompt,
      image: [referenceImageUrl], // 必须是数组
      size: size,
      sequential_image_generation: "disabled", // 关闭组图，只生一张
      response_format: "url",
      watermark: false
    };

    const yunaiResponse = await fetch(`${YUNAI_URL}/v1/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${YUNAI_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!yunaiResponse.ok) {
      const errText = await yunaiResponse.text();
      console.error('API Error:', errText);
      throw new Error(`凌云API报错 (${yunaiResponse.status}): ${errText}`);
    }

    const result = await yunaiResponse.json();
    const imageUrl = result.data?.[0]?.url;

    if (!imageUrl) {
      console.error("API返回异常数据:", JSON.stringify(result));
      throw new Error('API 返回成功但未找到图片 URL');
    }

    console.log('✅ 生图成功:', imageUrl);

    return NextResponse.json({
      imageUrl,
      aspectRatio: aspectRatio
    });

  } catch (error) {
    console.error('❌ 流程异常:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}