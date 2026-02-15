export function SiteLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="w-8 h-8 rounded-md bg-[#E8344E] flex items-center justify-center shrink-0">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" fill="white" />
          <path d="M9 22V12h6v10" stroke="#E8344E" strokeWidth="2" />
        </svg>
      </div>
      <span className="font-bold text-lg text-foreground whitespace-nowrap">증권플러스 비상장</span>
    </div>
  );
}

export function SiteLogoBadge({ className = "", size = 32 }: { className?: string; size?: number }) {
  return (
    <div
      className={`rounded-md bg-[#E8344E] flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" fill="white" />
        <path d="M9 22V12h6v10" stroke="#E8344E" strokeWidth="2" />
      </svg>
    </div>
  );
}

export const SamsungBadge = SiteLogoBadge;
export const SamsungLogo = SiteLogo;
export const SamsungLogoWithBadge = SiteLogo;
export const SamsungLogoCompact = SiteLogo;
