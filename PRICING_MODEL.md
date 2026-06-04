# Yeneta.learn — Pricing Model

> **Status:** Design document. Not yet implemented in code.  
> **Principle:** Maximally free for learners. Costs charged only when real AI API costs are incurred. Self-hosting is always free.

---

## 1. Guiding Principles

1. **Free by default.** Browsing domains, the roadmap, quiz review, progress tracking, gamification, and certificates earned before credits run out — all free forever.
2. **Pay only for AI.** The only real marginal cost is Gemini API calls when Phi-4 and Ollama are unavailable. That cost is what the credit system covers.
3. **Self-hosting is zero-cost.** Any institution, educator, or developer who can run Docker Compose pays nothing. They bring their own API keys.
4. **Honest PPP pricing.** Ethiopian learners should not pay US prices. The pricing ladder is designed for local purchasing power.
5. **Freemium, not crippled.** The free tier does real learning. The gate is AI generation volume, not core functionality.

---

## 2. Real Cost Analysis

### Gemini 2.5 Flash (the only paid AI tier in the stack)

| Rate         | Price per 1M tokens |
| ------------ | ------------------- |
| Input (text) | $0.30               |
| Output       | $2.50               |
| Cached input | $0.03               |

### Cost per AI interaction

| Interaction             | Input tokens         | Output tokens | Cost         |
| ----------------------- | -------------------- | ------------- | ------------ |
| Generate explanation    | ~300                 | ~420          | **~$0.0012** |
| Generate 4-MCQ quiz     | ~250                 | ~500          | **~$0.0013** |
| AI Instructor chat turn | ~800 (incl. history) | ~300          | **~$0.0010** |
| Micro-quiz (decay)      | ~200                 | ~250          | **~$0.0007** |

**Average: $0.001 per AI interaction.**

### Monthly cost per user (full Gemini usage, worst case)

| Usage level    | Interactions/month | Gemini cost/month |
| -------------- | ------------------ | ----------------- |
| Light learner  | 50                 | $0.05             |
| Active learner | 200                | $0.20             |
| Power user     | 600                | $0.60             |

### Reality check: most interactions never hit Gemini

The three-tier fallback chain means only ~10–20% of requests reach Gemini:

- **Tier 1 — Phi-4 (Kaggle free GPU):** $0 cost, handles most traffic
- **Tier 2 — Ollama/Qwen2.5 (local CPU):** $0 cost, offline fallback
- **Tier 3 — Gemini 2.5 Flash:** $~0.001/call, last resort only

**Effective average Gemini cost per interaction: ~$0.0001–0.0002.**  
A free user doing 100 interactions/month costs Yeneta roughly **$0.01–0.02** in real API spend.

---

## 3. Tier Structure

### Free Tier — "Explorer"

**Who it's for:** Students, self-learners, casual users, anyone trying Yeneta for the first time.

| Feature                            | Included               |
| ---------------------------------- | ---------------------- |
| Domain browsing & enrolment        | ✅ Unlimited           |
| Roadmap DAG navigation             | ✅ Unlimited           |
| Quiz attempts (AI-generated)       | ✅ Uses credits        |
| AI explanation per node            | ✅ Uses credits        |
| AI Instructor chat                 | ✅ Uses credits        |
| Micro-quizzes (decay reminders)    | ✅ Uses credits        |
| Mastery decay tracking             | ✅ Free                |
| Gamification (XP, badges, streaks) | ✅ Free                |
| Progress dashboard & insights      | ✅ Free                |
| Completion certificates            | ✅ Free (1 per domain) |
| Learning analytics (velocity)      | ✅ Free                |
| Branch path switching              | ✅ Free                |

**Monthly credit allowance: 30 credits**, refreshed on the 1st of every month.

#### Credit costs

| Action                  | Credits consumed |
| ----------------------- | ---------------- |
| Generate AI explanation | 2 credits        |
| Generate quiz           | 2 credits        |
| AI Instructor message   | 1 credit         |
| Micro-quiz (decay)      | 1 credit         |

