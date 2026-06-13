import httpx
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/inflation", tags=["Inflation"])

# Countries we support
SUPPORTED_COUNTRIES = {
    "GB": {"name": "United Kingdom", "currency": "£", "flag": "🇬🇧"},
    "US": {"name": "United States",  "currency": "$", "flag": "🇺🇸"},
    "EU": {"name": "Euro Area",      "currency": "€", "flag": "🇪🇺"},
    "CA": {"name": "Canada",         "currency": "$", "flag": "🇨🇦"},
    "AU": {"name": "Australia",      "currency": "$", "flag": "🇦🇺"},
    "IN": {"name": "India",          "currency": "₹", "flag": "🇮🇳"},
    "JP": {"name": "Japan",          "currency": "¥", "flag": "🇯🇵"},
    "SG": {"name": "Singapore",      "currency": "$", "flag": "🇸🇬"},
}

# World Bank uses different codes for some regions
WB_CODE_MAP = {
    "GB": "GB",
    "US": "US",
    "EU": "XC",   # World Bank code for Euro Area
    "CA": "CA",
    "AU": "AU",
    "IN": "IN",
    "JP": "JP",
    "SG": "SG",
}

WB_BASE = "https://api.worldbank.org/v2"
INDICATOR = "FP.CPI.TOTL.ZG"


async def fetch_inflation(wb_code: str) -> float | None:
    url = f"{WB_BASE}/country/{wb_code}/indicator/{INDICATOR}?format=json&mrnev=1"
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        data = resp.json()
        # Response is [metadata, [datapoints]]
        if not data or len(data) < 2 or not data[1]:
            return None
        value = data[1][0].get("value")
        return round(float(value), 2) if value is not None else None


@router.get("")
async def get_all_inflation():
    """
    Returns latest CPI inflation figures for all supported countries.
    Fetches from World Bank API — no API key required.
    """
    results = {}
    for code, meta in SUPPORTED_COUNTRIES.items():
        wb_code = WB_CODE_MAP[code]
        try:
            rate = await fetch_inflation(wb_code)
            results[code] = {
                **meta,
                "inflation_rate": rate,        # annual % e.g. 3.2
                "inflation_decimal": round(rate / 100, 4) if rate else None,  # 0.032
            }
        except Exception:
            results[code] = {
                **meta,
                "inflation_rate": None,
                "inflation_decimal": None,
            }
    return results


@router.get("/{country_code}")
async def get_country_inflation(country_code: str):
    """
    Returns latest CPI inflation for a single country code e.g. GB, US, EU.
    """
    code = country_code.upper()
    if code not in SUPPORTED_COUNTRIES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported country. Choose from: {list(SUPPORTED_COUNTRIES.keys())}"
        )
    wb_code = WB_CODE_MAP[code]
    try:
        rate = await fetch_inflation(wb_code)
        return {
            **SUPPORTED_COUNTRIES[code],
            "country_code": code,
            "inflation_rate": rate,
            "inflation_decimal": round(rate / 100, 4) if rate else None,
        }
    except Exception:
        raise HTTPException(status_code=503, detail="Could not fetch inflation data")