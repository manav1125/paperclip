# Wallet Enforcement + 5-Day Pricing Pilot

This guide is the fastest way to validate real unit economics before public launch.

## 1. Enable hard wallet mode

Paperclip now supports hard wallet enforcement at the company level.

- If `hard_limit_enforced = true`, new runs are blocked when wallet balance is exhausted.
- If wallet balance is below `min_run_balance_cents`, runs are blocked until topped up.
- Every top-up and debit is recorded in the company wallet ledger.

Where to manage it:

- Instance UI: `Instance Settings -> Usage & Costs` (Wallet Enforcement Control)
- API: `GET /api/companies/:companyId/wallet`
- API: `POST /api/companies/:companyId/wallet/top-up`
- API: `PATCH /api/companies/:companyId/wallet/policy`

## 2. Seed one realistic pilot company

Use one representative test company and run real workflows for 1-5 days.

- Create 1 company outcome (goal)
- Create 1 CEO + 1 functional lead
- Create 3-5 scoped issues with real business context
- Run/iterate daily, do not keep everything in one giant issue

This gives enough variability to estimate baseline spend and overage behavior.

## 3. Track this scorecard daily

Use the CSV template:

- [`docs/guides/board-operator/wallet-pricing-pilot-scorecard-template.csv`](/Users/manavgupta/Projects/Paperclip/repo/docs/guides/board-operator/wallet-pricing-pilot-scorecard-template.csv)

Minimum daily checks:

- Wallet opening balance
- Wallet top-ups
- LLM debits
- Closing balance
- Agent run count
- Tokens in/out
- Spend by provider/model
- High-cost task threads

## 4. Pass / fail criteria before production rollout

- No run outages caused by accidental zero balance (unless intentionally testing enforcement)
- Cost tracking coverage >= 95% of runs with usage
- Blend margin >= target after markup and platform fee
- Overage rate protects margin under high-usage days
- Team can explain top 3 expensive workflows and their optimization plan

## 5. Recommended pilot loop

1. Day 1: Baseline usage and top-up behavior
2. Day 2-3: Optimize prompt/issue scope for token efficiency
3. Day 4: Stress with higher run volume
4. Day 5: Finalize tier caps, included credits, and overage prices

After day 5, update your published pricing with real observed ranges, not assumptions.
