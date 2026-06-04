// Yeneta logo — pure CSS, no image dependency
export function BrandMark({ size = 24 }: { size?: number }) {
  return (
    <span
      className="relative inline-block rounded-full flex-shrink-0"
      style={{ width: size, height: size, border: "1.5px solid #1a1614" }}
    >
      <span
        className="absolute"
        style={{
          left: "50%",
          top: 3,
          bottom: 3,
          width: 1.5,
          transform: "translateX(-50%)",
          background: "#1a1614",
        }}
      />
      <span
        className="absolute"
        style={{
          top: "50%",
          left: 3,
          right: 3,
          height: 1.5,
          transform: "translateY(-50%)",
          background: "oklch(0.62 0.18 28)",
        }}
      />
    </span>
  );
}