With 30 credits/month a free user can realistically:

- Study ~8 new nodes with explanation + quiz each month, or
- Have ~30 AI Instructor conversations, or
- Any mix thereof.

**Credits do not roll over.** Unused credits expire at month end to prevent stockpiling.

---

### Pro Tier — "Scholar"

**Who it's for:** Committed learners who use Yeneta daily and want no friction.

| Feature                                   | Included |
| ----------------------------------------- | -------- |
| Everything in Free                        | ✅       |
| **Unlimited AI credits**                  | ✅       |
| Priority AI routing (best model first)    | ✅       |
| Faster quiz & explanation generation      | ✅       |
| Unlimited certificates                    | ✅       |
| Advanced insights (full velocity history) | ✅       |
| Early access to new domains               | ✅       |
| Support response within 48h               | ✅       |

#### Pro pricing

| Billing | Global               | Ethiopia (PPP ~12%)       |
| ------- | -------------------- | ------------------------- |
| Monthly | **$6/month**         | **75 ETB/month (~$0.75)** |
| Annual  | **$48/year ($4/mo)** | **500 ETB/year (~$5)**    |

Rationale for global price: $6/month sits below Brilliant ($13.49/mo billed annually) and well below Duolingo Max ($14/mo). At $0.001/AI call with caching and the three-tier system, a heavy Pro user doing 1,000 AI interactions/month costs ~$0.10–0.20 in real API spend.

---

### Institutional / Team Tier — "Campus"

**Who it's for:** Universities, bootcamps, corporate training programs.

| Feature                                        | Included |
| ---------------------------------------------- | -------- |
| Everything in Pro                              | ✅       |
| Shared credit pool across learners             | ✅       |
| Instructor dashboard for all enrolled learners | ✅       |
| Custom domain branding                         | ✅       |
| Bulk learner management (CSV import)           | ✅       |
| Priority support (24h SLA)                     | ✅       |
| Dedicated ontology namespace                   | ✅       |
| Quarterly usage reports                        | ✅       |

#### Campus pricing

| Size               | Monthly           | Annual      |
| ------------------ | ----------------- | ----------- |
| Up to 25 learners  | $40/month         | $360/year   |
| Up to 100 learners | $120/month        | $1,080/year |
| 100+ learners      | Contact for quote | —           |

Ethiopian institutional pricing: ~12% of global → ~500–1,500 ETB/month depending on cohort size.

---

### Self-Hosted — "Open Instance"

**Who it's for:** Developers, educational institutions with compute, research groups, privacy-conscious organisations.

**Cost: $0. Always.**

Requirements:

- Docker Compose + Linux VPS or on-premises server
- Your own AI API keys (Gemini, or run Ollama locally — both free tiers supported)
- Postgres + Redis

What you get:

- Full Yeneta.learn codebase (open-source)
- All features unlocked with no credit limits
- Full data sovereignty — no learner data leaves your infrastructure
- Community support via GitHub Issues

Ideal for:

- AASTU, Addis Ababa University, or any institution with a server
- Corporate training programs that can provision a VM
- NGOs delivering technical education in low-connectivity regions

---

## 4. Credit Refresh & Bonus Mechanics

To encourage engagement and reduce churn without charging, free users can earn bonus credits:

| Action                          | Bonus credits |
| ------------------------------- | ------------- |
| Complete a node (strong pass)   | +1 credit     |
| Maintain a 7-day streak         | +3 credits    |
| First enrolment in a new domain | +5 credits    |
| Refer a friend who signs up     | +10 credits   |
| Complete a full domain roadmap  | +15 credits   |

**Maximum free credits held at once: 60** (prevents credit hoarding beyond 2 months).

---

## 5. What Is Never Paywalled

These features remain free forever regardless of credit balance:

- Viewing the roadmap DAG and node details
- Reading previously generated explanations (cached)
- Reviewing past quiz attempts and scores
- All gamification features (XP, badges, streaks, levels)
- All certificates already issued
- Decay notifications and roadmap colour states
- Progress dashboard and timeline estimates
- Branch path switching
- Notifications

