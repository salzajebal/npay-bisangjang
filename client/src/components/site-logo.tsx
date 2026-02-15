export function SiteLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <SiteLogoBadge size={28} />
      <span className="font-bold text-base text-[#222] whitespace-nowrap">증권플러스 <span className="text-[#E8344E]">비상장</span></span>
    </div>
  );
}

export function SiteLogoBadge({ className = "", size = 32 }: { className?: string; size?: number }) {
  return (
    <div
      className={`shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 28L16 12L24 28" stroke="#E8344E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M16 28L24 12L32 28" stroke="#E8344E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </div>
  );
}
