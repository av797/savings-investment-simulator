from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
import yfinance as yf
from datetime import datetime

from backend.db.database import get_db

router = APIRouter(prefix="/markets", tags=["Markets"])

TICKERS = {
    "stocks": {
        "ticker":      "^GSPC",
        "name":        "S&P 500",
        "description": "US large-cap equities",
        "color":       "#60a5fa",
    },
    "etfs": {
        "ticker":      "VWRL.L",
        "name":        "FTSE All-World (VWRL)",
        "description": "Global diversified ETF",
        "color":       "#a78bfa",
    },
    "bonds": {
        "ticker":      "IGLT.L",
        "name":        "UK Gilts (IGLT)",
        "description": "UK government bonds",
        "color":       "#fbbf24",
    },
    "cash": {
        "ticker":      "ERNS.L",
        "name":        "Cash (ERNS)",
        "description": "UK savings rate proxy",
        "color":       "#9ca3af",
    },
}

EXTRA_INDICES = {
    "FTSE 100":  "^FTSE",
    "Nasdaq":    "^IXIC",
    "DAX":       "^GDAXI",
    "Nikkei":    "^N225",
    "Hang Seng": "^HSI",
}


#Summary stats from DB

@router.get("/summary")
def get_market_summary(db: Session = Depends(get_db)):

    stats_rows = db.execute(text("""
        SELECT
            asset_class,
            ROUND(AVG(return_pct)::numeric, 2)    AS mean_return,
            ROUND(STDDEV(return_pct)::numeric, 2) AS volatility,
            ROUND(MAX(return_pct)::numeric, 2)    AS best_year,
            ROUND(MIN(return_pct)::numeric, 2)    AS worst_year,
            COUNT(*)                               AS years_of_data,
            SUM(CASE WHEN return_pct > 0 THEN 1 ELSE 0 END) AS positive_years
        FROM market_returns
        GROUP BY asset_class
        ORDER BY asset_class
    """)).fetchall()

    history_rows = db.execute(text("""
        SELECT asset_class, date, return_pct
        FROM market_returns
        ORDER BY asset_class, date
    """)).fetchall()

    # Build history dict per asset class
    history: dict = {}
    for row in history_rows:
        ac = row[0]
        if ac not in history:
            history[ac] = []
        history[ac].append({
            "year":       int(str(row[1])[:4]),
            "return_pct": float(row[2]),
        })

    cumulative: dict = {}
    for ac, yearly in history.items():
        value = 100.0
        series = []
        for entry in yearly:
            value = value * (1 + entry["return_pct"] / 100)
            series.append({
                "year":  entry["year"],
                "value": round(value, 2),
            })
        cumulative[ac] = series

    summary = {}
    for row in stats_rows:
        ac = row[0]
        years = int(row[5])
        pos   = int(row[6])
        summary[ac] = {
            **TICKERS.get(ac, {}),
            "asset_class":    ac,
            "mean_return":    float(row[1]),
            "volatility":     float(row[2]),
            "best_year":      float(row[3]),
            "worst_year":     float(row[4]),
            "years_of_data":  years,
            "positive_years": pos,
            "positive_pct":   round((pos / years) * 100, 1) if years else 0,
            "history":        history.get(ac, []),
            "cumulative":     cumulative.get(ac, []),
        }

    return summary


#Live prices via yfinance

@router.get("/live")
def get_live_prices():
    results = {}

    for asset_class, meta in TICKERS.items():
        try:
            ticker = yf.Ticker(meta["ticker"])
            info   = ticker.fast_info
            price  = round(float(info.last_price), 2)         if info.last_price  else None
            prev   = round(float(info.previous_close), 2)     if info.previous_close else None
            change     = round(price - prev, 2)               if price and prev else None
            change_pct = round((change / prev) * 100, 2)      if change and prev else None

            results[asset_class] = {
                **meta,
                "price":      price,
                "prev_close": prev,
                "change":     change,
                "change_pct": change_pct,
                "as_of":      datetime.utcnow().isoformat(),
            }
        except Exception:
            results[asset_class] = {
                **meta,
                "price":      None,
                "change_pct": None,
                "error":      "Could not fetch",
            }

    indices = {}
    for name, symbol in EXTRA_INDICES.items():
        try:
            ticker = yf.Ticker(symbol)
            info   = ticker.fast_info
            price  = round(float(info.last_price), 2)     if info.last_price     else None
            prev   = round(float(info.previous_close), 2) if info.previous_close else None
            change_pct = round(((price - prev) / prev) * 100, 2) if price and prev else None

            indices[name] = {
                "symbol":     symbol,
                "price":      price,
                "change_pct": change_pct,
            }
        except Exception:
            indices[name] = {"symbol": symbol, "price": None, "change_pct": None}

    return {"assets": results, "indices": indices}


