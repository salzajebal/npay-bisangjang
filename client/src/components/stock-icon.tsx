import { useState } from "react";

const STOCK_LOGOS: Record<string, { logo: string; bg: string }> = {
  "케이뱅크": { logo: "/logos/kbank.png", bg: "#E8344E" },
  "두나무": { logo: "/logos/dunamu.png", bg: "#333333" },
  "빗썸": { logo: "/logos/bithumb.png", bg: "#E8344E" },
  "무신사": { logo: "/logos/musinsa.png", bg: "#111111" },
  "오아시스": { logo: "/logos/oasis.png", bg: "#4CAF50" },
  "컬리": { logo: "/logos/kurly.png", bg: "#5F0080" },
  "에스엠랩": { logo: "/logos/smlab.png", bg: "#2196F3" },
  "야놀자": { logo: "/logos/yanolja.png", bg: "#E8344E" },
  "케이솔루션": { logo: "/logos/kesolution.png", bg: "#43A047" },
  "에너진": { logo: "/logos/energin.png", bg: "#E65100" },
  "오톰": { logo: "/logos/otom.png", bg: "#333333" },
  "에스팀": { logo: "/logos/esteam.png", bg: "#333333" },
  "토스": { logo: "/logos/toss.png", bg: "#3182f6" },
  "현대엔지니어링": { logo: "/logos/hyundai_eng.png", bg: "#1976D2" },
  "이브이알스튜디오": { logo: "/logos/evrstudio.png", bg: "#6B4CE6" },
  "LG CNS": { logo: "", bg: "#A50034" },
  "서울보증보험": { logo: "", bg: "#1976D2" },
  "에이피알": { logo: "", bg: "#43A047" },
  "에임드바이오": { logo: "", bg: "#43A047" },
  "크래프톤": { logo: "", bg: "#333333" },
  "넥슨게임즈": { logo: "", bg: "#1976D2" },
  "엑스비스": { logo: "", bg: "#555555" },
  "비상장주식": { logo: "", bg: "#E8344E" },
};

export function StockIcon({ name, size = 32 }: { name: string; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const entry = STOCK_LOGOS[name];
  const logoUrl = entry?.logo;
  const bg = entry?.bg || "#999999";
  const char = name.charAt(0);
  const fontSize = size <= 24 ? 10 : size <= 32 ? 13 : 14;

  if (logoUrl && !imgError) {
    return (
      <img
        src={logoUrl}
        alt={`${name} 로고`}
        className="rounded-full shrink-0 object-cover"
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
        data-testid={`icon-stock-${name}`}
      />
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold shrink-0"
      style={{ width: size, height: size, backgroundColor: bg, fontSize }}
      data-testid={`icon-stock-${name}`}
    >
      {char}
    </div>
  );
}

export function getStockColor(name: string): string {
  return STOCK_LOGOS[name]?.bg || "#999999";
}
