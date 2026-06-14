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
    """
    Returns per-asset-class stats computed from the market_returns table:
    mean, std dev, best year, worst year, positive years, and full
    year-by-year history for charting.
    """
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

    # Core assets
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

    # Extra global indices
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