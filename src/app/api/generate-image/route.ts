import { NextRequest, NextResponse } from 'next/server';
import { IP_LIBRARY } from '@/lib/ip-library'; 

export const maxDuration = 60; // 延长超时时间

// ============================================
// 🐶 最终版：狗蛋主演 + 深度诊断模式
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, aspectRatio } = body;

    // =====================================================
    // 🕵️‍♀️ 1. 环境变量深度诊断 (报错会直接告诉你是缺了哪一个)
    // =====================================================
    const DS_KEY = process.env.DEEPSEEK_API_KEY;
    const IMG_HOST = process.env.NEXT_PUBLIC_IMAGE_API_HOST;
    const IMG_KEY = process.env.IMAGE_API_KEY;
    const IMG_TENANT = process.env.IMAGE_TENANT_ID;

    const missingKeys = [];
    if (!DS_KEY) missingKeys.push("DEEPSEEK_API_KEY");
    if (!IMG_HOST) missingKeys.push("NEXT_PUBLIC_IMAGE_API_HOST");
    if (!IMG_KEY) missingKeys.push("IMAGE_API_KEY");

    if (missingKeys.length > 0) {
      const errorMsg = `❌ 致命错误: Vercel 环境变量缺失: ${missingKeys.join(", ")}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    // =====================================================
    // 🖼️ 2. 准备狗蛋参考图
    // =====================================================
    const publicHost = process.env.NEXT_PUBLIC_HOST || 'https://onion-final-smlp.vercel.app';
    
    // 提取 IP 库的前 2 张图，并确保是绝对路径
    const referenceImages = IP_LIBRARY.slice(0, 2).map(img => {
      if (img.src.startsWith('http')) return img.src;
      return `${publicHost}${img.src}`;
    });

    console.log(`🐶 [1/2] 正在让 DeepSeek 设计狗蛋的动作 (中文)...`);

    // =====================================================
    // 🤖 3. DeepSeek 导演设计动作
    // =====================================================
    const dsResponse = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DS_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "你是一个插画导演。请根据用户提供的文章内容，设计画面提示词。\n\n要求：\n1. 主角固定为'狗蛋' (一个可爱的卡通IP角色)。\n2. **必须使用中文**。\n3. 重点描述**狗蛋的动作、表情和姿态**，要生动有趣，贴合文章主题。\n4. 描述周围的环境氛围。\n5. 风格：高质量插画，色彩鲜艳。\n6. 字数控制在 60 字以内，不要太长。"
          },
          {
            role: "user",
            content: `标题：${title}\n内容片段：${content.substring(0, 200)}`
          }
        ],
        temperature: 0.8
      })
    });

    if (!dsResponse.ok) {
      const errText = await dsResponse.text();
      throw new Error(`DeepSeek 调用失败: ${dsResponse.status} - ${errText}`);
    }

    const dsData = await dsResponse.json();
    const actionPrompt = dsData.choices?.[0]?.message?.content || "";
    const cleanPrompt = actionPrompt.replace(/[\n\r]/g, " ").trim();

    console.log(`✨ 动作设计: ${cleanPrompt}`);

    // =====================================================
    // 🎨 4. NanoBanana 绘制 (图生图)
    // =====================================================
    console.log(`🎨 [2/2] 正在绘制狗蛋... (参考图数量: ${referenceImages.length})`);

    // 映射比例
    let ratio = "1:1";
    if (aspectRatio === '16:9') ratio = "16:9";
    if (aspectRatio === '9:16') ratio = "9:16";
    if (aspectRatio === '3:4') ratio = "3:4";

    const imgPayload = {
      model: "nanobananapro",
      prompt: cleanPrompt, 
      images: referenceImages, // 核心：发送狗蛋照片
      ratio: ratio,
      // resolution: "4k", // 保持禁用，使用默认 2K
    };

    const imgResponse = await fetch(`${IMG_HOST}/v3/images/compositions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${IMG_KEY}`,
        'TenantId': IMG_TENANT || '000000'
      },
      body: JSON.stringify(imgPayload)
    });

    if (!imgResponse.ok) {
      const err = await imgResponse.text();
      console.error('❌ 生图接口报错:', err);
      throw new Error(`生图失败: ${imgResponse.status} - ${err}`);
    }

    const imgData = await imgResponse.json();

    if (imgData.code !== 200) {
      console.error('❌ 业务报错:', imgData);
      throw new Error(`API报错: ${imgData.msg}`);
    }

    const imageUrl = imgData.data?.data?.[0]?.url;
    if (!imageUrl) throw new Error('未返回图片URL');

    console.log('✅ 狗蛋新图生成成功:', imageUrl);

    return NextResponse.json({
      imageUrl,
      aspectRatio: ratio
    });

  } catch (error) {
    console.error('❌ 流程异常:', error);
    // 这里会把具体的错误信息（比如缺了哪个 Key）返回给前端
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}