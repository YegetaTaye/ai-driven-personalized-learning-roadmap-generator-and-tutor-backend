import { Link } from "react-router-dom";
import { BrandMark } from "@/components/layout/BrandMark";
import { DagPreview } from "./components/DagPreview";
import { LegendStrip } from "./components/LegendStrip";
import { PersonaArt } from "./components/PersonaArt";
import "./LandingPage.css";

const HOW_STEPS = [
  {
    n: "01",
    tag: "step one",
    title: "Pick a domain.",
    body: "Frontend, Backend, Data Science, DevOps, Python — five domains live, each a DAG built by domain experts.",
  },
  {
    n: "02",
    tag: "step two",
    title: "Enrol & profile.",
    body: "Tell us your familiarity, goals, weekly hours, and preferred learning style. Your roadmap shapes itself around you.",
  },
  {
    n: "03",
    tag: "step three",
    title: "Unlock by quiz.",
    body: "Each node has a gatekeeper quiz. Score 80%+ and the next layer opens. Fail? The system adapts the content.",
  },
  {
    n: "04",
    tag: "step four",
    title: "Don't decay.",
    body: "Spaced micro-quizzes keep mastered topics fresh. Forget something? It drifts to amber, then red.",
  },
];

const PERSONAS = [
  {
    art: "learner" as const,
    role: "For learners",
    title: "A path that adapts.",
    body: "Browse domains, enrol, navigate the DAG. Take quizzes, ask the AI Instructor by text or voice, and watch explanations stream in real time.",
    points: [
      "Personalised after enrolment profiling",
      "AI explanation + voice-enabled chat per node",
      "Verifiable certificate on completion",
    ],
  },
  {
    art: "instructor" as const,
    role: "For instructors",
    title: "See the cohort.",
    body: "Heatmaps show which nodes learners get stuck on. Flagged events queue up for review. Domain analytics surface drop-off in one glance.",
    points: [
      "Per-learner progress drill-down",
      "Domain mastery heatmap",
      "Flagged-question queue with resolution",
    ],
  },
  {
    art: "admin" as const,
    role: "For admins & experts",
    title: "Build the graph.",
    body: "An ontology builder lets you add nodes, draw prerequisites, attach resources, and publish a domain when it's ready.",
    points: [
      "Visual node-and-edge editor",
      "Branching & convergence points",
      "Versioning + draft / publish lifecycle",
    ],
  },
];

const STATS = [
  {
    num: <em>5</em>,
    lbl: "Domains live",
    desc: "Frontend, Backend, Data Science, DevOps, Python.",
  },
  {
    num: "200+",
    lbl: "Learning nodes",
    desc: "Each with a quiz, AI explanation, and learning outcomes.",
  },
  {
    num: <em>5</em>,
    lbl: "Mastery states",
    desc: "Not started, in progress, mastered, review, relearn.",
  },
  {
    num: "99.5%",
    lbl: "Cost reduction",
    desc: "vs. GPT-4, via three-tier local-first AI fallback.",
  },
];

