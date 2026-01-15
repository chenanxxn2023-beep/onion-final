# 🧅 洋葱热点灵感捕手 - DeepSeek 集成配置

## 📋 完成步骤

### ✅ 步骤 1: 环境配置

**手动创建 `.env.local` 文件（项目根目录）：**

```bash
# 在项目根目录创建文件
touch .env.local
```

**添加以下内容：**

```env
# DeepSeek API Configuration
DEEPSEEK_API_KEY=sk-68af1d1391c04bf4be0929208d96692d

# Next.js API URL (for frontend)
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### ✅ 步骤 2: 安装依赖

**运行以下命令安装 OpenAI SDK：**

```bash
cd /Users/yaoyue/Desktop/测试1
npm install openai
```

或者安装所有依赖：

```bash
npm install
```

### ✅ 步骤 3: 启动服务

```bash
npm run dev
```

服务将在 http://localhost:3000 启动

## 📁 已创建的文件

```
src/
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts          # DeepSeek API 后端
│   └── select-angle/
│       └── page.tsx               # 动态分析结果页面
├── components/
│   └── wizard/
│       └── TrendDashboard.tsx     # 已更新：AI 按钮跳转
```

## 🔌 API 端点

### POST /api/analyze

**请求：**
```json
{
  "title": "教育部今日发布：2026年中考体育改革新规正式落地"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "angles": [
      {
        "title": "政策解读",
        "content": "详细分析..."
      },
      {
        "title": "家长应对",
        "content": "详细分析..."
      },
      {
        "title": "学校调整",
        "content": "详细分析..."
      }
    ]
  },
  "meta": {
    "title": "...",
    "model": "deepseek-chat",
    "timestamp": "2026-01-14T..."
  }
}
```

## 🎯 使用流程

1. **用户在首页点击新闻卡片右侧的 "AI 分析" 按钮**
2. **页面跳转到** `/select-angle?title=新闻标题`
3. **自动调用** `/api/analyze` 接口
4. **DeepSeek 分析新闻**，返回 3 个切入角度
5. **用户选择角度**，进入下一步（脚本生成）

## 🔧 DeepSeek 配置

- **Base URL**: `https://api.deepseek.com`
- **Model**: `deepseek-chat`
- **Temperature**: `0.7`
- **Max Tokens**: `1000`
- **Response Format**: `json_object` (强制 JSON 输出)

## 🎨 System Prompt 设计

```
你是一个敏锐的 K12 教育情报专家。

用户会提供一个新闻标题。请先判断该新闻的属性，然后智能匹配最适合的 3 个分析维度。

不要死板地套用固定模板。例如：
- 遇到《大学生主播》应分析"职业观与媒介素养"
- 遇到《新课标》应分析"考点变化与教学调整"
- 遇到《AI 助教》应分析"技术如何改变教学方式"

输出格式：严格的 JSON，包含 3 个角度
```

## ⚠️ 注意事项

1. **API Key 安全**：`.env.local` 已添加到 `.gitignore`，不会提交到 Git
2. **错误处理**：API 包含完整的错误处理和重试机制
3. **加载状态**：前端有 Loading、Success、Error 三种状态
4. **骨架屏**：加载时显示 3 个灰色骨架屏卡片

## 🚀 测试

### 测试 API 健康检查：

```bash
curl http://localhost:3000/api/analyze
```

### 测试分析功能：

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"title": "教育部今日发布新规"}'
```

## 📝 后续开发

- [ ] 将选中的角度传递给 Step 2（脚本生成）
- [ ] 添加分析历史记录
- [ ] 支持用户自定义分析角度
- [ ] 添加分析结果导出功能

---

🎉 DeepSeek 集成完成！现在可以开始使用 AI 智能分析功能了。
