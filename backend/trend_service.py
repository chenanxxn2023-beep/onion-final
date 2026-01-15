"""
洋葱热点灵感捕手 - 多源热搜聚合服务
Onion Daily Trend Catcher - Multi-Source Trend Aggregator

Supports: Weibo, Baidu, Zhihu, 360 Search
"""

import requests
from bs4 import BeautifulSoup
from typing import List, Dict, Optional
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import time
import json
import re

# ============================================
# Configuration
# ============================================

# Common Chrome User-Agent to bypass basic checks
CHROME_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)

# Request timeout in seconds
REQUEST_TIMEOUT = 10

# Max items per source
MAX_ITEMS_PER_SOURCE = 15

# K12 Education Keywords for prioritization
K12_KEYWORDS = [
    "教育", "考试", "清华", "北大", "小学", "初中", "高中",
    "数学", "英语", "物理", "化学", "生物", "语文", "历史", "地理",
    "假期", "学习", "家长", "孩子", "学生", "老师", "学校",
    "中考", "高考", "升学", "作业", "补习", "课程", "教材",
    "幼儿园", "大学", "研究生", "博士", "留学", "奖学金"
]


# ============================================
# Data Models
# ============================================

@dataclass
class TrendItem:
    id: str
    title: str
    url: str
    source: str  # 'weibo' | 'baidu' | 'zhihu' | '360'
    category: str = "24h"
    hot_score: int = 0
    is_k12_related: bool = False

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "title": self.title,
            "url": self.url,
            "source": self.source,
            "category": self.category,
            "hot_score": self.hot_score,
            "is_k12_related": self.is_k12_related,
        }


def generate_id(source: str, title: str) -> str:
    """Generate unique ID based on source and title hash"""
    hash_str = hashlib.md5(title.encode()).hexdigest()[:8]
    prefix = {"weibo": "wb", "baidu": "bd", "zhihu": "zh", "360": "so"}.get(source, "xx")
    return f"{prefix}_{hash_str}"


def check_k12_related(title: str) -> bool:
    """Check if title contains K12 education keywords"""
    return any(keyword in title for keyword in K12_KEYWORDS)


def get_headers(referer: Optional[str] = None) -> Dict[str, str]:
    """Get common request headers"""
    headers = {
        "User-Agent": CHROME_USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Cache-Control": "max-age=0",
    }
    if referer:
        headers["Referer"] = referer
    return headers


# ============================================
# Source A: Weibo Hot Search (微博热搜)
# ============================================

def fetch_weibo_trends() -> List[TrendItem]:
    """
    Fetch trending topics from Weibo Hot Search
    URL: https://s.weibo.com/top/summary
    """
    print("📡 Fetching Weibo trends...")
    trends = []
    
    try:
        url = "https://s.weibo.com/top/summary"
        headers = get_headers(referer="https://s.weibo.com/")
        
        response = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        response.encoding = 'utf-8'
        
        soup = BeautifulSoup(response.text, features='lxml')
        
        # Find hot search items - they are in td.td-02 > a
        items = soup.select('td.td-02 > a')
        
        for idx, item in enumerate(items[:MAX_ITEMS_PER_SOURCE]):
            title = item.get_text(strip=True)
            href = item.get('href', '')
            
            # Skip empty titles
            if not title:
                continue
            
            # Build full URL
            if href.startswith('/'):
                full_url = f"https://s.weibo.com{href}"
            elif not href.startswith('http'):
                full_url = f"https://s.weibo.com/weibo?q={title}"
            else:
                full_url = href
            
            trend = TrendItem(
                id=generate_id("weibo", title),
                title=title,
                url=full_url,
                source="weibo",
                category="24h",
                hot_score=MAX_ITEMS_PER_SOURCE - idx,
                is_k12_related=check_k12_related(title)
            )
            trends.append(trend)
        
        print(f"✅ Weibo: Found {len(trends)} trends")
        
    except requests.RequestException as e:
        print(f"❌ Weibo fetch failed: {e}")
    except Exception as e:
        print(f"❌ Weibo parse error: {e}")
    
    return trends


# ============================================
# Source B: Baidu Hot Search (百度热搜)
# ============================================

