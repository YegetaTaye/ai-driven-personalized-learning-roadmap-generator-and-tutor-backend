import { DagPreview } from "./components/DagPreview";
import { LegendStrip } from "./components/LegendStrip";
import { PersonaArt } from "./components/PersonaArt";
import "./LandingPage.css";

/* ────────────────────────────────────────────────────────────
   Yeneta — Landing Page
   Editorial bone + coral aesthetic. Cormorant Garamond / Crimson Pro.

   Self-contained: drop this folder into src/ and route to <LandingPage />.
   Fonts are loaded via the <link> in index.html — see note at bottom.
──────────────────────────────────────────────────────────────── */

const HOW_STEPS = [
  {
    n: "01",
    tag: "step one",
    title: "Pick a domain.",
    body: "Web Dev, ML, Systems Design, more. Every domain is a graph maintained by domain experts.",
  },
  {
    n: "02",
    tag: "step two",
    title: "Place yourself.",
    body: "A short diagnostic colours nodes you've already mastered green, so you don't waste a minute.",
  },
  {
    n: "03",
    tag: "step three",
    title: "Unlock by quiz.",
    body: "Each node has a gatekeeper quiz. Pass, and the next layer of the graph opens up.",
  },
  {
    n: "04",
    tag: "step four",
    title: "Don't decay.",
    body: "Spaced micro-quizzes keep mastered topics fresh. Forget something? It quietly turns amber.",
  },
];

const PERSONAS = [
  {
    art: "learner" as const,
    role: "For learners",
    title: "A path that adapts.",
    body: "Browse domains, enroll, navigate the DAG. Take quizzes, review resources, ask the AI tutor when something doesn't click.",
    points: [
      "Personalised after diagnostic",
      "AI explanation on every node",
      "Branch into Frontend, Backend, or Data",
    ],
  },
  {
    art: "instructor" as const,
    role: "For instructors",
    title: "See the cohort.",
    body: "Heatmaps show which nodes your learners get stuck on. Flagged events queue up for review. Domain analytics surface drop-off in one glance.",
    points: [
      "Per-learner progress tables",
      "Domain mastery heatmap",
      "Flagged-question queue",
    ],
  },
  {
    art: "admin" as const,
    role: "For admins & experts",
    title: "Build the graph.",
    body: "An ontology builder lets you add nodes, draw prerequisites, attach quizzes and resources, and publish a domain when it's ready.",
    points: [
      "Visual node-and-edge editor",
      "Branching & convergence points",
      "Versioning + draft / publish",
    ],
  },
];

const STATS = [
  {
    num: <em>24</em>,
    lbl: "Domains live",
    desc: "From Web Dev to ML, all maintained by domain experts.",
  },
  {
    num: "1,840",
    lbl: "Learning nodes",
    desc: "Each with a quiz, resources, and a learning outcome.",
  },
  {
    num: <em>5</em>,
    lbl: "Mastery states",
    desc: "Not started → in progress → mastered → review → relearn.",
  },
  {
    num: "3.2×",
    lbl: "Faster to fluency",
    desc: "vs. linear courses, in our internal cohort study.",
  },
];

