# Yeneta.learn Mobile — Pricing Model

> **Status:** Design document. Not yet implemented in code.
> **Principle:** Maximally free for learners. Costs charged only when real AI API costs are incurred. Self-hosting is always free.

---

## 1. Guiding Principles

1. **Free by default.** Same as web — browsing domains, roadmap DAG, quiz review, progress tracking, gamification, and certificates earned before credits run out — all free forever.
2. **Pay only for AI.** The only real marginal cost is Gemini API calls. Mobile adds no extra AI cost — the backend is shared.
3. **Cross-platform parity.** Pricing, credits, and features are identical across web and mobile. A user's subscription works on all platforms.
4. **Store-compliant.** Subscriptions offered via Apple App Store IAP and Google Play Billing where required; direct Stripe/Chapa for web signups.
5. **Offline-first is free.** Downloaded content, cached explanations, and local quiz attempts never consume credits — no server cost is incurred.

---

## 2. Cost Analysis

### Shared backend — same AI costs as web

The mobile app consumes the same backend API. All AI cost analysis from the web pricing model applies directly:

| Interaction                        | Cost                |
| ---------------------------------- | ------------------- |
| Generate explanation               | **~$0.0012**        |
| Generate 4-MCQ quiz                | **~$0.0013**        |
| AI Instructor chat turn            | **~$0.0010**        |
| Micro-quiz (decay)                 | **~$0.0007**        |
| **Effective with 3-tier fallback** | **~$0.0001–0.0002** |

### Mobile-specific incremental costs

| Item                          | Monthly cost            | Notes                               |
| ----------------------------- | ----------------------- | ----------------------------------- |
| Apple Developer Program       | **$99/year** ($8.25/mo) | Required for App Store distribution |
| Google Play Developer account | **$25 one-time**        | No recurring cost                   |
| Push notifications (FCM)      | **$0**                  | Free tier up to 1M messages/day     |
| CDN for app assets            | **~$0**                 | Small assets, negligible bandwidth  |

**Mobile does not change unit economics.** The $0.001/AI interaction cost, the 3-tier fallback, and the Pro pricing remain identical to web.

---

## 3. Tier Structure

### Free Tier — "Explorer"

**Who it's for:** Students, self-learners, anyone trying Yeneta on mobile.

| Feature                                   | Included               |
| ----------------------------------------- | ---------------------- |
| Domain browsing & enrolment               | ✅ Unlimited           |
| Roadmap DAG navigation (mobile-optimised) | ✅ Unlimited           |
| Quiz attempts (AI-generated)              | ✅ Uses credits        |
| AI explanation per node                   | ✅ Uses credits        |
| AI Instructor chat                        | ✅ Uses credits        |
| Micro-quizzes (decay reminders)           | ✅ Uses credits        |
| Mastery decay tracking                    | ✅ Free                |
| Gamification (XP, badges, streaks)        | ✅ Free                |
| Progress dashboard & insights             | ✅ Free                |
| Completion certificates                   | ✅ Free (1 per domain) |
| Learning analytics (velocity)             | ✅ Free                |
| Branch path switching                     | ✅ Free                |
| **Offline access to cached content**      | ✅ Free                |
| **Voice narration (TTS)**                 | ✅ Free                |
| **Speech-to-text input**                  | ✅ Free                |
| **Push notifications**                    | ✅ Free                |

**Monthly credit allowance: 30 credits** — same as web. Shared pool across platforms.

#### Credit costs

| Action                  | Credits consumed |
| ----------------------- | ---------------- |
| Generate AI explanation | 2 credits        |
| Generate quiz           | 2 credits        |
| AI Instructor message   | 1 credit         |
| Micro-quiz (decay)      | 1 credit         |

Offline cached explanations and quizzes cost **0 credits** to replay — no API call is made.

---

### Pro Tier — "Scholar"

**Who it's for:** Daily learners who want unlimited AI and priority features.

