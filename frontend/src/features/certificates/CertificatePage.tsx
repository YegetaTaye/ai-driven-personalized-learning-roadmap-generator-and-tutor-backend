import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  DownloadIcon,
  FileTextIcon,
  LinkIcon,
  CheckIcon,
  AwardIcon,
  ArrowLeftIcon,
} from "lucide-react";
import {
  useMyCertificate,
  useClaimCertificate,
  type CertificateDto,
} from "@/api/certificates";
import { CertificateFrame } from "./components/CertificateFrame";
import type { CertificateData } from "./components/CertificateTemplate";
import {
  downloadCertificatePng,
  downloadCertificatePdf,
} from "./certificateDownload";
import { PageSpinner } from "@/components/common/Spinner";

function toCertificateData(c: CertificateDto): CertificateData {
  return {
    recipientName: c.recipientName,
    courseName: c.courseName,
    completionDate: c.completedAt,
    certificateId: c.publicId,
    hours: c.hoursInvested,
    averageScore: c.averageScore,
    verifyUrl: `${window.location.host}/verify/${c.publicId}`,
  };
}

function ActionButton({
  onClick,
  icon,
  label,
  primary,
  disabled,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        fontFamily: "'Crimson Pro', serif",
        background: primary ? "#1a1614" : "#fff",
        color: primary ? "#f3efe7" : "#3a342e",
        border: primary ? "none" : "1px solid #c2b9a6",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

export default function CertificatePage() {
  const { id: enrollmentId = "" } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useMyCertificate(enrollmentId);
  const claim = useClaimCertificate(enrollmentId);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<"png" | "pdf" | null>(null);

  if (isLoading) return <PageSpinner />;

  const cert = data?.certificate ?? null;
  const fileBase = cert
    ? `Yeneta-Certificate-${cert.publicId}`
    : "Yeneta-Certificate";

  async function handleDownload(kind: "png" | "pdf") {
    setBusy(kind);
    try {
      if (kind === "png") await downloadCertificatePng(fileBase);
      else await downloadCertificatePdf(fileBase);
    } finally {
      setBusy(null);
    }
  }

  function handleCopy() {
    if (!cert) return;
    const url = `${window.location.origin}/verify/${cert.publicId}`;
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      style={{
        height: "100%",
        overflowY: "auto",
        background: "#efe9dd",
        padding: "28px 24px 56px",
      }}
    >
      <div style={{ maxWidth: 1123, margin: "0 auto" }}>
        {/* Back link */}
        <button
          onClick={() => navigate(`/enrollments/${enrollmentId}/roadmap`)}
          className="inline-flex items-center gap-1.5 mb-5 text-[13px] transition-opacity hover:opacity-70"
          style={{ fontFamily: "JetBrains Mono, monospace", color: "#6e645a" }}
        >
          <ArrowLeftIcon size={14} /> Back to roadmap
        </button>

        {/* ── Has certificate → show it + actions ── */}
        {cert ? (
          <>
            <CertificateFrame data={toCertificateData(cert)} />
            <div className="flex flex-wrap items-center justify-center gap-3 mt-7">
              <ActionButton
                primary
                onClick={() => void handleDownload("pdf")}
                disabled={busy !== null}
                icon={<FileTextIcon size={15} />}
                label={busy === "pdf" ? "Preparing…" : "Download PDF"}
              />
              <ActionButton
                onClick={() => void handleDownload("png")}
                disabled={busy !== null}
                icon={<DownloadIcon size={15} />}
                label={busy === "png" ? "Preparing…" : "Download PNG"}
              />
              <ActionButton
                onClick={handleCopy}
                icon={copied ? <CheckIcon size={15} /> : <LinkIcon size={15} />}
                label={copied ? "Link copied!" : "Copy share link"}
              />
            </div>
            <p
              className="text-center mt-4 text-[12px]"
              style={{
                fontFamily: "JetBrains Mono, monospace",
                color: "#9a9088",
              }}
            >
              Anyone with the share link can verify this certificate at /verify/
              {cert.publicId}
            </p>
          </>
        ) : (
          // ── No certificate yet → claim or progress prompt ──
          <div
            className="flex flex-col items-center text-center py-20 px-6 rounded-2xl"
            style={{
              background: "#faf7f1",
              border: "1px solid #d6cfbf",
              maxWidth: 560,
              margin: "40px auto 0",
            }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
              style={{
                background: data?.eligible ? "oklch(0.92 0.08 90)" : "#f3efe7",
                border: "1px solid #d6cfbf",
              }}
            >
              <AwardIcon
                size={28}
                color={data?.eligible ? "#b8924a" : "#9a9088"}
              />
            </div>

            {data?.eligible ? (
              <>
                <h1
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 30,
                    color: "#1a1614",
                    marginBottom: 8,
                  }}
                >
                  You've completed the roadmap!
                </h1>
                <p
                  style={{
                    fontFamily: "'Crimson Pro', serif",
                    fontSize: 16,
                    color: "#6e645a",
                    marginBottom: 24,
                    maxWidth: 400,
                  }}
                >
                  Claim your official certificate of completion — download it as
                  a PDF or PNG and share a verifiable link.
                </p>
                <button
                  onClick={() => claim.mutate()}
                  disabled={claim.isPending}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-[15px] transition-all hover:opacity-90 disabled:opacity-60"
                  style={{
                    fontFamily: "'Crimson Pro', serif",
                    background: "#1a1614",
                    color: "#f3efe7",
                  }}
                >
                  <AwardIcon size={17} />
                  {claim.isPending
                    ? "Issuing certificate…"
                    : "Claim my certificate"}
                </button>
                {claim.isError && (
                  <p
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: 12,
                      color: "#a8341f",
                      marginTop: 14,
                    }}
                  >
                    Could not issue the certificate. Please try again.
                  </p>
                )}
              </>
            ) : (
              <>
                <h1
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 28,
                    color: "#1a1614",
                    marginBottom: 8,
                  }}
                >
                  Certificate not yet available
                </h1>
                <p
                  style={{
                    fontFamily: "'Crimson Pro', serif",
                    fontSize: 16,
                    color: "#6e645a",
                    marginBottom: 20,
                    maxWidth: 420,
                  }}
                >
                  Master every node in this roadmap to unlock your certificate
                  of completion.
                </p>
                <div style={{ width: 280 }}>
                  <div
                    style={{
                      height: 8,
                      borderRadius: 4,
                      background: "#e8e2d9",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${data?.completionPercent ?? 0}%`,
                        height: "100%",
                        background: "#b8924a",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: 12,
                      color: "#9a9088",
                      marginTop: 8,
                    }}
                  >
                    {data?.completionPercent ?? 0}% complete
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
