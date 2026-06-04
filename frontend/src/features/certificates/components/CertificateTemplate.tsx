/**
 * CertificateTemplate — a formal, modern certificate of completion.
 *
 * Designed at a fixed 1123 × 794 px canvas (A4 landscape @ ~96dpi) so it can be
 * rendered crisply to PNG/PDF for download. Wrap it in a scaling container for
 * responsive on-screen preview (see CertificatePreview).
 *
 * Visual language: ivory paper, deep-ink type, gold-foil accents, a CSS wax-style
 * seal built from the Yeneta brand mark. No external image dependencies.
 */

export interface CertificateData {
  recipientName: string;
  courseName: string;
  /** ISO date string or pre-formatted date */
  completionDate: string;
  /** Short public verification code, e.g. ATL-7F3A-9C21 */
  certificateId: string;
  /** Optional metrics shown in the footer */
  hours?: number | null;
  averageScore?: number | null;
  /** Name printed above the signature line */
  issuerName?: string;
  issuerTitle?: string;
  /** Public verification URL printed near the QR/seal */
  verifyUrl?: string;
}

const GOLD = "#b8924a";
const GOLD_LIGHT = "#d8b878";
const INK = "#1a1614";
const PAPER = "#fdfbf6";

function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Gold wax-style seal with the Yeneta crosshair mark at its centre. */
function CertificateSeal() {
  return (
    <div style={{ position: "relative", width: 118, height: 118 }}>
      {/* Ribbon tails */}
      <div
        style={{
          position: "absolute",
          left: 38,
          top: 84,
          width: 16,
          height: 56,
          background: `linear-gradient(180deg, ${GOLD} 0%, #8f6f33 100%)`,
          clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 78%, 0 100%)",
          transform: "rotate(-12deg)",
          transformOrigin: "top center",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 38,
          top: 84,
          width: 16,
          height: 56,
          background: `linear-gradient(180deg, ${GOLD} 0%, #8f6f33 100%)`,
          clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 78%, 0 100%)",
          transform: "rotate(12deg)",
          transformOrigin: "top center",
        }}
      />
      {/* Outer medallion */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: `radial-gradient(circle at 35% 30%, ${GOLD_LIGHT}, ${GOLD} 55%, #8f6f33 100%)`,
          boxShadow:
            "0 4px 14px rgba(143,111,51,0.35), inset 0 1px 2px rgba(255,255,255,0.5)",
        }}
      />
      {/* Scalloped notches ring */}
      <div
        style={{
          position: "absolute",
          inset: 6,
          borderRadius: "50%",
          border: `2px dashed rgba(255,255,255,0.55)`,
        }}
      />
      {/* Inner disc */}
      <div
        style={{
          position: "absolute",
          inset: 16,
          borderRadius: "50%",
          background: `radial-gradient(circle at 38% 32%, #f3e4c4, ${GOLD_LIGHT} 70%, ${GOLD} 100%)`,
          border: "1px solid rgba(143,111,51,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {/* Yeneta crosshair mark */}
        <span
          style={{
            position: "relative",
            display: "inline-block",
            width: 30,
            height: 30,
            borderRadius: "50%",
            border: `2px solid ${INK}`,
          }}
        >
          <span
            style={{
              position: "absolute",
              left: "50%",
              top: 4,
              bottom: 4,
              width: 2,
              transform: "translateX(-50%)",
              background: INK,
            }}
          />
          <span
            style={{
              position: "absolute",
              top: "50%",
              left: 4,
              right: 4,
              height: 2,
              transform: "translateY(-50%)",
              background: "#a8341f",
            }}
          />
        </span>
        <span
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 7,
            letterSpacing: "0.18em",
            color: "#6b5424",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          Verified
        </span>
      </div>
    </div>
  );
}

/** Decorative corner flourish (mirrored via CSS transforms by the caller). */
function CornerFlourish({ style }: { style?: React.CSSProperties }) {
  return (
    <svg width="74" height="74" viewBox="0 0 74 74" fill="none" style={style}>
      <path d="M2 2 L2 40 M2 2 L40 2" stroke={GOLD} strokeWidth="1.5" />
      <path
        d="M10 10 L10 28 M10 10 L28 10"
        stroke={GOLD_LIGHT}
        strokeWidth="1"
      />
      <circle cx="10" cy="10" r="2.5" fill={GOLD} />
      <path
        d="M2 40 Q 18 38 22 22 Q 38 18 40 2"
        stroke={GOLD}
        strokeWidth="0.75"
        opacity="0.6"
      />
    </svg>
  );
}