| Feature                                   | Included |
| ----------------------------------------- | -------- |
| Everything in Free                        | ✅       |
| **Unlimited AI credits**                  | ✅       |
| Priority AI routing                       | ✅       |
| Faster quiz & explanation generation      | ✅       |
| Unlimited certificates                    | ✅       |
| Advanced insights (full velocity history) | ✅       |
| Early access to new domains               | ✅       |
| Priority support (48h)                    | ✅       |

#### Pro pricing

| Billing | Global (web direct)  | Global (App Store / Google Play)    | Ethiopia (PPP ~12%)       |
| ------- | -------------------- | ----------------------------------- | ------------------------- |
| Monthly | **$6/month**         | **$8/month** (after ~30% store fee) | **75 ETB/month (~$0.75)** |
| Annual  | **$48/year ($4/mo)** | **$60/year ($5/mo)**                | **500 ETB/year (~$5)**    |

**Why $8 on stores?** Apple/Google take a 15–30% commission on IAP. $8 × 0.70 = $5.60 net — close to the $6 web price. Annual on stores ($60/year × 0.70 = $42 net) — still viable. Users who sign up via web and log in on mobile pay the web price everywhere; only users who subscribe inside the app pay the store premium.

---

### Institutional / Team Tier — "Campus"

Same as web — see the main `PRICING_MODEL.md`. No mobile-specific changes. Campus subscriptions are managed via web dashboard (Stripe/Chapa), not store IAP.

---

### Self-Hosted — "Open Instance"

Same as web — **$0. Always.** The mobile app can be built from source and pointed at any self-hosted backend via a settings screen. No App Store required for sideloaded builds.

---

## 4. Credit Refresh & Bonus Mechanics

Identical to web:

| Action                          | Bonus credits |
| ------------------------------- | ------------- |
| Complete a node (strong pass)   | +1 credit     |
| Maintain a 7-day streak         | +3 credits    |
| First enrolment in a new domain | +5 credits    |
| Refer a friend who signs up     | +10 credits   |
| Complete a full domain roadmap  | +15 credits   |

**Maximum free credits held at once: 60.**

Credits are synced across web and mobile via the shared backend — using credits on one platform deducts from the same balance.

---

## 5. What Is Never Paywalled

Everything from web, plus mobile-specific free features:

- Viewing the roadmap DAG and node details
- Reading previously generated explanations (cached / downloaded offline)
- Reviewing past quiz attempts and scores (including offline)
- All gamification features (XP, badges, streaks, levels)
- All certificates already issued
- Decay notifications and roadmap colour states
- Progress dashboard and timeline estimates
- Branch path switching
- Push notifications (decay reminders, streak alerts)
- Voice narration of node content (TTS — no API cost)
- Speech-to-text for quiz answers (on-device recognition)
- Offline-mode access to previously downloaded content
- Notifications

---

## 6. Payment Infrastructure

### Web signups (recommended path)

Same as web PRICING_MODEL — **Stripe** (global) / **Chapa** (Ethiopia).  
Users subscribe once on web and get Pro on all platforms.

### In-app purchases (mobile)

| Platform      | System                            | Commission    | Notes                               |
| ------------- | --------------------------------- | ------------- | ----------------------------------- |
| iOS           | StoreKit 2 / App Store Server API | 15–30%        | Required for IAP in App Store apps  |
| Android       | Google Play Billing Library       | 15–30%        | Required for IAP in Play Store apps |
| Web / Desktop | Stripe / Chapa (direct)           | ~2.9% + $0.30 | Recommended path — lowest fee       |

**Store policy requirement (Apple):** Apps offering digital goods (subscriptions, credits) must use Apple IAP. Yeneta will:

1. Offer subscriptions via StoreKit on iOS (with the $8/mo price to absorb the commission)
2. Offer subscriptions via Google Play Billing on Android
3. Continue offering direct Stripe/Chapa via the web frontend
4. Allow cross-platform login — a user who subscribes on web gets Pro on mobile at no extra cost