#Per-asset detail

@router.get("/detail/{asset_class}")
def get_asset_detail(asset_class: str, db: Session = Depends(get_db)):

    if asset_class not in TICKERS:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Unknown asset class")

    meta   = TICKERS[asset_class]
    symbol = meta["ticker"]

    ticker = yf.Ticker(symbol)
    info   = ticker.info or {}
    fast   = ticker.fast_info

    price      = round(float(fast.last_price), 2)     if fast.last_price     else None
    prev       = round(float(fast.previous_close), 2) if fast.previous_close else None
    change_pct = round(((price - prev) / prev) * 100, 2) if price and prev  else None

    detail = {
        "asset_class":   asset_class,
        "ticker":        symbol,
        "name":          info.get("longName") or meta["name"],
        "description":   info.get("longBusinessSummary") or meta["description"],
        "price":         price,
        "change_pct":    change_pct,
        "currency":      info.get("currency"),
        "exchange":      info.get("exchange") or info.get("fullExchangeName"),
        "pe_ratio":      info.get("trailingPE"),
        "forward_pe":    info.get("forwardPE"),
        "market_cap":    info.get("marketCap"),
        "week_52_high":  info.get("fiftyTwoWeekHigh") or fast.year_high,
        "week_52_low":   info.get("fiftyTwoWeekLow")  or fast.year_low,
        "ytd_return":    info.get("ytdReturn"),
        "beta":          info.get("beta") or info.get("beta3Year"),
        "total_assets":  info.get("totalAssets"),
        "expense_ratio": info.get("annualReportExpenseRatio") or info.get("expenseRatio"),
        "nav_price":     info.get("navPrice"),
        "yield":         info.get("yield") or info.get("dividendYield"),
        "top_holdings":  [],
        "news":          [],
        "correlations":  {},
    }

    #Top holdings
    try:
        holdings = ticker.funds_data.top_holdings if hasattr(ticker, "funds_data") else None
        if holdings is not None and not holdings.empty:
            detail["top_holdings"] = [
                {
                    "name":   row.get("holdingName", str(idx)),
                    "weight": round(float(row.get("holdingPercent", 0)) * 100, 2),
                }
                for idx, row in holdings.head(8).iterrows()
            ]
    except Exception:
        pass

    #News headlines
    try:
        news_items = ticker.news or []
        detail["news"] = [
            {
                "title":     n.get("content", {}).get("title", "")                                    if isinstance(n.get("content"), dict) else n.get("title", ""),
                "publisher": n.get("content", {}).get("provider", {}).get("displayName", "")         if isinstance(n.get("content"), dict) else n.get("publisher", ""),
                "url":       n.get("content", {}).get("canonicalUrl", {}).get("url", "")             if isinstance(n.get("content"), dict) else n.get("link", ""),
            }
            for n in news_items[:6]
        ]
    except Exception:
        pass

    try:
        rows = db.execute(text("""
            SELECT asset_class, date, return_pct
            FROM market_returns
            ORDER BY asset_class, date
        """)).fetchall()

        from collections import defaultdict
        import statistics

        series: dict = defaultdict(dict)
        for row in rows:
            series[row[0]][str(row[1])[:4]] = float(row[2])

        base = series.get(asset_class, {})
        for other_ac, other_series in series.items():
            if other_ac == asset_class:
                continue
            shared = sorted(set(base.keys()) & set(other_series.keys()))
            if len(shared) < 5:
                continue
            x  = [base[y] for y in shared]
            y  = [other_series[y] for y in shared]
            mx = sum(x) / len(x)
            my = sum(y) / len(y)
            num = sum((a - mx) * (b - my) for a, b in zip(x, y))
            den = (sum((a - mx) ** 2 for a in x) * sum((b - my) ** 2 for b in y)) ** 0.5
            detail["correlations"][other_ac] = round(num / den, 2) if den else 0
    except Exception:
        pass

    return detail