export default function LandingPage() {
  return (
    <div className="Yeneta-landing">
      {/* ════ NAV ════ */}
      <header className="nav">
        <div className="container nav-inner">
          <Link viewTransition to="/" className="brand">
            <BrandMark size={28} />
            <span>
              Yeneta<em>.learn</em>
            </span>
          </Link>
          <nav className="nav-links">
            <a href="#how">How it works</a>
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#instructors">For Instructors</a>
            <a href="#domains">Domains</a>
          </nav>
          <div className="nav-spacer" />
          <div className="nav-cta">
            <Link viewTransition to="/login" className="btn btn-ghost">
              Sign in
            </Link>
            <Link viewTransition to="/register" className="btn btn-primary">
              Start learning <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ════ HERO ════ */}
        <section className="hero">
          <div className="container hero-grid">
            <div>
              <span className="eyebrow">
                <span className="dot" />
                Ontology-guided adaptive learning
              </span>
              <h1 className="hero-title">
                Master what you
                <br />
                <em>actually</em> need &mdash;
                <br />
                <span className="underline">node by node.</span>
              </h1>
              <p className="hero-sub">
                Yeneta turns any technical domain into a personalised graph of
                skills. Pass a quiz, unlock the next node. Forget something, the
                graph reminds you. Branch into the path that fits the career you
                actually want.
              </p>
              <div className="hero-actions">
                <Link
                  viewTransition
                  to="/register"
                  className="btn btn-primary btn-lg"
                >
                  Pick your first domain &rarr;
                </Link>
                <a href="#how" className="btn btn-outline btn-lg">
                  See how it works
                </a>
              </div>
              <div className="hero-meta">
                <div className="hero-meta-row">
                  <span
                    className="swatch"
                    style={{ background: "var(--m-mastered)" }}
                  />
                  <span>
                    <strong>5</strong> mastery states
                  </span>
                </div>
                <div className="hero-meta-row">
                  <span
                    className="swatch"
                    style={{ background: "var(--m-progress)" }}
                  />
                  <span>
                    <strong>Spaced</strong> repetition built-in
                  </span>
                </div>
                <div className="hero-meta-row">
                  <span
                    className="swatch"
                    style={{ background: "var(--coral)" }}
                  />
                  <span>
                    <strong>AI tutor</strong> per node
                  </span>
                </div>
              </div>
            </div>

            <DagPreview />
          </div>
        </section>

        {/* ════ LEGEND STRIP ════ */}
        <section className="container" style={{ padding: "16px 32px 48px" }}>
          <div className="ornament">
            Five states &middot; one graph &middot; zero guesswork
          </div>
          <LegendStrip />
        </section>

        {/* ════ HOW IT WORKS ════ */}
        <section className="sec" id="how">
          <div className="container">
            <div className="sec-head">
              <div>
                <div className="sec-num">01 / how it works</div>
                <h2 className="sec-title">
                  From <em>&ldquo;where do I even start&rdquo;</em>
                  <br />
                  to a real, personalised path.
                </h2>
              </div>
              <p className="sec-lede">
                Most learning resources hand you a list. Yeneta hands you a
                graph that updates as you do. Pick a domain, fill in your
                profile, and the roadmap shapes itself around what you already
                know.
              </p>
            </div>
            <div className="steps">
              {HOW_STEPS.map((s) => (
                <div className="step" key={s.n}>
                  <div className="step-num">{s.n}</div>
                  <span className="step-tag">{s.tag}</span>
                  <h4>{s.title}</h4>
                  <p>{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════ PERSONAS ════ */}
        <section
          className="sec"
          id="instructors"
          style={{ paddingTop: 0, borderTop: "none" }}
        >
          <div className="container">
            <div className="sec-head" style={{ marginBottom: 0 }}>
              <div>
                <div className="sec-num">02 / for everyone</div>
                <h2 className="sec-title">
                  Three workflows.
                  <br />
                  <em>One</em> ontology.
                </h2>
              </div>
              <p className="sec-lede">
                Learners get a focused path. Instructors get a heatmap of where
                their cohort is stuck. Admins build the graphs in a visual
                editor. Same data model, three lenses.
              </p>
            </div>
          </div>
          <div className="container" style={{ marginTop: 56, padding: 0 }}>
            <div className="container personas">
              {PERSONAS.map((p) => (
                <div className="persona" key={p.role}>
                  <div className="persona-art">
                    <PersonaArt kind={p.art} />
                  </div>
                  <div className="role">{p.role}</div>
                  <h3>{p.title}</h3>
                  <p>{p.body}</p>
                  <ul>
                    {p.points.map((pt) => (
                      <li key={pt}>{pt}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════ FEATURES ════ */}
        <section className="sec" id="features">
          <div className="container">
            <div className="sec-head">
              <div>
                <div className="sec-num">03 / built-in</div>
                <h2 className="sec-title">
                  Everything a real <em>learning loop</em> needs.
                </h2>
              </div>
              <p className="sec-lede">
                Quizzes that gate progress. AI explanations streamed in real
                time. Spaced repetition that catches decay before you do.
                Certificates that prove you finished.
              </p>
            </div>

            <div className="feature-grid">
              <div className="feature span-3">
                <span className="feature-mark">// gatekeeper quiz</span>
                <h4>
                  Pass to unlock.
                  <br />
                  Fail to learn what&rsquo;s missing.
                </h4>
                <p>
                  Multiple-choice quizzes with five tiers: strong pass, marginal
                  pass, fail-low, fail-fundamental, fail-severe. Each tier
                  triggers a different adaptation event.
                </p>
                <div className="feature-art">
                  <div className="bar-stack">
                    <div className="bar-row">
                      <span className="label">strong_pass</span>
                      <span className="track">
                        <i
                          style={{
                            width: "88%",
                            background: "var(--m-mastered)",
                          }}
                        />
                      </span>
                      <span className="num">88%</span>
                    </div>
                    <div className="bar-row">
                      <span className="label">marginal</span>
                      <span className="track">
                        <i
                          style={{
                            width: "74%",
                            background: "var(--m-review)",
                          }}
                        />
                      </span>
                      <span className="num">74%</span>
                    </div>
                    <div className="bar-row">
                      <span className="label">fail_low</span>
                      <span className="track">
                        <i
                          style={{ width: "58%", background: "var(--coral)" }}
                        />
                      </span>
                      <span className="num">58%</span>
                    </div>
                    <div className="bar-row">
                      <span className="label">fundamental</span>
                      <span className="track">
                        <i
                          style={{
                            width: "35%",
                            background: "var(--coral-deep)",
                          }}
                        />
                      </span>
                      <span className="num">35%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="feature span-3">
                <span className="feature-mark">// streaming ai tutor</span>
                <h4>
                  Ask it anything.
                  <br />
                  By text or by voice.
                </h4>
                <p>
                  Stuck on async/await? The AI Instructor answers
                  token-by-token, grounded in the node&rsquo;s own learning
                  outcomes. Tap the mic to speak your question.
                </p>
                <div className="feature-art">
                  <div className="ai-stub">
                    <div className="you">you &middot; async/await</div>
                    <div>
                      &ldquo;Why does <code>await</code> only work inside an
                      async function?&rdquo;
                    </div>
                    <div className="me">
                      tutor &middot; grounded in &ldquo;JavaScript Core&rdquo;
                    </div>
                    <div>
                      The function must be marked <code>async</code> so the
                      runtime knows it returns a Promise that should suspend at
                      each <code>await</code>&hellip;
                    </div>
                  </div>
                </div>
              </div>

              <div className="feature span-2">
                <span className="feature-mark">// spaced repetition</span>
                <h4>Decay before you notice.</h4>
                <p>
                  Strong-pass nodes drift to review after 14 days. Marginal-pass
                  after 7. Quick micro-quizzes restore them.
                </p>
                <div className="feature-art">
                  <div className="pill-row">
                    <span className="mini-pill ink">7d marginal</span>
                    <span className="mini-pill">14d strong</span>
                    <span
                      className="mini-pill"
                      style={{
                        background:
                          "color-mix(in srgb, var(--m-review) 24%, var(--paper))",
                        color: "#8a6a1a",
                      }}
                    >
                      review now
                    </span>
                  </div>
                </div>
              </div>

              <div className="feature span-2">
                <span className="feature-mark">// certificates</span>
                <h4>
                  Prove you finished.
                  <br />
                  Share the link.
                </h4>
                <p>
                  Master every node and claim a verifiable certificate with a
                  unique public ID. Download as PDF or PNG, or share a link
                  anyone can verify.
                </p>
                <div className="feature-art pill-row">
                  <span className="mini-pill coral">ATL-K7X2-P9Q3</span>
                  <span className="mini-pill">PDF</span>
                  <span className="mini-pill">PNG</span>
                  <span className="mini-pill">/verify/:id</span>
                </div>
              </div>

              <div className="feature span-2">
                <span className="feature-mark">// gamification</span>
                <h4>
                  XP, levels, streaks,
                  <br />
                  and real badges.
                </h4>
                <p>
                  Every quiz pass earns XP scaled by tier. Hit milestones and
                  unlock named badges. Keep a daily streak alive. Weekly goals
                  keep you on track.
                </p>
                <div className="feature-art pill-row">
                  <span className="mini-pill ink">100 XP</span>
                  <span className="mini-pill coral">quiz_ace</span>
                  <span className="mini-pill">streak_14</span>
                  <span className="mini-pill">speed_learner</span>
                </div>
              </div>

              <div className="feature span-3">
                <span className="feature-mark">// branching paths</span>
                <h4>
                  Pick your career,
                  <br />
                  not your prerequisites.
                </h4>
                <p>
                  At enrolment, choose Frontend, Backend, or Data Science.
                  Switch any time from the roadmap sidebar. Shared nodes are
                  always visible; branch-specific ones filter in.
                </p>
                <div className="feature-art pill-row">
                  <span className="mini-pill coral">frontend</span>
                  <span className="mini-pill">backend</span>
                  <span className="mini-pill">data_science</span>
                </div>
              </div>

              <div className="feature span-3">
                <span className="feature-mark">// learning analytics</span>
                <h4>
                  Know your velocity.
                  <br />
                  See the finish line.
                </h4>
                <p>
                  Activity heatmaps, velocity trends, and a completion forecast
                  adjusted by your actual pace. Per-enrolment and global views.
                </p>
                <div className="feature-art pill-row">
                  <span className="mini-pill">heatmap</span>
                  <span className="mini-pill">velocity 1.2x</span>
                  <span className="mini-pill ink">~4 weeks left</span>
                  <span className="mini-pill">avg 88%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════ STATS ════ */}
        <section
          className="container"
          id="domains"
          style={{ padding: "0 32px 96px" }}
        >
          <div className="ornament" style={{ marginBottom: 24 }}>
            By the numbers
          </div>
          <div className="stats">
            {STATS.map((s) => (
              <div className="stat" key={s.lbl}>
                <div className="num">{s.num}</div>
                <div className="lbl">{s.lbl}</div>
                <div className="desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ════ PRICING ════ */}
        <section className="sec" id="pricing">
          <div className="container">
            <div className="sec-head">
              <div>
                <div className="sec-num">04 / pricing</div>
                <h2 className="sec-title">
                  Free to start.
                  <br />
                  <em>Honest</em> to scale.
                </h2>
              </div>
              <p className="sec-lede">
                Learning should not cost money. Yeneta is free for individual
                learners with a generous monthly credit allowance. Scale up to
                Pro when you need unlimited AI, or deploy your own instance at
                zero recurring cost.
              </p>
            </div>

            <div className="pricing-grid">
              {/* ── Free ── */}
              <div className="plan">
                <div className="plan-name">Explorer</div>
                <div className="plan-price">
                  <span className="plan-amount">Free</span>
                </div>
                <div className="plan-cycle">
                  30 AI credits / month &middot; resets on the 1st
                </div>
                <ul className="plan-features">
                  <li>
                    <span className="check">✓</span> All 5 domains &amp; full
                    roadmap DAG
                  </li>
                  <li>
                    <span className="check">✓</span> Quiz generation &amp;
                    gatekeeper progression
                  </li>
                  <li>
                    <span className="check">✓</span> Mastery decay &amp; spaced
                    repetition
                  </li>
                  <li>
                    <span className="check">✓</span> Gamification — XP, badges,
                    streaks
                  </li>
                  <li>
                    <span className="check">✓</span> Completion certificates
                  </li>
                  <li>
                    <span className="check">✓</span> Learning analytics &amp;
                    velocity dashboard
                  </li>
                  <li className="muted">
                    <span>~</span> 30 AI credits / month (explanations + chat)
                  </li>
                  <li className="muted">
                    <span>~</span> Earn bonus credits by mastering nodes
                  </li>
                </ul>
                <Link
                  viewTransition
                  to="/register"
                  className="btn btn-outline plan-cta"
                >
                  Get started free
                </Link>
              </div>

              {/* ── Pro ── */}
              <div className="plan plan-featured">
                <div className="plan-badge">Most popular</div>
                <div className="plan-name">Scholar</div>
                <div className="plan-price">
                  <span className="plan-amount">$6</span>
                  <span className="plan-per">&nbsp;/ month</span>
                </div>
                <div className="plan-cycle">
                  ~250 ETB / month &middot; cancel any time
                </div>
                <ul className="plan-features">
                  <li>
                    <span className="check">✓</span> Everything in Explorer
                  </li>
                  <li>
                    <span className="check">✓</span>{" "}
                    <strong>Unlimited AI credits</strong>
                  </li>
                  <li>
                    <span className="check">✓</span> Priority AI routing — best
                    model first
                  </li>
                  <li>
                    <span className="check">✓</span> Unlimited certificates
                    across all domains
                  </li>
                  <li>
                    <span className="check">✓</span> Full velocity history &amp;
                    advanced insights
                  </li>
                  <li>
                    <span className="check">✓</span> Early access to new domains
                  </li>
                  <li>
                    <span className="check">✓</span> 48 h support response
                  </li>
                </ul>
                <Link
                  viewTransition
                  to="/go-pro"
                  className="btn btn-coral plan-cta"
                >
                  Go Pro &rarr;
                </Link>
              </div>

              {/* ── Enterprise ── */}
              <div className="plan">
                <div className="plan-name">Campus</div>
                <div className="plan-price">
                  <span className="plan-amount">Custom</span>
                </div>
                <div className="plan-cycle">
                  One-time setup &middot; optional maintenance
                </div>
                <ul className="plan-features">
                  <li>
                    <span className="check">✓</span>{" "}
                    <strong>Self-hosted on your own servers</strong>
                  </li>
                  <li>
                    <span className="check">✓</span> No per-learner or per-month
                    charges
                  </li>
                  <li>
                    <span className="check">✓</span> Bring your own AI API keys
                  </li>
                  <li>
                    <span className="check">✓</span> Full data sovereignty —
                    nothing leaves your infra
                  </li>
                  <li>
                    <span className="check">✓</span> Unlimited learners for
                    universities &amp; faculties
                  </li>
                  <li>
                    <span className="check">✓</span> Custom domain branding
                  </li>
                  <li>
                    <span className="check">✓</span> Setup assistance &amp;
                    optional maintenance SLA
                  </li>
                </ul>
                <a
                  href="mailto:contact@Yeneta.learn"
                  className="btn btn-outline plan-cta"
                >
                  Contact us
                </a>
              </div>
            </div>

            <p
              style={{
                textAlign: "center",
                marginTop: 28,
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 11,
                color: "var(--muted)",
                letterSpacing: "0.05em",
              }}
            >
              Ethiopian learners pay ~12% of the global price &middot;
              PPP-adjusted &middot; Chapa &amp; Telebirr accepted
            </p>
          </div>
        </section>

        {/* ════ CTA ════ */}
        <section className="cta">
          <div className="cta-bg" />
          <div className="container cta-inner">
            <h2>
              Stop reading lists.
              <br />
              Start <em>climbing</em> a graph.
            </h2>
            <div>
              <p>
                Free for learners. Pick a domain, fill in your profile, and
                you'll be on a node in under a minute. Certificates when you
                finish.
              </p>
              <div className="cta-actions">
                <Link
                  viewTransition
                  to="/register"
                  className="btn btn-coral btn-lg"
                >
                  Create your account &rarr;
                </Link>
                <Link
                  viewTransition
                  to="/login"
                  className="btn btn-outline btn-lg"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ════ FOOTER ════ */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <Link
                viewTransition
                to="/"
                className="brand"
                style={{ color: "var(--ink)" }}
              >
                <BrandMark size={24} />
                <span>
                  Yeneta<em>.learn</em>
                </span>
              </Link>
              <p
                style={{
                  marginTop: 14,
                  maxWidth: "36ch",
                  color: "var(--muted)",
                }}
              >
                An ontology-guided adaptive learning platform. Mastery-based
                progression, AI tutoring, and verifiable certificates.
              </p>
            </div>
            <div>
              <h5>Product</h5>
              <ul>
                <li>
                  <a href="#how">How it works</a>
                </li>
                <li>
                  <a href="#features">Features</a>
                </li>
                <li>
                  <a href="#instructors">For instructors</a>
                </li>
                <li>
                  <Link viewTransition to="/register">
                    Get started
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h5>Domains</h5>
              <ul>
                <li>
                  <Link viewTransition to="/catalog">
                    Frontend Development
                  </Link>
                </li>
                <li>
                  <Link viewTransition to="/catalog">
                    Backend Development
                  </Link>
                </li>
                <li>
                  <Link viewTransition to="/catalog">
                    Data Science
                  </Link>
                </li>
                <li>
                  <Link viewTransition to="/catalog">
                    All domains &rarr;
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h5>Project</h5>
              <ul>
                <li>
                  <a
                    href="https://github.com/YegetaTaye"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub
                  </a>
                </li>
                <li>
                  <Link viewTransition to="/login">
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link viewTransition to="/register">
                    Create account
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <span>&copy; 2026 Yeneta Learning &middot; AASTU</span>
            <span>Built for learners everywhere</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