**Implementation:**

- RevenueCat or custom in-app purchase service layer to unify StoreKit + Play Billing + Stripe receipts
- Server-side receipt validation for Apple and Google transactions
- Webhook handlers for `INITIAL_BUY`, `RENEWAL`, `CANCELLATION`, `REFUND` events

### Ethiopian users on mobile

- Chapa **cannot** be used inside App Store / Google Play apps for digital goods (store policy)
- Ethiopian users should sign up via the PWA / web frontend using Chapa, then log in on the mobile app
- Alternative: Google Play supports Telebirr as a payment method in Ethiopia (as of 2026) — Android users may subscribe via Play Billing with Telebirr

---

## 7. Cost Sustainability Model

Same backend cost structure as web. Mobile adds only the Apple Developer $99/year fixed cost.

| Item                                 | Monthly cost      |
| ------------------------------------ | ----------------- |
| Gemini API (100 free users + 10 Pro) | ~$1.00            |
| VPS hosting (2 vCPU, 4GB RAM)        | ~$20              |
| Domain + SSL                         | ~$1               |
| Apple Developer Program (amortised)  | ~$8.25            |
| **Total operating cost**             | **~$30.25/month** |
| **Pro revenue (10 × $6)**            | **$60/month**     |
| **Net margin**                       | **+$29.75/month** |

At 50 Pro users the margin is comfortably positive while serving 450 free mobile + web users.

---

## 8. Anti-Abuse Measures

Same as web (rate limiting, atomic credit deduction, referral caps, device fingerprinting), plus:

1. **Receipt validation.** All in-app purchase receipts are verified server-side with Apple/Google before granting Pro access. Prevents fake receipt attacks.
2. **Platform check.** A Pro subscription from App Store is valid on Android and web too (and vice versa), but the source-of-truth is always the backend subscription record.
3. **Store policy compliance.** No hidden upsells; subscription terms are displayed in the required store format.
4. **Refund handling.** Webhook listens for Apple/Google refund notifications and immediately revokes Pro access to prevent free-riding.
5. **Offline credit sync.** Credits are synced when the device comes online — prevents offline usage from exceeding the credit cap.

---

## 9. Rollout Phases

### Phase 1 (MVP — current)

- All features free, no credit system
- Mobile app uses same backend as web
- Validate mobile-specific UX patterns and offline usage

### Phase 2 (Beta monetisation)

- Introduce credit system shared with web
- Grandfather existing users with 6 months of Pro free
- Launch web-based Pro subscriptions first (Stripe/Chapa)
- Mobile in-app purchases (StoreKit + Play Billing) as secondary path

### Phase 3 (Full launch)

- RevenueCat or equivalent IAP middleware for unified subscription management
- Cross-platform subscription sync
- Self-hosted mobile build guides + sideloading documentation
- PWA fallback for devices that cannot or will not use stores

---

## 10. Open Questions for Mobile

- [ ] RevenueCat vs custom IAP middleware — which for a 2-platform app?
- [ ] Should mobile have a separate "Pro Mobile" tier at $8/mo, or a unified $6/mo that requires web signup?
- [ ] How to handle App Store review — Apple may reject apps selling subscriptions that can also be purchased cheaper outside the app
- [ ] Should offline-downloaded content consume credits at download time or be free since no API is called?
- [ ] TTS voice quality — on-device (free) vs cloud-based (costs) — should premium TTS voices be a Pro perk?
- [ ] Can Google Play Telebirr handle Ethiopian PPP pricing, or must Ethiopian users always use web/Chapa?
- [ ] What happens when a user subscribes on iOS but wants to manage subscription on Android?
- [ ] Grace period during store receipt verification failure (e.g. no internet) — allow Pro features for 24h?

---

_Document authored June 2026. Costs based on Gemini 2.5 Flash pricing at the time of writing. In-app purchase fees based on Apple App Store and Google Play Store standard commission rates._
