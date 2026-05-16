---
name: SoleBook Frontend Build
overview: "Build the complete SoleBook Next.js 16 + TypeScript + Supabase frontend — a modern fintech app with GSAP animations, the defined color palette, and all 5 MVP modules: Dashboard, Cash Allocation, Obligations, Owner Salary, and AI Insights."
todos:
  - id: bootstrap
    content: Bootstrap Next.js 16 + TypeScript project, install Tailwind, GSAP, Framer Motion, Recharts, Supabase, Lucide.
    status: completed
  - id: plan-txt
    content: Create SoleBook_Implementation_Plan.txt in workspace root.
    status: completed
  - id: design-tokens
    content: Configure Tailwind design tokens for the 5-color palette and typography (Inter + DM Sans).
    status: completed
  - id: supabase-setup
    content: Set up Supabase client, types, and SQL schema file. Add mock-data layer for demo mode.
    status: completed
  - id: design-system
    content: "Build design system primitives: Button, Card, Badge, Input, Spinner, Modal."
    status: completed
  - id: layout-shell
    content: "Build dashboard layout: sidebar nav with bucket icons, top header, mobile drawer, Framer Motion page transitions."
    status: completed
  - id: landing-page
    content: Build landing page with GSAP split-text hero, parallax floating cards, problem flow animation, and feature counters.
    status: completed
  - id: onboarding
    content: Build 5-step onboarding wizard with slide transitions and GSAP progress bar.
    status: completed
  - id: dashboard-page
    content: "Build main dashboard: metric strip, smart buckets with MotionPath flow, AI recommendation card, cash sparkline, obligations timeline, and transaction feed."
    status: completed
  - id: allocation-page
    content: "Build cash allocation page: payment simulation, animated bucket split, adjustment sliders, allocation history."
    status: completed
  - id: obligations-page
    content: "Build obligations page: calendar/timeline, priority tiers, reserve coverage, add/mark-paid actions."
    status: completed
  - id: owner-salary-page
    content: "Build owner salary page: recommendation card, withdrawal tracker gauge, leakage insight."
    status: completed
  - id: insights-page
    content: "Build AI insights page: insight feed, 30-day forecast chart, discipline score ring, loan readiness indicator."
    status: completed
  - id: gsap-polish
    content: "Add and polish all GSAP animations: DrawSVG score ring, MotionPath bucket flows, ScrollTrigger stagger reveals, counter animations."
    status: completed
isProject: false
---

# SoleBook Frontend Build Plan

## Color Palette & Design Tokens

- `--burnt-peach: #F27344` — primary CTA, accent, active states
- `--prussian-blue: #0F172A` — primary background, nav
- `--deep-space-blue: #1E293B` — card/surface background
- `--bright-snow: #F8FAFC` — primary text on dark, input backgrounds
- `--ink-black: #111827` — dark text on light surfaces

Typography: Inter (headings) + DM Sans (body) via `next/font`.  
Motion: GSAP + ScrollTrigger for scroll-based reveals. Framer Motion for component-level transitions.

---

## Tech Stack

