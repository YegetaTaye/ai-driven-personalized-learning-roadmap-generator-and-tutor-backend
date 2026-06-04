import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  ShieldCheckIcon,
  ShieldXIcon,
  DownloadIcon,
  FileTextIcon,
} from "lucide-react";
import { useVerifyCertificate, type CertificateDto } from "@/api/certificates";
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

/** Public, no-auth page reached via the shareable link /verify/:publicId. */
export default function VerifyCertificatePage() {
  const { publicId = "" } = useParams();
  const { data, isLoading, isError } = useVerifyCertificate(publicId);
  const [busy, setBusy] = useState<"png" | "pdf" | null>(null);

  if (isLoading)
    return (
      <div style={{ minHeight: "100vh", background: "#efe9dd" }}>
        <PageSpinner />
      </div>
    );

  async function handleDownload(kind: "png" | "pdf") {
    if (!data?.certificate) return;
    setBusy(kind);
    try {
      const name = `Yeneta-Certificate-${data.certificate.publicId}`;
      if (kind === "png") await downloadCertificatePng(name);
      else await downloadCertificatePdf(name);
    } finally {
      setBusy(null);
    }
  }

  const issuedDate = data?.certificate
    ? new Date(data.certificate.issuedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#efe9dd",
        padding: "40px 24px 64px",
      }}
    >
      <div style={{ maxWidth: 1123, margin: "0 auto" }}>
        {/* Brand */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <span
            style={{
              position: "relative",
              display: "inline-block",
              width: 22,
              height: 22,
              borderRadius: "50%",
              border: "1.5px solid #1a1614",
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
                background: "#1a1614",
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
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "#1a1614",
            }}
          >
            Yeneta
          </span>
        </div>

        {isError || !data?.certificate ? (
          // ── Not found / invalid ──
          <div
            className="flex flex-col items-center text-center py-20 px-6 rounded-2xl"
            style={{
              background: "#faf7f1",
              border: "1px solid #d6cfbf",
              maxWidth: 520,
              margin: "0 auto",
            }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
              style={{ background: "#f7e4e0" }}
            >
              <ShieldXIcon size={28} color="#a8341f" />
            </div>
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 28,
                color: "#1a1614",
                marginBottom: 8,
              }}
            >
              Certificate not found
            </h1>
            <p
              style={{
                fontFamily: "'Crimson Pro', serif",
                fontSize: 16,
                color: "#6e645a",
              }}
            >
              We couldn't verify a certificate with the ID{" "}
              <strong>{publicId}</strong>. Check the link and try again.
            </p>
          </div>
        ) : (
          <>
            {/* Verified badge */}
            <div className="flex flex-col items-center mb-6">
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-2"
                style={{
                  background: "oklch(0.93 0.07 150)",
                  border: "1px solid oklch(0.82 0.1 150)",
                }}
              >
                <ShieldCheckIcon size={16} color="oklch(0.42 0.13 150)" />
                <span
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "oklch(0.36 0.13 150)",
                  }}
                >
                  Verified Authentic
                </span>
              </div>
              <p
                style={{
                  fontFamily: "'Crimson Pro', serif",
                  fontSize: 15,
                  color: "#6e645a",
                }}
              >
                Issued by Yeneta on {issuedDate}
              </p>
            </div>

            <CertificateFrame data={toCertificateData(data.certificate)} />

            {/* Download actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-7">
              <button
                onClick={() => void handleDownload("pdf")}
                disabled={busy !== null}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] transition-all hover:opacity-90 disabled:opacity-50"
                style={{
                  fontFamily: "'Crimson Pro', serif",
                  background: "#1a1614",
                  color: "#f3efe7",
                }}
              >
                <FileTextIcon size={15} />{" "}
                {busy === "pdf" ? "Preparing…" : "Download PDF"}
              </button>
              <button
                onClick={() => void handleDownload("png")}
                disabled={busy !== null}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] transition-all hover:opacity-90 disabled:opacity-50"
                style={{
                  fontFamily: "'Crimson Pro', serif",
                  background: "#fff",
                  color: "#3a342e",
                  border: "1px solid #c2b9a6",
                }}
              >
                <DownloadIcon size={15} />{" "}
                {busy === "png" ? "Preparing…" : "Download PNG"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
