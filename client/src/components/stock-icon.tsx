const STOCK_ICONS: Record<string, { char: string; bg: string }> = {
  "케이뱅크": { char: "케", bg: "#E8344E" },
  "두나무": { char: "두", bg: "#333333" },
  "빗썸": { char: "빗", bg: "#E8344E" },
  "무신사": { char: "무", bg: "#111111" },
  "오아시스": { char: "오", bg: "#4CAF50" },
  "컬리": { char: "컬", bg: "#5F0080" },
  "에스엠랩": { char: "에", bg: "#2196F3" },
  "야놀자": { char: "야", bg: "#E8344E" },
  "케이솔루션": { char: "케", bg: "#43A047" },
  "에너진": { char: "에", bg: "#E65100" },
  "LG CNS": { char: "L", bg: "#A50034" },
  "서울보증보험": { char: "서", bg: "#1976D2" },
  "에이피알": { char: "에", bg: "#43A047" },
  "오톰": { char: "오", bg: "#333333" },
  "현대엔지니어링": { char: "현", bg: "#1976D2" },
  "이브이알스튜디오": { char: "이", bg: "#6B4CE6" },
  "에임드바이오": { char: "에", bg: "#43A047" },
  "토스": { char: "토", bg: "#3182f6" },
  "크래프톤": { char: "크", bg: "#333333" },
  "넥슨게임즈": { char: "넥", bg: "#1976D2" },
  "에스팀": { char: "에", bg: "#333333" },
  "엑스비스": { char: "엑", bg: "#555555" },
  "비상장주식": { char: "비", bg: "#E8344E" },
};

export function StockIcon({ name, size = 32 }: { name: string; size?: number }) {
  const icon = STOCK_ICONS[name];
  const char = icon?.char || name.charAt(0);
  const bg = icon?.bg || "#999999";
  const fontSize = size <= 24 ? 10 : size <= 32 ? 13 : 14;

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
  return STOCK_ICONS[name]?.bg || "#999999";
}