- **Next.js 16** (App Router, TypeScript) — latest stable v16.2.6
- **Tailwind CSS** with custom design token config in `tailwind.config.ts`
- **GSAP + @gsap/react** for parallax, counter animations, bucket flow animations
- **Framer Motion** for page transitions and card micro-animations
- **Supabase** (`@supabase/supabase-js`, `@supabase/ssr`) for auth and data
- **Recharts** for cash flow forecast charts
- **Lucide React** for icons

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── onboarding/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              ← sidebar + header shell
│   │   ├── dashboard/page.tsx
│   │   ├── allocation/page.tsx
│   │   ├── obligations/page.tsx
│   │   ├── owner-salary/page.tsx
│   │   └── insights/page.tsx
│   ├── layout.tsx
│   └── page.tsx                    ← landing/marketing page
├── components/
│   ├── ui/                         ← design system primitives
│   ├── dashboard/
│   ├── allocation/
│   ├── obligations/
│   ├── owner-salary/
│   ├── insights/
│   └── layout/
├── lib/
│   ├── supabase/
│   ├── finance/                    ← allocation engine, score, forecast
│   └── mock-data/
└── types/
```

---

## Pages & Key Screens

### 1. Landing Page (`/`)
- Full-screen hero with GSAP split-text animation: **"From Cash Chaos to Financial Control"**
- Parallax floating card mockups (GSAP ScrollTrigger)
- Problem section: animated flow showing money entering one account and disappearing
- Feature highlights with scroll-triggered counter animations
- CTA → `/onboarding`

### 2. Onboarding (`/onboarding`)
- 5-step wizard with Framer Motion slide transitions:
  1. Demo mode or connect bank (simulated Seylan API)
  2. Business type (Retail / Restaurant / Services / Wholesale / Freelancer)
  3. Owner monthly salary goal
  4. AI-generated bucket setup preview
  5. Dashboard ready
- Progress bar with GSAP smooth fill

### 3. Dashboard (`/dashboard`)
- Top metric strip: current balance, monthly revenue, reserve health, discipline score
- **Smart Buckets panel** — animated money-flow lines between buckets using GSAP `MotionPath`
- **AI Recommendation card** — highlighted with burnt-peach accent, Accept / Adjust CTAs
- **Cash flow sparkline** for 30-day trend (Recharts)
- **Upcoming obligations timeline** — horizontal scroll with sticky dates
- **Recent transactions feed** with category tags

### 4. Cash Allocation (`/allocation`)
- Incoming payment simulation input
- **AI Allocation animation**: money splits into 4 buckets with number counters (GSAP)
- Bucket percentage sliders for "Adjust" mode
- Allocation history log

### 5. Obligations (`/obligations`)
- Calendar/timeline view of upcoming payments
- Priority tier: HIGH (red) / MEDIUM (amber) / LOW (green) with color-coded cards
- Reserve coverage indicator per obligation
- Add / mark paid actions

### 6. Owner Salary (`/owner-salary`)
- Monthly salary recommendation card
- Withdrawal tracker with safe/warning/danger zones
- Personal leakage insight: `"Owner withdrawals exceeded limit by 22% — supplier payments may be at risk."`
- GSAP animated gauge/meter for withdrawal health

### 7. AI Insights (`/insights`)
- Feed of AI insight cards sorted by urgency
- 7/14/30-day cash flow forecast chart (Recharts area chart)
- Financial discipline score breakdown with animated ring chart
- Loan readiness indicator

---

## GSAP Animation Plan

| Location | Animation |
|---|---|
| Landing hero | Split-text reveal, parallax floating cards |
| Dashboard buckets | MotionPath money-flow lines between buckets |
| Incoming payment | Number counter split across 4 buckets |
| Discipline score ring | DrawSVG arc on page enter |
| Obligations timeline | ScrollTrigger stagger reveal |
| AI insight cards | Staggered fade+slide up on load |
| Cash forecast chart | Line draw-in animation |
| Onboarding progress | Smooth GSAP fill bar |

---

## Supabase Schema (MVP tables)

- `businesses` — id, owner_id, type, name, salary_goal, created_at
- `transactions` — id, business_id, amount, type, category, description, date
- `buckets` — id, business_id, name, balance, target_pct
- `obligations` — id, business_id, name, amount, due_date, priority, status
- `allocations` — id, business_id, transaction_id, bucket splits (jsonb), accepted_at
- `insights` — id, business_id, message, severity, created_at
- `scores` — id, business_id, discipline_score, loan_readiness, computed_at

---

## Implementation Order

1. Bootstrap Next.js 16 project (`npx create-next-app@latest`), install all deps, configure Tailwind with design tokens
2. Create `SoleBook_Implementation_Plan.txt` in workspace root
3. Build Supabase client, types, and mock-data layer
4. Build design system primitives (Button, Card, Badge, Input, Modal)
5. Build layout shell (sidebar nav, top header, mobile menu)
6. Landing page with GSAP hero + parallax
7. Onboarding wizard
8. Dashboard (core page — highest demo priority)
9. Cash Allocation page
10. Obligations page
11. Owner Salary page
12. AI Insights page
13. Polish GSAP animations across all pages