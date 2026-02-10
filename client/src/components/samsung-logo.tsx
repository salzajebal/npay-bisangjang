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
  const w = size;
  const h = size;
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Samsung"
    >
      <rect x="0" y="0" width="100" height="100" rx="14" fill="#1428a0" />
      <text
        x="50"
        y="42"
        textAnchor="middle"
        fill="#ffffff"
        fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif"
        fontSize="16.5"
        fontWeight="700"
        letterSpacing="1.5"
      >
        SAM
      </text>
      <text
        x="50"
        y="64"
        textAnchor="middle"
        fill="#ffffff"
        fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif"
        fontSize="16.5"
        fontWeight="700"
        letterSpacing="1.5"
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
