import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BrandMark } from "@/components/layout/BrandMark";
import { useAuthStore } from "@/store/auth.store";

const FEATURES = [
  "Unlimited AI credits — explanations, quizzes, chat",
  "Priority AI routing — fastest model first",
  "Unlimited certificates across all domains",
  "Full velocity history & advanced analytics",
  "Early access to new domains",
  "48 h support response",
];

const PLANS = [
  {
    id: "monthly",
    label: "Monthly",
    price: "$6",
    per: "/month",
    sub: "~250 ETB · cancel any time",
    highlight: false,
  },
  {
    id: "annual",
    label: "Annual",
    price: "$4",
    per: "/month",
    sub: "$48 billed yearly · save 33%",
    highlight: true,
  },
];

type Step = "plan" | "payment" | "success";

export default function GoPro() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const [step, setStep] = useState<Step>("plan");
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">(
    "annual",
  );
  const [payMethod, setPayMethod] = useState<"card" | "chapa">("card");
  const [processing, setProcessing] = useState(false);

  const plan = PLANS.find((p) => p.id === selectedPlan)!;

  function handlePay() {
    setProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setProcessing(false);
      setStep("success");
    }, 2200);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3efe7",
        fontFamily: "'Crimson Pro', Georgia, serif",
      }}
    >
      {/* Nav */}
      <header
        style={{
          borderBottom: "1px solid #d6cfbf",
          background: "rgba(243,239,231,0.92)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: 1000,
            margin: "0 auto",
            padding: "0 24px",
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            to="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none",
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 20,
              color: "#1a1614",
            }}
          >
            <BrandMark size={26} />
            Yeneta
            <em style={{ fontStyle: "italic", color: "#6e645a" }}>.learn</em>
          </Link>
          {step !== "success" && (
            <button
              onClick={() => navigate(-1)}
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 12,
                color: "#9a9088",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              ← back
            </button>
          )}
        </div>
      </header>

      <div
        style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px 80px" }}
      >
        {/* ── Step indicator ── */}
        {step !== "success" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 36,
              justifyContent: "center",
            }}
          >
            {(["plan", "payment"] as Step[]).map((s, i) => (
              <div
                key={s}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: 11,
                    background:
                      step === s
                        ? "#1a1614"
                        : step === "payment" && s === "plan"
                          ? "oklch(0.60 0.13 150)"
                          : "#ebe6db",
                    color:
                      step === s || (step === "payment" && s === "plan")
                        ? "#faf7f1"
                        : "#9a9088",
                  }}
                >
                  {step === "payment" && s === "plan" ? "✓" : i + 1}
                </div>
                <span
                  style={{
                    fontSize: 13,
                    color: step === s ? "#1a1614" : "#9a9088",
                    fontFamily: "JetBrains Mono, monospace",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  {s === "plan" ? "Choose plan" : "Payment"}
                </span>
                {i === 0 && (
                  <div
                    style={{ width: 40, height: 1, background: "#d6cfbf" }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* ═══ STEP 1 — Plan selection ═══ */}
        {step === "plan" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 340px",
              gap: 32,
              alignItems: "start",
            }}
          >
            {/* Left — plan cards */}
            <div>
              <h1
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 38,
                  fontWeight: 400,
                  color: "#1a1614",
                  margin: "0 0 6px",
                  letterSpacing: "-0.01em",
                }}
              >
                Upgrade to Scholar
              </h1>
              <p style={{ color: "#6e645a", fontSize: 16, margin: "0 0 28px" }}>
                Unlimited AI, priority routing, and full analytics. Cancel any
                time.
              </p>

              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {PLANS.map((p) => {
                  const sel = selectedPlan === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPlan(p.id as any)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        padding: "18px 22px",
                        borderRadius: 14,
                        border: `2px solid ${sel ? "oklch(0.62 0.18 28)" : "#d6cfbf"}`,
                        background: sel
                          ? "color-mix(in srgb, oklch(0.62 0.18 28) 5%, #faf7f1)"
                          : "#faf7f1",
                        cursor: "pointer",
                        textAlign: "left",
                        position: "relative",
                      }}
                    >
                      {p.highlight && (
                        <span
                          style={{
                            position: "absolute",
                            top: -10,
                            right: 16,
                            background: "oklch(0.62 0.18 28)",
                            color: "#fff",
                            fontFamily: "JetBrains Mono, monospace",
                            fontSize: 9,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            padding: "2px 10px",
                            borderRadius: 999,
                          }}
                        >
                          Best value
                        </span>
                      )}
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          border: `2px solid ${sel ? "oklch(0.62 0.18 28)" : "#c2b9a6"}`,
                          background: sel
                            ? "oklch(0.62 0.18 28)"
                            : "transparent",
                          flexShrink: 0,
                          display: "grid",
                          placeItems: "center",
                        }}
                      >
                        {sel && (
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: "#fff",
                              display: "block",
                            }}
                          />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontFamily: "JetBrains Mono, monospace",
                            fontSize: 11,
                            color: "#9a9088",
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            marginBottom: 4,
                          }}
                        >
                          {p.label}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: 2,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "'Cormorant Garamond', serif",
                              fontSize: 36,
                              color: "#1a1614",
                              lineHeight: 1,
                            }}
                          >
                            {p.price}
                          </span>
                          <span style={{ color: "#9a9088", fontSize: 14 }}>
                            {p.per}
                          </span>
                        </div>
                        <div
                          style={{
                            fontFamily: "JetBrains Mono, monospace",
                            fontSize: 10.5,
                            color: "#9a9088",
                            marginTop: 2,
                          }}
                        >
                          {p.sub}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setStep("payment")}
                style={{
                  marginTop: 24,
                  width: "100%",
                  height: 50,
                  borderRadius: 999,
                  background: "#1a1614",
                  color: "#f3efe7",
                  fontFamily: "'Crimson Pro', serif",
                  fontSize: 16,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Continue to payment →
              </button>

              <p
                style={{
                  textAlign: "center",
                  marginTop: 14,
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 10.5,
                  color: "#b0a898",
                }}
              >
                Secure checkout · Cancel any time · No hidden fees
              </p>
            </div>

            {/* Right — what's included */}
            <div
              style={{
                border: "1px solid #d6cfbf",
                borderRadius: 16,
                padding: "22px 22px 24px",
                background: "#faf7f1",
              }}
            >
              <div
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 10,
                  color: "#9a9088",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginBottom: 14,
                }}
              >
                Scholar includes
              </div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "0 0 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {FEATURES.map((f) => (
                  <li
                    key={f}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      fontSize: 14,
                      color: "#3a342e",
                      lineHeight: 1.35,
                    }}
                  >
                    <span
                      style={{
                        color: "oklch(0.60 0.13 150)",
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: 11,
                        marginTop: 1,
                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <div
                style={{
                  borderTop: "1px solid #ebe6db",
                  paddingTop: 16,
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 10.5,
                  color: "#9a9088",
                  lineHeight: 1.6,
                }}
              >
                Ethiopian learners: ~75 ETB/month
                <br />
                Chapa · Telebirr · CBE Birr accepted
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 2 — Payment ═══ */}
        {step === "payment" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 300px",
              gap: 32,
              alignItems: "start",
            }}
          >
            <div>
              <h1
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 34,
                  fontWeight: 400,
                  color: "#1a1614",
                  margin: "0 0 24px",
                }}
              >
                Payment details
              </h1>

              {/* Payment method selector */}
              <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
                {(
                  [
                    ["card", "Credit / Debit card"],
                    ["chapa", "Chapa (ETH)"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setPayMethod(id)}
                    style={{
                      flex: 1,
                      padding: "10px 0",
                      borderRadius: 10,
                      border: `2px solid ${payMethod === id ? "oklch(0.62 0.18 28)" : "#d6cfbf"}`,
                      background:
                        payMethod === id
                          ? "color-mix(in srgb, oklch(0.62 0.18 28) 5%, #faf7f1)"
                          : "#faf7f1",
                      fontFamily: "'Crimson Pro', serif",
                      fontSize: 14,
                      color: "#3a342e",
                      cursor: "pointer",
                    }}
                  >
                    {id === "card" ? "💳 " : "📱 "}
                    {label}
                  </button>
                ))}
              </div>

              {payMethod === "card" ? (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 14 }}
                >
                  {[
                    ["Card number", "1234  5678  9012  3456", "text"],
                    ["Name on card", user?.fullName ?? "Your Name", "text"],
                  ].map(([label, placeholder, type]) => (
                    <div
                      key={label as string}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 5,
                      }}
                    >
                      <label
                        style={{
                          fontFamily: "JetBrains Mono, monospace",
                          fontSize: 10.5,
                          color: "#9a9088",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                        }}
                      >
                        {label as string}
                      </label>
                      <input
                        type={type as string}
                        placeholder={placeholder as string}
                        style={{
                          height: 44,
                          padding: "0 14px",
                          borderRadius: 10,
                          border: "1px solid #d6cfbf",
                          background: "#fff",
                          fontFamily: "'Crimson Pro', serif",
                          fontSize: 15,
                          color: "#1a1614",
                          outline: "none",
                        }}
                      />
                    </div>
                  ))}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 14,
                    }}
                  >
                    {[
                      ["Expiry", "MM / YY"],
                      ["CVC", "···"],
                    ].map(([label, placeholder]) => (
                      <div
                        key={label}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 5,
                        }}
                      >
                        <label
                          style={{
                            fontFamily: "JetBrains Mono, monospace",
                            fontSize: 10.5,
                            color: "#9a9088",
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                          }}
                        >
                          {label}
                        </label>
                        <input
                          type="text"
                          placeholder={placeholder}
                          style={{
                            height: 44,
                            padding: "0 14px",
                            borderRadius: 10,
                            border: "1px solid #d6cfbf",
                            background: "#fff",
                            fontFamily: "'Crimson Pro', serif",
                            fontSize: 15,
                            color: "#1a1614",
                            outline: "none",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    border: "1px solid #d6cfbf",
                    borderRadius: 14,
                    padding: 24,
                    background: "#faf7f1",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📱</div>
                  <p
                    style={{
                      fontSize: 16,
                      color: "#3a342e",
                      margin: "0 0 6px",
                    }}
                  >
                    Pay with Chapa
                  </p>
                  <p
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: 11,
                      color: "#9a9088",
                    }}
                  >
                    Telebirr · CBEBirr · Awash Birr · Visa/Mastercard
                  </p>
                  <p style={{ fontSize: 13, color: "#9a9088", marginTop: 14 }}>
                    You'll be redirected to Chapa's secure checkout to complete
                    payment.
                  </p>
                </div>
              )}

              <button
                onClick={handlePay}
                disabled={processing}
                style={{
                  marginTop: 24,
                  width: "100%",
                  height: 50,
                  borderRadius: 999,
                  background: processing ? "#9a9088" : "#1a1614",
                  color: "#f3efe7",
                  fontFamily: "'Crimson Pro', serif",
                  fontSize: 16,
                  border: "none",
                  cursor: processing ? "wait" : "pointer",
                  transition: "background 0.2s",
                }}
              >
                {processing ? "Processing…" : `Pay ${plan.price}${plan.per} →`}
              </button>

              <p
                style={{
                  textAlign: "center",
                  marginTop: 12,
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 10,
                  color: "#c0b8b0",
                }}
              >
                256-bit SSL encryption · PCI compliant · Cancel any time
              </p>
            </div>

            {/* Order summary */}
            <div
              style={{
                border: "1px solid #d6cfbf",
                borderRadius: 16,
                padding: "20px 20px 22px",
                background: "#faf7f1",
              }}
            >
              <div
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 10,
                  color: "#9a9088",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginBottom: 14,
                }}
              >
                Order summary
              </div>
              <div
                style={{
                  borderBottom: "1px solid #ebe6db",
                  paddingBottom: 14,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontSize: 15, color: "#3a342e" }}>
                    Scholar · {plan.label}
                  </span>
                  <span
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: 14,
                      color: "#1a1614",
                    }}
                  >
                    {plan.price}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#9a9088",
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                >
                  {plan.sub}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <span style={{ fontSize: 14, color: "#6e645a" }}>Subtotal</span>
                <span
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: 13,
                    color: "#3a342e",
                  }}
                >
                  {plan.price}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderTop: "1px solid #ebe6db",
                  paddingTop: 10,
                  marginTop: 10,
                }}
              >
                <span
                  style={{ fontSize: 15, fontWeight: 600, color: "#1a1614" }}
                >
                  Total today
                </span>
                <span
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#1a1614",
                  }}
                >
                  {selectedPlan === "annual" ? "$48" : "$6"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 3 — Success ═══ */}
        {step === "success" && (
          <div
            style={{
              maxWidth: 520,
              margin: "0 auto",
              textAlign: "center",
              paddingTop: 24,
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background:
                  "color-mix(in srgb, oklch(0.60 0.13 150) 14%, #faf7f1)",
                border: "2px solid oklch(0.60 0.13 150)",
                display: "grid",
                placeItems: "center",
                margin: "0 auto 20px",
                fontSize: 32,
              }}
            >
              ✓
            </div>
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 40,
                fontWeight: 400,
                color: "#1a1614",
                margin: "0 0 10px",
              }}
            >
              You're on Scholar!
            </h1>
            <p
              style={{
                fontSize: 17,
                color: "#6e645a",
                margin: "0 0 32px",
                lineHeight: 1.55,
              }}
            >
              Your account has been upgraded. Unlimited AI, priority routing,
              and full analytics are now active.
            </p>
            <div
              style={{
                border: "1px solid #d6cfbf",
                borderRadius: 16,
                padding: "20px 24px",
                background: "#faf7f1",
                textAlign: "left",
                marginBottom: 32,
              }}
            >
              <div
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 10,
                  color: "#9a9088",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                What's now unlocked
              </div>
              {FEATURES.slice(0, 4).map((f) => (
                <div
                  key={f}
                  style={{
                    display: "flex",
                    gap: 10,
                    marginBottom: 8,
                    fontSize: 14.5,
                    color: "#3a342e",
                  }}
                >
                  <span
                    style={{
                      color: "oklch(0.60 0.13 150)",
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: 11,
                      marginTop: 2,
                    }}
                  >
                    ✓
                  </span>
                  {f}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <Link
                viewTransition
                to="/dashboard"
                style={{
                  height: 48,
                  padding: "0 28px",
                  borderRadius: 999,
                  background: "#1a1614",
                  color: "#f3efe7",
                  fontFamily: "'Crimson Pro', serif",
                  fontSize: 15,
                  display: "inline-flex",
                  alignItems: "center",
                  textDecoration: "none",
                }}
              >
                Go to dashboard →
              </Link>
              <Link
                viewTransition
                to="/catalog"
                style={{
                  height: 48,
                  padding: "0 24px",
                  borderRadius: 999,
                  border: "1px solid #d6cfbf",
                  color: "#6e645a",
                  fontFamily: "'Crimson Pro', serif",
                  fontSize: 15,
                  display: "inline-flex",
                  alignItems: "center",
                  textDecoration: "none",
                }}
              >
                Browse domains
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
