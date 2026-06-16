export function SiteLogo({ className = "" }: { className?: string }) {
  return <SiteLogoBadge size={28} className={className} />;
}

export function SiteLogoBadge({ className = "", size = 32 }: { className?: string; size?: number }) {
  const paySize = Math.round(size * 0.38);
  return (
    <div className={`shrink-0 inline-flex items-center overflow-hidden rounded-[6px] ${className}`} style={{ height: size * 0.75 }}>
      <div
        className="inline-flex items-center justify-center h-full"
        style={{ width: size * 0.95, background: "#03C75A" }}
      >
        <svg width={size * 0.5} height={size * 0.6} viewBox="0 0 20 26" fill="none" xmlns="http://www.w3.org/2000/svg">
          <text x="10" y="21" textAnchor="middle" fontFamily="'Arial Black',Arial,sans-serif" fontWeight="900" fontSize="22" fill="white">N</text>
        </svg>
      </div>
      <div
        className="inline-flex items-center justify-center h-full"
        style={{ background: "#14181B", paddingLeft: size * 0.16, paddingRight: size * 0.16 }}
      >
        <span style={{ fontSize: paySize, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.01em", lineHeight: 1, whiteSpace: "nowrap" }}>pay 비상장</span>
      </div>
    </div>
  );
}