The principle: learners should never feel locked out of their own progress data.

---

## 6. Payment Infrastructure

### Global payments

**Stripe** — cards, Apple Pay, Google Pay, SEPA, etc.  
Supported in ~46 countries for payment processing.

### Ethiopian payments

**Stripe does not support Ethiopia** for payment processing (as of 2026).

Primary gateway for Ethiopia: **Chapa** (developer.chapa.co)

- Supports: Telebirr, CBEBirr, Awash Birr, Yaya Wallet, Visa/Mastercard
- Native REST API with webhooks
- Used by Ethiopian startups as the local Stripe equivalent

Secondary options:

- **Telebirr** direct API (Ethio Telecom)
- **CBE Birr** direct API (Commercial Bank of Ethiopia)
- **PayPal** (international cards, limited local bank connectivity)

### Implementation plan

1. Stripe for all non-Ethiopian international subscriptions
2. Chapa for Ethiopian users (auto-detected by IP/profile country)
3. Stripe Yeneta (US LLC) as the legal entity for Stripe processing, if needed

---

## 7. Cost Sustainability Model

### Unit economics at steady state (100 active free users + 10 Pro users)

| Item                                                                  | Monthly cost   |
| --------------------------------------------------------------------- | -------------- |
| Gemini API (free tier, 10% hitting Gemini, avg 100 interactions/user) | ~$1.00         |
| VPS hosting (2 vCPU, 4GB RAM)                                         | ~$20           |
| Domain + SSL                                                          | ~$1            |
| **Total operating cost**                                              | **~$22/month** |
| **Pro revenue (10 × $6)**                                             | **$60/month**  |
| **Net margin**                                                        | **+$38/month** |

At 50 Pro users the model is comfortably profitable while keeping 450 free users fully served.

### Break-even

- **1 Pro subscriber** at $6/month covers ~$6 in server costs
- **4 Pro subscribers** covers the full VPS + domain bill
- **10 Pro subscribers** covers 10,000 free AI interactions/month in addition to server costs

---

## 8. Anti-Abuse Measures

To prevent credit farming and API abuse:

1. **Rate limiting per user:** Max 10 AI requests per 5 minutes regardless of credit balance
2. **Credit consumption is atomic:** Credits are deducted before the AI call, not after
3. **Referral credit cap:** Max 50 referral credits per account per month
4. **Free trial device fingerprinting:** Prevents creating multiple accounts for free credits
5. **Gemini safety net:** Even if credits are exhausted, cached responses serve immediately at $0 cost

---

## 9. Rollout Phases

### Phase 1 (MVP — current)

- All features free, no credit system
- Validate user behaviour and AI cost per user
- Measure actual Gemini API spend per active user

### Phase 2 (Beta monetisation)

- Introduce credit system for new signups
- Grandfather existing users with 6 months of Pro access free
- Launch Chapa integration for Ethiopia
- Stripe integration for international

### Phase 3 (Full launch)

- Campus tier with team management
- PPP pricing enforced by geolocation
- Self-hosted onboarding documentation + Docker Hub image

---

## 10. Open Questions for Implementation

- [ ] Which database table tracks credits? (`user_credits` or extend `users`)
- [ ] Should credits be consumed synchronously (before AI call) or asynchronously (after)?
- [ ] Grace period when credits hit 0 — reject immediately or allow 5 "grace" interactions?
- [ ] How to handle cached responses — consume credits for a cache hit?
  - **Recommendation:** Cache hits should be free (0 credits) since no API cost is incurred
- [ ] Should micro-quiz decay prompts always be free to avoid punishing spaced repetition behaviour?
  - **Recommendation:** Yes — decay micro-quizzes should be free to not penalise the core retention mechanic
- [ ] Annual Pro pricing — invoice via Stripe or subscription?
- [ ] Should the Ethiopian ETB pricing be hardcoded or fetched from a live exchange rate?

---

_Document authored June 2026. Costs based on Gemini 2.5 Flash pricing at the time of writing. Review quarterly._
