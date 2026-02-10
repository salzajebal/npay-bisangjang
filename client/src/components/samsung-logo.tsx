export function SamsungLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 52"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Samsung"
    >
      <text
        x="200"
        y="42"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif"
        fontSize="56"
        fontWeight="700"
        letterSpacing="8"
      >
        SAMSUNG
      </text>
    </svg>
  );
}

export function SamsungBadge({ className = "", size = 40 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Samsung"
    >
      <rect x="0" y="0" width="120" height="120" rx="24" fill="#1428a0" />
      <text
        x="60"
        y="52"
        textAnchor="middle"
        fill="#ffffff"
        fontFamily="SamsungOne, 'Helvetica Neue', Helvetica, Arial, sans-serif"
        fontSize="24"
        fontWeight="800"
        letterSpacing="3.5"
      >
        SAM
      </text>
      <text
        x="60"
        y="80"
        textAnchor="middle"
        fill="#ffffff"
        fontFamily="SamsungOne, 'Helvetica Neue', Helvetica, Arial, sans-serif"
        fontSize="24"
        fontWeight="800"
        letterSpacing="3.5"
      >
        SUNG
      </text>
    </svg>
  );
}

export function SamsungLogoWithBadge({ className = "", badgeSize = 32 }: { className?: string; badgeSize?: number }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <SamsungBadge size={badgeSize} />
      <SamsungLogo className="h-4 w-auto" />
    </div>
  );
}

export function SamsungLogoCompact({ className = "", size = 24 }: { className?: string; size?: number }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <SamsungLogo className={`h-[${size}px] w-auto`} />
    </div>
  );
}
