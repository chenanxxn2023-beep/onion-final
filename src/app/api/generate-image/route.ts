import { NextRequest, NextResponse } from 'next/server';
import { IP_LIBRARY } from '@/lib/ip-library'; // 👈 必须引入狗蛋的图库

export const maxDuration = 60;

// ============================================
// 🐶 狗蛋专属版：中文指令 + 参考图 + 动态姿态
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, aspectRatio } = body;

    // 1. 检查环境变量
    const DS_KEY = process.env.DEEPSEEK_API_KEY;
    const IMG_HOST = process.env.NEXT_PUBLIC_IMAGE_API_HOST;
    const IMG_KEY = process.env.IMAGE_API_KEY;
    const IMG_TENANT = process.env.IMAGE_TENANT_ID;

    if (!DS_KEY || !IMG_HOST || !IMG_KEY) {
      throw new Error('环境变量缺失，请检查 .env.local');
    }

    // 2. 准备参考图 (狗蛋的照片)
    // 我们取 IP_LIBRARY 里的前 1-2 张图作为“长相参考”
    // 假设 IP_LIBRARY 里的 src 是相对路径，我们需要拼接成绝对路径
    const publicHost = process.env.NEXT_PUBLIC_HOST || 'https://onion-final-smlp.vercel.app';
    const referenceImages = IP_LIBRARY.slice(0, 2).map(img => {
      if (img.src.startsWith('http')) return img.src;
      return `${publicHost}${img.src}`;
    });

    console.log(`🐶 [1/2] 正在让 DeepSeek 设计狗蛋的动作 (中文)...`);

    // =====================================================
    // 第一步：DeepSeek 设计动作 (中文)
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
        temperature: 0.8 // 稍微高一点，让姿态更丰富
      })
    });

    if (!dsResponse.ok) throw new Error('DeepSeek 调用失败');

    const dsData = await dsResponse.json();
    const actionPrompt = dsData.choices?.[0]?.message?.content || "";
    const cleanPrompt = actionPrompt.replace(/[\n\r]/g, " ").trim();

    console.log(`✨ 动作设计: ${cleanPrompt}`);

    // =====================================================
    // 第二步：NanoBanana 图生图 (Compositions)
    // =====================================================
    console.log(`🎨 [2/2] 正在绘制狗蛋... (参考图数量: ${referenceImages.length})`);

    // 映射比例
    let ratio = "1:1";
    if (aspectRatio === '16:9') ratio = "16:9";
    if (aspectRatio === '9:16') ratio = "9:16";
    if (aspectRatio === '3:4') ratio = "3:4";

    const imgPayload = {
      model: "nanobananapro",
      prompt: cleanPrompt, // 中文动作描述
      images: referenceImages, // 👈 关键：传狗蛋的照片过去！
      ratio: ratio,
      // resolution: "4k", // ❌ 不传这个参数，默认就是 2K 左右，速度快且够用
    };

    // 注意：这里接口地址变成了 /v3/images/compositions
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
      throw new Error(`生图失败: ${imgResponse.status}`);
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}