export default function LandingPage() {
  return (
    <>
      {/* ════ NAV ════ */}
      <header className="nav" data-screen-label="Landing — Nav">
        <div className="container nav-inner">
          <a href="#" className="brand">
            <span className="brand-mark" />
            <span>
              Yeneta<em>.learn</em>
            </span>
          </a>
          <nav className="nav-links">
            <a href="#how">How it works</a>
            <a href="#domains">Domains</a>
            <a href="#features">Features</a>
            <a href="#instructors">For Instructors</a>
          </nav>
          <div className="nav-spacer" />
          <div className="nav-cta">
            <a href="#" className="btn btn-ghost">
              Sign in
            </a>
            <a href="#" className="btn btn-primary">
              Start learning <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* ════ HERO ════ */}
        <section className="hero" data-screen-label="Landing — Hero">
          <div className="container hero-grid">
            <div>
              <span className="eyebrow">
                <span className="dot" />A new kind of learning roadmap
              </span>
              <h1 className="hero-title">
                Master what you
                <br />
                <em>actually</em> need —<br />
                <span className="underline">node by node.</span>
              </h1>
              <p className="hero-sub">
                Yeneta turns any domain into a personalised graph of skills.
                Pass a quiz, unlock the next node. Forget something, the graph
                reminds you. Branch into the path that fits the career you
                actually want.
              </p>
              <div className="hero-actions">
                <a href="#" className="btn btn-primary btn-lg">
                  Pick your first domain →
                </a>
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
            Five states · one graph · zero guesswork
          </div>
          <LegendStrip />
        </section>

        {/* ════ HOW IT WORKS ════ */}
        <section className="sec" id="how" data-screen-label="Landing — How">
          <div className="container">
            <div className="sec-head">
              <div>
                <div className="sec-num">01 / how it works</div>
                <h2 className="sec-title">
                  From <em>"where do I even start"</em>
                  <br />
                  to a real, personalised path.
                </h2>
              </div>
              <p className="sec-lede">
                Most learning resources hand you a list. Yeneta hands you a
                graph that updates as you do. Pick a domain, take a placement
                quiz, and the roadmap reshapes itself around what you already
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
          data-screen-label="Landing — Personas"
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
        <section
          className="sec"
          id="features"
          data-screen-label="Landing — Features"
        >
          <div className="container">
            <div className="sec-head">
              <div>
                <div className="sec-num">03 / built-in</div>
                <h2 className="sec-title">
                  Everything a real <em>learning loop</em> needs.
                </h2>
              </div>
              <p className="sec-lede">
                Quizzes that gate progress. AI explanations on demand. Spaced
                repetition that catches decay before you do. Branching paths
                because you're not going to use everything.
              </p>
            </div>

            <div className="feature-grid">
              <div className="feature span-3">
                <span className="feature-mark">// gatekeeper quiz</span>
                <h4>
                  Pass to unlock.
                  <br />
                  Fail to learn what's missing.
                </h4>
                <p>
                  Multiple-choice quizzes with five outcomes — strong pass,
                  marginal pass, fail-low, fail-fundamental, fail-severe. A
                  marginal pass nudges you to review. A fundamental fail rewinds
                  prerequisites.
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
                            width: "64%",
                            background: "var(--m-review)",
                          }}
                        />
                      </span>
                      <span className="num">64%</span>
                    </div>
                    <div className="bar-row">
                      <span className="label">fail_low</span>
                      <span className="track">
                        <i
                          style={{ width: "48%", background: "var(--coral)" }}
                        />
                      </span>
                      <span className="num">48%</span>
                    </div>
                    <div className="bar-row">
                      <span className="label">fundamental</span>
                      <span className="track">
                        <i
                          style={{
                            width: "22%",
                            background: "var(--coral-deep)",
                          }}
                        />
                      </span>
                      <span className="num">22%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="feature span-3">
                <span className="feature-mark">// ai tutor on every node</span>
                <h4>Ask it. Out loud, in plain English.</h4>
                <p>
                  Stuck on async/await? Hit "Explain" and the AI tutor answers
                  using the node's own learning outcomes — not a generic LLM
                  dump.
                </p>
                <div className="feature-art">
                  <div className="ai-stub">
                    <div className="you">you · async/await</div>
                    <div>
                      "Why does <code>await</code> only work inside an async
                      function?"
                    </div>
                    <div className="me">
                      tutor · grounded in node "JavaScript Core"
                    </div>
                    <div>
                      The function has to be marked <code>async</code> so the
                      runtime knows it returns a Promise that should suspend at
                      each <code>await</code>…
                    </div>
                  </div>
                </div>
              </div>

              <div className="feature span-2">
                <span className="feature-mark">// spaced repetition</span>
                <h4>Decay before you notice.</h4>
                <p>
                  Mastered nodes drift toward "review" on a forgetting curve.
                  Quick micro-quizzes restore them.
                </p>
                <div className="feature-art">
                  <div className="pill-row">
                    <span className="mini-pill ink">7d</span>
                    <span className="mini-pill">14d</span>
                    <span
                      className="mini-pill"
                      style={{
                        background:
                          "color-mix(in srgb, var(--m-review) 24%, var(--paper))",
                        color: "#8a6a1a",
                      }}
                    >
                      ⚠ review now
                    </span>
                  </div>
                </div>
              </div>

              <div className="feature span-2">
                <span className="feature-mark">// branching paths</span>
                <h4>
                  Pick your career,
                  <br />
                  not your prerequisites.
                </h4>
                <p>
                  At branching points, choose Frontend, Backend, or Data. Skip
                  the rest, converge later.
                </p>
                <div className="feature-art pill-row">
                  <span className="mini-pill coral">frontend</span>
                  <span className="mini-pill">backend</span>
                  <span className="mini-pill">data</span>
                </div>
              </div>

              <div className="feature span-2">
                <span className="feature-mark">// curated resources</span>
                <h4>
                  Real materials,
                  <br />
                  rated by real learners.
                </h4>
                <p>
                  Docs, tutorials, videos, interactive — every node ships with a
                  curated reading list, ranked by community rating.
                </p>
                <div className="feature-art pill-row">
                  <span className="mini-pill">docs</span>
                  <span className="mini-pill">tutorial</span>
                  <span className="mini-pill">video</span>
                  <span className="mini-pill">interactive</span>
                  <span className="mini-pill">reference</span>
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
          data-screen-label="Landing — Stats"
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

        {/* ════ CTA ════ */}
        <section className="cta" data-screen-label="Landing — CTA">
          <div className="cta-bg" />
          <div className="container cta-inner">
            <h2>
              Stop reading lists.
              <br />
              Start <em>climbing</em> a graph.
            </h2>
            <div>
              <p>
                Free for learners. Free placement quiz on any domain. Sign up
                takes about 30 seconds and you'll be on a node before the kettle
                boils.
              </p>
              <div className="cta-actions">
                <a href="#" className="btn btn-coral btn-lg">
                  Create your account →
                </a>
                <a href="#" className="btn btn-outline btn-lg">
                  Browse domains
                </a>
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
              <a href="#" className="brand" style={{ color: "var(--ink)" }}>
                <span className="brand-mark" />
                <span>
                  Yeneta<em>.learn</em>
                </span>
              </a>
              <p
                style={{
                  marginTop: 14,
                  maxWidth: "36ch",
                  color: "var(--muted)",
                }}
              >
                A learner roadmap platform. Mastery-based progression, AI
                tutoring, and ontologies built by domain experts.
              </p>
            </div>
            <div>
              <h5>Product</h5>
              <ul>
                <li>
                  <a href="#">For learners</a>
                </li>
                <li>
                  <a href="#">For instructors</a>
                </li>
                <li>
                  <a href="#">For admins</a>
                </li>
                <li>
                  <a href="#">Pricing</a>
                </li>
              </ul>
            </div>
            <div>
              <h5>Domains</h5>
              <ul>
                <li>
                  <a href="#">Web development</a>
                </li>
                <li>
                  <a href="#">Machine learning</a>
                </li>
                <li>
                  <a href="#">Systems design</a>
                </li>
                <li>
                  <a href="#">All 24 →</a>
                </li>
              </ul>
            </div>
            <div>
              <h5>Company</h5>
              <ul>
                <li>
                  <a href="#">About</a>
                </li>
                <li>
                  <a href="#">Changelog</a>
                </li>
                <li>
                  <a href="#">Privacy</a>
                </li>
                <li>
                  <a href="#">Contact</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 Yeneta Learning Co.</span>
            <span>v0.1 · built for cohort 2026</span>
          </div>
        </div>
      </footer>
    </>
  );
}