def fetch_baidu_trends() -> List[TrendItem]:
    """
    Fetch trending topics from Baidu Hot Search
    URL: https://top.baidu.com/board?tab=realtime
    """
    print("📡 Fetching Baidu trends...")
    trends = []
    
    try:
        url = "https://top.baidu.com/board?tab=realtime"
        headers = get_headers(referer="https://www.baidu.com/")
        
        response = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        response.encoding = 'utf-8'
        
        soup = BeautifulSoup(response.text, features='lxml')
        
        # Baidu uses div.c-single-text-ellipsis for titles in their cards
        # The structure may vary, try multiple selectors
        items = soup.select('.content_1YWBm .c-single-text-ellipsis')
        
        if not items:
            # Fallback selector - try finding title divs
            items = soup.select('[class*="title"] .c-single-text-ellipsis')
        
        if not items:
            # Another fallback - look for category-wrap items
            items = soup.select('.category-wrap_iQLoo a[href*="rsv_dl=fyb"]')
        
        for idx, item in enumerate(items[:MAX_ITEMS_PER_SOURCE]):
            title = item.get_text(strip=True)
            
            if not title:
                continue
            
            # Try to find the parent link
            parent_link = item.find_parent('a')
            if parent_link:
                href = parent_link.get('href', '')
            else:
                href = f"https://www.baidu.com/s?wd={title}"
            
            # Ensure full URL
            if href and not href.startswith('http'):
                href = f"https://www.baidu.com{href}" if href.startswith('/') else f"https://www.baidu.com/s?wd={title}"
            
            trend = TrendItem(
                id=generate_id("baidu", title),
                title=title,
                url=href or f"https://www.baidu.com/s?wd={title}",
                source="baidu",
                category="24h",
                hot_score=MAX_ITEMS_PER_SOURCE - idx,
                is_k12_related=check_k12_related(title)
            )
            trends.append(trend)
        
        print(f"✅ Baidu: Found {len(trends)} trends")
        
    except requests.RequestException as e:
        print(f"❌ Baidu fetch failed: {e}")
    except Exception as e:
        print(f"❌ Baidu parse error: {e}")
    
    return trends


# ============================================
# Source C: Zhihu Hot List (知乎热榜)
# ============================================

