export function SiteLogoBadge({ className = "", size = 32 }: { className?: string; size?: number }) {
  return (
    <img
      src="/logo/header-logo.svg"
      alt="Npay 비상장"
      height={size * 0.69}
      style={{ height: size * 0.69, width: "auto", display: "inline-block" }}
      className={className}
    />
  );
}

export function SiteLogo({ className = "" }: { className?: string }) {
  return <SiteLogoBadge size={32} className={className} />;
}
