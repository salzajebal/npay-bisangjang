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

export function SamsungLogoCompact({ className = "", size = 24 }: { className?: string; size?: number }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <SamsungLogo className={`h-[${size}px] w-auto`} />
    </div>
  );
}