export function CertificateTemplate({
  recipientName,
  courseName,
  completionDate,
  certificateId,
  hours,
  averageScore,
  issuerName = "Dr. Elena Marsh",
  issuerTitle = "Director of Learning, Yeneta",
  verifyUrl,
}: CertificateData) {
  return (
    <div
      id="certificate-canvas"
      style={{
        position: "relative",
        width: 1123,
        height: 794,
        background: `linear-gradient(135deg, ${PAPER} 0%, #f7f1e4 100%)`,
        fontFamily: "'Crimson Pro', Georgia, serif",
        color: INK,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* Subtle paper texture via layered radial highlights */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 20% 15%, rgba(184,146,74,0.05), transparent 45%)," +
            "radial-gradient(circle at 85% 90%, rgba(184,146,74,0.05), transparent 45%)",
          pointerEvents: "none",
        }}
      />

      {/* Outer gold frame */}
      <div
        style={{ position: "absolute", inset: 22, border: `2px solid ${GOLD}` }}
      />
      {/* Inner hairline frame */}
      <div
        style={{
          position: "absolute",
          inset: 30,
          border: `1px solid ${GOLD_LIGHT}`,
        }}
      />

      {/* Corner flourishes */}
      <div style={{ position: "absolute", left: 30, top: 30 }}>
        <CornerFlourish />
      </div>
      <div style={{ position: "absolute", right: 30, top: 30 }}>
        <CornerFlourish style={{ transform: "scaleX(-1)" }} />
      </div>
      <div style={{ position: "absolute", left: 30, bottom: 30 }}>
        <CornerFlourish style={{ transform: "scaleY(-1)" }} />
      </div>
      <div style={{ position: "absolute", right: 30, bottom: 30 }}>
        <CornerFlourish style={{ transform: "scale(-1,-1)" }} />
      </div>

      {/* Content column */}
      <div
        style={{
          position: "absolute",
          inset: 30,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "54px 90px 40px",
          textAlign: "center",
        }}
      >
        {/* Brand lockup */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 6,
          }}
        >
          <span
            style={{
              position: "relative",
              display: "inline-block",
              width: 22,
              height: 22,
              borderRadius: "50%",
              border: `1.5px solid ${INK}`,
            }}
          >
            <span
              style={{
                position: "absolute",
                left: "50%",
                top: 3,
                bottom: 3,
                width: 1.5,
                transform: "translateX(-50%)",
                background: INK,
              }}
            />
            <span
              style={{
                position: "absolute",
                top: "50%",
                left: 3,
                right: 3,
                height: 1.5,
                transform: "translateY(-50%)",
                background: "#a8341f",
              }}
            />
          </span>
          <span
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: INK,
            }}
          >
            Yeneta
          </span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 46,
            fontWeight: 600,
            letterSpacing: "0.02em",
            margin: "14px 0 2px",
            color: INK,
            lineHeight: 1,
          }}
        >
          Certificate of Completion
        </h1>

        {/* Gold divider with diamond */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            margin: "14px 0 26px",
          }}
        >
          <span style={{ width: 90, height: 1, background: GOLD }} />
          <span
            style={{
              width: 7,
              height: 7,
              background: GOLD,
              transform: "rotate(45deg)",
            }}
          />
          <span style={{ width: 90, height: 1, background: GOLD }} />
        </div>

        <p
          style={{
            fontSize: 17,
            fontStyle: "italic",
            color: "#6b6259",
            margin: 0,
          }}
        >
          This certifies that
        </p>

        {/* Recipient */}
        <div
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 60,
            fontWeight: 500,
            color: INK,
            margin: "12px 0 6px",
            lineHeight: 1.05,
            maxWidth: 880,
          }}
        >
          {recipientName}
        </div>
        <div
          style={{
            width: 420,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
            marginBottom: 22,
          }}
        />

        <p
          style={{ fontSize: 17, color: "#6b6259", margin: 0, lineHeight: 1.6 }}
        >
          has successfully completed the structured learning roadmap
        </p>

        {/* Course */}
        <div
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 32,
            fontWeight: 600,
            color: "#8f6f33",
            margin: "8px 0 0",
            lineHeight: 1.15,
            maxWidth: 820,
          }}
        >
          {courseName}
        </div>

        {/* Metrics row */}
        {(hours != null || averageScore != null) && (
          <div
            style={{
              display: "flex",
              gap: 38,
              marginTop: 18,
              alignItems: "center",
            }}
          >
            {hours != null && (
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 24,
                    fontWeight: 600,
                    color: INK,
                  }}
                >
                  {hours}h
                </div>
                <div
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: 9,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "#9a9088",
                  }}
                >
                  Invested
                </div>
              </div>
            )}
            {hours != null && averageScore != null && (
              <span style={{ width: 1, height: 32, background: GOLD_LIGHT }} />
            )}
            {averageScore != null && (
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 24,
                    fontWeight: 600,
                    color: INK,
                  }}
                >
                  {Math.round(averageScore)}%
                </div>
                <div
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: 9,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "#9a9088",
                  }}
                >
                  Avg. Mastery
                </div>
              </div>
            )}
          </div>
        )}

        {/* Spacer pushes footer down */}
        <div style={{ flex: 1 }} />

        {/* Footer: date · seal · signature */}
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginTop: 18,
          }}
        >
          {/* Date */}
          <div style={{ width: 250, textAlign: "center" }}>
            <div
              style={{
                fontFamily: "'Crimson Pro', serif",
                fontSize: 18,
                color: INK,
                paddingBottom: 6,
              }}
            >
              {formatDate(completionDate)}
            </div>
            <div
              style={{
                width: "100%",
                height: 1,
                background: INK,
                opacity: 0.5,
              }}
            />
            <div
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 9,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#9a9088",
                marginTop: 6,
              }}
            >
              Date of Completion
            </div>
          </div>

          {/* Seal */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <CertificateSeal />
          </div>

          {/* Signature */}
          <div style={{ width: 250, textAlign: "center" }}>
            <div
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                fontSize: 24,
                color: INK,
                paddingBottom: 4,
              }}
            >
              {issuerName}
            </div>
            <div
              style={{
                width: "100%",
                height: 1,
                background: INK,
                opacity: 0.5,
              }}
            />
            <div
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 9,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#9a9088",
                marginTop: 6,
              }}
            >
              {issuerTitle}
            </div>
          </div>
        </div>

        {/* Verification line */}
        <div
          style={{
            marginTop: 22,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 10,
            letterSpacing: "0.1em",
            color: "#9a9088",
          }}
        >
          <span>ID&nbsp;{certificateId}</span>
          {verifyUrl && (
            <>
              <span
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: "50%",
                  background: "#c2b9a6",
                }}
              />
              <span>Verify at {verifyUrl}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
