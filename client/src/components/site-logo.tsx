export function SiteLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <SiteLogoBadge size={28} />
      <span className="font-bold text-[15px] text-[#14181B] whitespace-nowrap tracking-tight">pay 비상장</span>
    </div>
  );
}

export function SiteLogoBadge({ className = "", size = 32 }: { className?: string; size?: number }) {
  const r = size * 0.22;
  return (
    <div
      className={`shrink-0 inline-flex items-center justify-center rounded-full ${className}`}
      style={{ width: size, height: size, background: "#03C75A" }}
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <text x="11" y="17" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="900" fontSize="18" fill="white">N</text>
      </svg>
    </div>
  );
}