def fetch_zhihu_trends() -> List[TrendItem]:
    """
    Fetch trending topics from Zhihu Hot List
    Strategy 1: Try new API endpoint (api.zhihu.com)
    Strategy 2: Fallback to HTML scraping (www.zhihu.com/billboard)
    """
    print("📡 Fetching Zhihu trends...")
    trends = []
    
    # Strategy 1: Try the new API endpoint
    try:
        url = "https://api.zhihu.com/topstory/hot-list?limit=50"
        headers = get_headers(referer="https://www.zhihu.com/hot")
        headers["Accept"] = "application/json"
        
        response = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        
        data = response.json()
        items = data.get('data', [])
        
        for idx, item in enumerate(items[:MAX_ITEMS_PER_SOURCE]):
            target = item.get('target', {})
            title = target.get('title', '')
            
            if not title:
                continue
            
            # Build URL based on item type
            item_id = target.get('id', '')
            item_type = target.get('type', 'question')
            
            if item_type == 'answer':
                question_id = target.get('question', {}).get('id', item_id)
                item_url = f"https://www.zhihu.com/question/{question_id}/answer/{item_id}"
            else:
                item_url = target.get('url', f"https://www.zhihu.com/question/{item_id}")
            
            # Normalize URL
            if item_url.startswith('//'):
                item_url = f"https:{item_url}"
            elif not item_url.startswith('http'):
                item_url = f"https://www.zhihu.com/question/{item_id}"
            
            trend = TrendItem(
                id=generate_id("zhihu", title),
                title=title,
                url=item_url,
                source="zhihu",
                category="24h",
                hot_score=MAX_ITEMS_PER_SOURCE - idx,
                is_k12_related=check_k12_related(title)
            )
            trends.append(trend)
        
        print(f"✅ Zhihu API: Found {len(trends)} trends")
        return trends
        
    except Exception as api_error:
        print(f"⚠️ Zhihu API failed: {api_error}")
        print("🔄 Trying HTML scraping fallback...")
    
    # Strategy 2: Fallback to HTML scraping
    try:
        url = "https://www.zhihu.com/billboard"
        headers = get_headers(referer="https://www.zhihu.com/")
        
        response = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        response.encoding = 'utf-8'
        
        soup = BeautifulSoup(response.text, features='lxml')
        
        # Try multiple selectors for Zhihu hot list items
        # Method 1: Look for HotList-item class
        items = soup.select('.HotList-item')
        
        if not items:
            # Method 2: Look for Billboard-item class
            items = soup.select('.Billboard-item')
        
        if not items:
            # Method 3: Try to find script with initialData
            scripts = soup.find_all('script')
            for script in scripts:
                if script.string and 'initialData' in script.string:
                    # Try to extract JSON data
                    try:
                        # Find JSON structure in script
                        match = re.search(r'initialData\s*=\s*({.*?});', script.string, re.DOTALL)
                        if match:
                            json_data = json.loads(match.group(1))
                            hot_list = json_data.get('initialState', {}).get('topstory', {}).get('hotList', [])
                            
                            for idx, item in enumerate(hot_list[:MAX_ITEMS_PER_SOURCE]):
                                target = item.get('target', {})
                                title = target.get('title', '')
                                item_id = target.get('id', '')
                                
                                if not title:
                                    continue
                                
                                trend = TrendItem(
                                    id=generate_id("zhihu", title),
                                    title=title,
                                    url=f"https://www.zhihu.com/question/{item_id}",
                                    source="zhihu",
                                    category="24h",
                                    hot_score=MAX_ITEMS_PER_SOURCE - idx,
                                    is_k12_related=check_k12_related(title)
                                )
                                trends.append(trend)
                            
                            if trends:
                                print(f"✅ Zhihu HTML (initialData): Found {len(trends)} trends")
                                return trends
                    except:
                        pass
        
        # If we found items with selectors
        for idx, item in enumerate(items[:MAX_ITEMS_PER_SOURCE]):
            # Try to find title and link
            title_elem = item.select_one('.HotList-itemTitle, .Billboard-itemTitle, a')
            
            if not title_elem:
                continue
            
            title = title_elem.get_text(strip=True)
            href = title_elem.get('href', '') if title_elem.name == 'a' else ''
            
            # Find link if title element is not a link
            if not href:
                link_elem = item.select_one('a')
                if link_elem:
                    href = link_elem.get('href', '')
            
            if not title:
                continue
            
            # Build full URL
            if href.startswith('/'):
                full_url = f"https://www.zhihu.com{href}"
            elif href.startswith('//'):
                full_url = f"https:{href}"
            elif not href.startswith('http'):
                # Try to extract question ID from title
                full_url = f"https://www.zhihu.com/search?q={title}"
            else:
                full_url = href
            
            trend = TrendItem(
                id=generate_id("zhihu", title),
                title=title,
                url=full_url,
                source="zhihu",
                category="24h",
                hot_score=MAX_ITEMS_PER_SOURCE - idx,
                is_k12_related=check_k12_related(title)
            )
            trends.append(trend)
        
        print(f"✅ Zhihu HTML: Found {len(trends)} trends")
        
    except requests.RequestException as e:
        print(f"❌ Zhihu HTML fetch failed: {e}")
    except Exception as e:
        print(f"❌ Zhihu HTML parse error: {e}")
    
    return trends


# ============================================
# Source D: 360 Hot Search (360热搜 - Backup)
# ============================================

def fetch_360_trends() -> List[TrendItem]:
    """
    Fetch trending topics from 360 Hot News
    URL: https://news.so.com/hotnews
    Simple HTML structure, good backup source
    """
    print("📡 Fetching 360 trends...")
    trends = []
    
    try:
        url = "https://news.so.com/hotnews"
        headers = get_headers(referer="https://news.so.com/")
        
        response = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        response.encoding = 'utf-8'
        
        soup = BeautifulSoup(response.text, features='lxml')
        
        # 360 news uses ul.list > li > a structure
        items = soup.select('ul.list li a')
        
        if not items:
            # Fallback: look for news-title class
            items = soup.select('.news-title a, .title a, [class*="hot"] a')
        
        seen_titles = set()
        
        for idx, item in enumerate(items):
            if len(trends) >= MAX_ITEMS_PER_SOURCE:
                break
                
            title = item.get_text(strip=True)
            href = item.get('href', '')
            
            # Skip empty or duplicate titles
            if not title or title in seen_titles:
                continue
            
            seen_titles.add(title)
            
            # Build full URL
            if href.startswith('//'):
                full_url = f"https:{href}"
            elif href.startswith('/'):
                full_url = f"https://news.so.com{href}"
            elif not href.startswith('http'):
                full_url = f"https://www.so.com/s?q={title}"
            else:
                full_url = href
            
            trend = TrendItem(
                id=generate_id("360", title),
                title=title,
                url=full_url,
                source="360",
                category="24h",
                hot_score=MAX_ITEMS_PER_SOURCE - len(trends),
                is_k12_related=check_k12_related(title)
            )
            trends.append(trend)
        
        print(f"✅ 360: Found {len(trends)} trends")
        
    except requests.RequestException as e:
        print(f"❌ 360 fetch failed: {e}")
    except Exception as e:
        print(f"❌ 360 parse error: {e}")
    
    return trends


