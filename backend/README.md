# 🧅 洋葱热点灵感捕手 - Backend API

多源中国热搜聚合服务，支持微博、百度、知乎、360搜索。

## 🚀 快速开始

### 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

### 启动服务

```bash
# 方式 1: 直接运行
python main.py

# 方式 2: 使用 uvicorn
uvicorn main:app --reload --port 8000
```

服务启动后访问：
- API 文档: http://localhost:8000/docs
- 健康检查: http://localhost:8000/api/health

## 📡 数据源

| 平台 | URL | 方式 | 备注 |
|------|-----|------|------|
| 微博热搜 | `https://s.weibo.com/top/summary` | HTML 解析 | BeautifulSoup + lxml |
| 百度热搜 | `https://top.baidu.com/board?tab=realtime` | HTML 解析 | BeautifulSoup + lxml |
| 知乎热榜 | `https://api.zhihu.com/topstory/hot-list` | JSON API | 带 HTML 降级方案 |
| 360热搜 | `https://news.so.com/hotnews` | HTML 解析 | BeautifulSoup + lxml |

## 🔌 API 端点

### GET `/api/trends`

获取聚合热搜列表

**参数:**
- `limit` (int): 返回数量上限，默认 50
- `k12_only` (bool): 仅返回教育相关热搜
- `source` (string): 指定来源 (weibo/baidu/zhihu/360)

**响应示例:**
```json
{
  "success": true,
  "count": 50,
  "data": [
    {
      "id": "wb_a1b2c3d4",
      "title": "教育部发布新规",
      "url": "https://s.weibo.com/weibo?q=教育部发布新规",
      "source": "weibo",
      "category": "24h",
      "hot_score": 15,
      "is_k12_related": true
    }
  ],
  "meta": {
    "sources": ["weibo", "baidu", "zhihu", "360"],
    "k12_filtered": false,
    "timestamp": 1705123456.789
  }
}
```

### GET `/api/trends/{source}`

获取指定平台的热搜

**路径参数:**
- `source`: weibo / baidu / zhihu / 360

### GET `/api/keywords`

获取 K12 教育关键词列表

## 🎓 K12 过滤

系统会自动识别与教育相关的热搜，关键词包括：
- 教育、考试、升学、学习
- 清华、北大、学校
- 小学、初中、高中、大学
- 数学、英语、物理、化学等学科
- 家长、孩子、学生、老师

## 🛠 测试爬虫

```bash
# 方式 1: 测试所有爬虫（推荐）
python test_scraper.py

# 方式 2: 直接测试爬虫模块
python trend_service.py
```

## ⚠️ 注意事项

1. **反爬虫**: 使用了 Chrome User-Agent 模拟浏览器访问
2. **超时处理**: 单个源失败不影响其他源
3. **并行请求**: 默认使用 ThreadPoolExecutor 并行抓取
4. **请求频率**: 建议前端缓存结果，避免频繁请求

## 📝 License

MIT - 洋葱学园内部使用
