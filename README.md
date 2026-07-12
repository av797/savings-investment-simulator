# GoalIQ

**GoalIQ** is a goal-based financial planning web app that lets you simulate your savings and investment strategy using 30 years of real market data. Set financial goals, model your asset allocation, and run Monte Carlo simulations to see the range of outcomes — not just a single optimistic number.

Live at: [savings-investment-simulator.vercel.app](https://savings-investment-simulator.vercel.app)

---

## What it does

**Goal planning**
- Create financial goals (house deposit, retirement, emergency fund, education, travel, or custom)
- Set a target amount, monthly contribution, time horizon, and inflation rate — pre-filled from live World Bank CPI data for your country
- Track progress toward each goal as you update your current balance

**Monte Carlo simulation**
- Runs 10,000 scenarios using bootstrap resampling from real historical annual returns
- Uses actual data from Yahoo Finance (S&P 500, FTSE All-World, UK Gilts, Cash/ERNS) going back 30 years including crash years like 2008, 2020, and 2022
- Returns a success rate, median outcome, worst 10% and best 10% outcome, and a year-by-year fan chart

**Asset allocation**
- Split your monthly contribution across stocks, ETFs, bonds, and cash using sliders
- AI-powered split suggestion using a Random Forest model trained on real market simulation outcomes — takes into account your age, income, risk profile, goal type, and timeline
- Expected return overrides per asset class if you want to customise assumptions

**What-if sandbox**
- Drag sliders to see how increasing your monthly contribution or extending your timeline affects outcomes — backed by the same real Monte Carlo engine, not approximations
- Results update in near real-time with an 80ms debounce, not saved to history

**AI analysis**
- Per-goal analysis powered by Groq (Llama 3.3 70B) that calculates the minimum extra monthly contribution needed to hit a 75% success rate via binary search
- Suggests a better asset allocation if the ML model finds one that improves success rate by more than 5%
- Natural language summary of what to do and why

**Contribution schedule**
- Year-by-year breakdown of what you need to contribute to stay on the median path to your target
- Required monthly drops over time as compounding does more of the work
- Combined view across all goals on the report page — one row per year, one column per goal, plus totals
- Export as a single CSV covering all goals

**Retirement age projection**
- For retirement goals specifically, scans the simulation's median yearly balance trajectory to find the first year it crosses the target
- Shows projected retirement age with an early/late badge compared to your stated timeline
- Falls back to a shortfall estimate if the median path never reaches the target within the plan

**Markets page**
- 30-year historical stats (average return, volatility, best/worst year, positive year %) for each asset class
- Cumulative growth chart showing £100 invested in 1994
- Annual returns bar chart per asset
- Live prices via Yahoo Finance
- Per-asset detail panel with key stats, top holdings, correlations, and latest news
- News tab aggregated across all asset classes

**AI chatbot**
- Context-aware assistant that reads your actual goals, simulation results, and market data
- Knows your success rates, allocations, and portfolio details — not a generic chatbot
- Powered by Groq (Llama 3.3 70B)

**Auth and user profile**
- JWT-based authentication with bcrypt password hashing
- Risk profile, age, and monthly income stored and used across the app for personalisation
- Profile photo upload (base64)
- Disclaimer modal on first signup

---

## Tech stack

**Frontend**
- React 19 + Vite
- React Router v7
- Tailwind CSS
- Recharts (data visualisation)
- Axios

**Backend**
- FastAPI (Python)
- SQLAlchemy ORM
- Pydantic v2
- python-jose (JWT)
- passlib + bcrypt (password hashing)
- Groq SDK (LLM)
- scikit-learn (Random Forest split suggestion model)
- yfinance (market data)
- httpx (World Bank inflation API)

**Database**
- PostgreSQL (Neon — serverless)

**Infrastructure**
- Frontend: Vercel
- Backend: Render
- Database: Neon

---

## Architecture

```
Frontend (Vercel)
    ↓ HTTPS
Backend API (Render / FastAPI)
    ↓
PostgreSQL (Neon)
    +
Yahoo Finance (market data, live prices)
World Bank API (inflation rates)
Groq API (LLM for chat + analysis)
```

---

## Local development

**Prerequisites**: Python 3.11+, Node.js 18+, PostgreSQL

**Backend**
```bash
cd savings-investment-simulator
python -m venv .venv
.venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

Create a `.env` file in the root:
```
DATABASE_URL=postgresql://user:password@localhost:5432/goaliq
SECRET_KEY=your-secret-key
GROQ_API_KEY=your-groq-api-key
```

Run the database schema and seed market data:
```bash
psql $DATABASE_URL -f backend/db/schema.sql
python -m backend.db.seed_market_returns
```

Start the backend:
```bash
uvicorn backend.main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` to `http://localhost:8000`.

---

## Disclaimer

GoalIQ is not regulated financial advice. Simulations are based on historical market data — past performance does not guarantee future results. Nothing on this platform is a recommendation to buy, sell, or hold any investment. For significant financial decisions, consult a qualified financial adviser.