# ============================================
# Main Aggregator
# ============================================

def fetch_china_trends(parallel: bool = True) -> List[Dict]:
    """
    Fetch and aggregate trends from all Chinese sources
    
    Args:
        parallel: If True, fetch all sources in parallel using ThreadPoolExecutor
        
    Returns:
        List of trend dictionaries, sorted by relevance and hot score
    """
    print("\n" + "=" * 50)
    print("🚀 Starting China Trends Aggregation...")
    print("=" * 50 + "\n")
    
    start_time = time.time()
    all_trends: List[TrendItem] = []
    
    scrapers = [
        ("weibo", fetch_weibo_trends),
        ("baidu", fetch_baidu_trends),
        ("zhihu", fetch_zhihu_trends),
        ("360", fetch_360_trends),
    ]
    
    if parallel:
        # Parallel execution for better performance
        with ThreadPoolExecutor(max_workers=4) as executor:
            future_to_source = {
                executor.submit(scraper): source 
                for source, scraper in scrapers
            }
            
            for future in as_completed(future_to_source):
                source = future_to_source[future]
                try:
                    trends = future.result()
                    all_trends.extend(trends)
                except Exception as e:
                    print(f"❌ {source} scraper crashed: {e}")
    else:
        # Sequential execution (for debugging)
        for source, scraper in scrapers:
            try:
                trends = scraper()
                all_trends.extend(trends)
            except Exception as e:
                print(f"❌ {source} scraper crashed: {e}")
    
    # Sort: K12-related first, then by hot_score
    all_trends.sort(key=lambda x: (not x.is_k12_related, -x.hot_score))
    
    elapsed = time.time() - start_time
    
    print("\n" + "=" * 50)
    print(f"✨ Aggregation Complete!")
    print(f"📊 Total trends: {len(all_trends)}")
    print(f"🎓 K12-related: {sum(1 for t in all_trends if t.is_k12_related)}")
    print(f"⏱️ Time elapsed: {elapsed:.2f}s")
    print("=" * 50 + "\n")
    
    # Convert to dict format for JSON response
    return [trend.to_dict() for trend in all_trends]


def fetch_trends_by_source(source: str) -> List[Dict]:
    """Fetch trends from a specific source"""
    scrapers = {
        "weibo": fetch_weibo_trends,
        "baidu": fetch_baidu_trends,
        "zhihu": fetch_zhihu_trends,
        "360": fetch_360_trends,
    }
    
    scraper = scrapers.get(source)
    if not scraper:
        raise ValueError(f"Unknown source: {source}")
    
    trends = scraper()
    return [trend.to_dict() for trend in trends]


# ============================================
# CLI Testing
# ============================================

if __name__ == "__main__":
    # Test the aggregator
    trends = fetch_china_trends(parallel=True)
    
    print("\n📋 Sample Results:")
    print("-" * 50)
    
    for i, trend in enumerate(trends[:20]):
        k12_badge = "🎓" if trend.get("is_k12_related") else "  "
        source_badge = {
            "weibo": "🔴",
            "baidu": "🔵", 
            "zhihu": "🟢",
            "360": "🟠"
        }.get(trend.get("source"), "⚪")
        
        print(f"{i+1:2}. {source_badge} {k12_badge} [{trend.get('source'):6}] {trend.get('title')[:40]}")
    
    print("-" * 50)
    print(f"Total: {len(trends)} trends")
