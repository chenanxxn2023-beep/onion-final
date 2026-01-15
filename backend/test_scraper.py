"""
Test script for trend scrapers
Run: python test_scraper.py
"""

from trend_service import (
    fetch_weibo_trends,
    fetch_baidu_trends,
    fetch_zhihu_trends,
    fetch_360_trends,
)

def test_single_source(name: str, scraper_func):
    """Test a single scraper"""
    print("\n" + "=" * 60)
    print(f"Testing {name} Scraper")
    print("=" * 60)
    
    try:
        trends = scraper_func()
        
        if trends:
            print(f"✅ Success! Found {len(trends)} trends\n")
            print("Sample results:")
            for i, trend in enumerate(trends[:3], 1):
                k12_badge = "🎓" if trend.is_k12_related else "  "
                print(f"{i}. {k12_badge} {trend.title[:50]}")
                print(f"   URL: {trend.url[:60]}")
        else:
            print(f"⚠️ No trends found (scraper might need update)")
            
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    print("\n🧅 洋葱热点灵感捕手 - Scraper Test Suite")
    print("=" * 60)
    
    # Test each source individually
    test_single_source("Weibo", fetch_weibo_trends)
    test_single_source("Baidu", fetch_baidu_trends)
    test_single_source("Zhihu", fetch_zhihu_trends)
    test_single_source("360", fetch_360_trends)
    
    print("\n" + "=" * 60)
    print("Test complete!")
    print("=" * 60 + "\n")
