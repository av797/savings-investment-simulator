import os
import sys
import yfinance as yf
import pandas as pd
from sqlalchemy import text
from datetime import date

BOE_BASE_RATES = {
    1994: 5.50, 1995: 6.50, 1996: 6.00, 1997: 7.25, 1998: 7.25,
    1999: 5.50, 2000: 6.00, 2001: 4.00, 2002: 4.00, 2003: 3.75,
    2004: 4.75, 2005: 4.50, 2006: 5.00, 2007: 5.75, 2008: 2.00,
    2009: 0.50, 2010: 0.50, 2011: 0.50, 2012: 0.50, 2013: 0.50,
} 


TICKERS = {
    "stocks": "^GSPC",
    "bonds":  "IGLT.L",
    "etfs":   "VWRL.L",
    "cash":   "ERNS.L",
}

START_DATE = "1994-01-01"
END_DATE   = "2024-12-31"


def fetch_annual_returns(ticker: str, asset_class: str) -> pd.DataFrame:
    print(f"  Fetching {asset_class} ({ticker})...")

    try:
        data = yf.download(ticker, start=START_DATE, end=END_DATE, interval="1mo", progress=False, auto_adjust=True)

        if data.empty:
            print(f"  WARNING: No data returned for {ticker}")
            return pd.DataFrame()

        # Use Close price
        if isinstance(data.columns, pd.MultiIndex):
            prices = data["Close"][ticker]
        else:
            prices = data["Close"]

        prices = prices.dropna()

        # Compute annual returns
        annual_returns = []
        for year in range(int(START_DATE[:4]), int(END_DATE[:4]) + 1):
            year_data = prices[prices.index.year == year]
            if len(year_data) < 6:  # skip years with less than 6 months data
                continue

            start_price = year_data.iloc[0]
            end_price   = year_data.iloc[-1]
            return_pct  = ((end_price - start_price) / start_price) * 100

            annual_returns.append({
                "date":        date(year, 1, 1),
                "asset_class": asset_class,
                "return_pct":  round(float(return_pct), 4),
            })

        df = pd.DataFrame(annual_returns)
        print(f"  Got {len(df)} years of data for {asset_class}")
        return df

    except Exception as e:
        print(f"  ERROR fetching {ticker}: {e}")
        return pd.DataFrame()


def build_cash_backfill(existing_cash_df: pd.DataFrame) -> pd.DataFrame:
    """
    For years where ERNS.L has no data, use BoE base rate as cash return.
    """
    existing_years = set(existing_cash_df["date"].apply(lambda d: d.year)) if not existing_cash_df.empty else set()

    backfill_rows = []
    for year, rate in BOE_BASE_RATES.items():
        if year not in existing_years:
            backfill_rows.append({
                "date":        date(year, 1, 1),
                "asset_class": "cash",
                "return_pct":  round(rate, 4),
            })

    if backfill_rows:
        print(f"  Backfilling {len(backfill_rows)} years of cash data from BoE base rates")

    return pd.DataFrame(backfill_rows)


def seed(db_url: str = None):
    """
    Main seed function. Pulls data, merges, and inserts into market_returns.
    """
    from sqlalchemy import create_engine
    from dotenv import load_dotenv

    load_dotenv()
    url = db_url or os.getenv("DATABASE_URL")
    if not url:
        print("ERROR: DATABASE_URL not set in environment")
        sys.exit(1)

    engine = create_engine(url)

    print("\n── Fetching market data from Yahoo Finance ──\n")

    all_frames = []

    for asset_class, ticker in TICKERS.items():
        df = fetch_annual_returns(ticker, asset_class)
        if not df.empty:
            all_frames.append(df)

        # For cash, backfill missing years with BoE rates
        if asset_class == "cash":
            backfill = build_cash_backfill(df)
            if not backfill.empty:
                all_frames.append(backfill)

    if not all_frames:
        print("ERROR: No data fetched, aborting")
        sys.exit(1)

    combined = pd.concat(all_frames, ignore_index=True)
    combined = combined.sort_values(["asset_class", "date"]).reset_index(drop=True)

    print(f"\n── Inserting {len(combined)} rows into market_returns ──\n")

    with engine.begin() as conn:
        # Clear existing data
        conn.execute(text("DELETE FROM market_returns"))

        for _, row in combined.iterrows():
            conn.execute(
                text("""
                    INSERT INTO market_returns (date, asset_class, return_pct)
                    VALUES (:date, :asset_class, :return_pct)
                """),
                {
                    "date":        row["date"],
                    "asset_class": row["asset_class"],
                    "return_pct":  row["return_pct"],
                }
            )

    print(f"── Seeding complete ──\n")

    # Print summary
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT asset_class, COUNT(*) as years,
                   ROUND(AVG(return_pct)::numeric, 2) as avg_return,
                   ROUND(MIN(return_pct)::numeric, 2) as worst_year,
                   ROUND(MAX(return_pct)::numeric, 2) as best_year
            FROM market_returns
            GROUP BY asset_class
            ORDER BY asset_class
        """))

        print(f"{'Asset':<10} {'Years':<8} {'Avg %':<10} {'Worst %':<12} {'Best %'}")
        print("-" * 50)
        for row in result:
            print(f"{row[0]:<10} {row[1]:<8} {row[2]:<10} {row[3]:<12} {row[4]}")


if __name__ == "__main__":
    seed()