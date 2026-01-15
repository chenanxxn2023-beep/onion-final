"""
洋葱热点灵感捕手 - FastAPI Backend
Onion Daily Trend Catcher - API Server

Run with: uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional
import time

from trend_service import (
    fetch_china_trends,
    fetch_trends_by_source,
    K12_KEYWORDS
)

# ============================================
# FastAPI App Setup
# ============================================

app = FastAPI(
    title="洋葱热点灵感捕手 API",
    description="Multi-source China trends aggregator for K12 content creation",
    version="1.0.0",
)

# CORS Configuration - Allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# API Endpoints
# ============================================

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "洋葱热点灵感捕手 API",
        "version": "1.0.0",
        "endpoints": [
            "/api/trends",
            "/api/trends/{source}",
            "/api/health",
        ]
    }


@app.get("/api/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "sources": ["weibo", "baidu", "zhihu", "360"],
    }


@app.get("/api/trends")
async def get_trends(
    limit: int = Query(default=50, ge=1, le=100, description="Max number of trends to return"),
    k12_only: bool = Query(default=False, description="Return only K12-related trends"),
    source: Optional[str] = Query(default=None, description="Filter by source (weibo/baidu/zhihu/360)"),
):
    """
    Fetch aggregated trends from all Chinese sources
    
    - **limit**: Maximum number of trends to return (1-100)
    - **k12_only**: If true, return only education-related trends
    - **source**: Optional filter by specific source
    """
    try:
        # Fetch all trends
        if source:
            # Fetch from specific source only
            valid_sources = ["weibo", "baidu", "zhihu", "360"]
            if source not in valid_sources:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid source. Must be one of: {valid_sources}"
                )
            trends = fetch_trends_by_source(source)
        else:
            # Fetch from all sources
            trends = fetch_china_trends(parallel=True)
        
        # Filter K12 only if requested
        if k12_only:
            trends = [t for t in trends if t.get("is_k12_related", False)]
        
        # Apply limit
        trends = trends[:limit]
        
        return {
            "success": True,
            "count": len(trends),
            "data": trends,
            "meta": {
                "sources": ["weibo", "baidu", "zhihu", "360"] if not source else [source],
                "k12_filtered": k12_only,
                "timestamp": time.time(),
            }
        }
        
    except Exception as e:
        print(f"❌ API Error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch trends: {str(e)}"
        )


@app.get("/api/trends/{source}")
async def get_trends_by_source(
    source: str,
    limit: int = Query(default=15, ge=1, le=50),
):
    """
    Fetch trends from a specific source
    
    - **source**: One of: weibo, baidu, zhihu, 360
    - **limit**: Maximum number of trends to return
    """
    valid_sources = ["weibo", "baidu", "zhihu", "360"]
    
    if source not in valid_sources:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid source '{source}'. Must be one of: {valid_sources}"
        )
    
    try:
        trends = fetch_trends_by_source(source)
        trends = trends[:limit]
        
        return {
            "success": True,
            "source": source,
            "count": len(trends),
            "data": trends,
        }
        
    except Exception as e:
        print(f"❌ API Error for {source}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch {source} trends: {str(e)}"
        )


@app.get("/api/keywords")
async def get_k12_keywords():
    """Get the list of K12 keywords used for filtering"""
    return {
        "keywords": K12_KEYWORDS,
        "count": len(K12_KEYWORDS),
    }


# ============================================
# Error Handlers
# ============================================

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": str(exc),
            "message": "An unexpected error occurred"
        }
    )


# ============================================
# Run Server
# ============================================

if __name__ == "__main__":
    import uvicorn
    
    print("\n" + "=" * 50)
    print("🧅 洋葱热点灵感捕手 API Server")
    print("=" * 50)
    print("Starting server on http://localhost:8000")
    print("API Docs: http://localhost:8000/docs")
    print("=" * 50 + "\n")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
