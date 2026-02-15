import { useState } from "react";

const STOCK_LOGOS: Record<string, { logo: string; bg: string }> = {
  "케이뱅크": { logo: "https://static.ustockplus.com/logo/stock/279570.png", bg: "#E8344E" },
  "두나무": { logo: "https://static.ustockplus.com/admin/2023-01/2d2f17bd-097c-4011-931f-6c73c7b7b694.png", bg: "#333333" },
  "빗썸": { logo: "https://static.ustockplus.com/logo/stock/341650.png", bg: "#E8344E" },
  "무신사": { logo: "https://static.ustockplus.com/admin/2023-12/694577d0-9b8c-40f3-94fa-8ae34891c1e4.png", bg: "#111111" },
  "오아시스": { logo: "https://static.ustockplus.com/admin/2023-01/bbb364a1-7dbd-49ea-8f5e-845b91b16967.png", bg: "#4CAF50" },
  "컬리": { logo: "https://static.ustockplus.com/logo/stock/408480.png", bg: "#5F0080" },
  "에스엠랩": { logo: "https://static.ustockplus.com/logo/company/2768.png", bg: "#2196F3" },
  "야놀자": { logo: "https://static.ustockplus.com/admin/2025-05/a7e5b7ed-4b35-4a76-ab0d-1599271e9696.png", bg: "#E8344E" },
  "케이솔루션": { logo: "https://static.ustockplus.com/admin/2023-04/d9a62c72-0d34-4e9a-b87e-ab11e1339567.png", bg: "#43A047" },
  "에너진": { logo: "https://static.ustockplus.com/admin/2023-01/aa0c30f3-dc2a-409b-a4b6-73f55d159c63.png", bg: "#E65100" },
  "토스": { logo: "https://static.ustockplus.com/admin/2022-09/2075df61-33e0-4ecc-ba42-b95ebf15705a.png", bg: "#3182f6" },
  "비바리퍼블리카": { logo: "https://static.ustockplus.com/admin/2022-09/2075df61-33e0-4ecc-ba42-b95ebf15705a.png", bg: "#3182f6" },
  "현대엔지니어링": { logo: "", bg: "#003DA5" },
  "오톰": { logo: "", bg: "#333333" },
  "이브이알스튜디오": { logo: "https://static.ustockplus.com/logo/company/563.png", bg: "#6B4CE6" },
  "에스팀": { logo: "https://static.ustockplus.com/admin/2025-09/414cc8ab-b009-41ba-b180-e5f2ba97a32e.png", bg: "#333333" },
  "서울로보틱스": { logo: "https://static.ustockplus.com/logo/company/76915.png", bg: "#333333" },
  "에이치디현대삼호": { logo: "https://static.ustockplus.com/admin/2023-01/d9602423-0b56-419f-8737-8d30c015e379.png", bg: "#1976D2" },
  "카카오모빌리티": { logo: "https://static.ustockplus.com/logo/company/99.png", bg: "#FEE500" },
  "현대카드": { logo: "https://static.ustockplus.com/admin/2023-01/ec31a6fe-2148-477e-bdde-e6efcfd95224.png", bg: "#333333" },
  "스트라드비젼": { logo: "https://static.ustockplus.com/logo/company/77183.png", bg: "#1976D2" },
  "코스모로보틱스": { logo: "https://static.ustockplus.com/logo/company/62977.png", bg: "#333333" },
  "넷마블몬스터": { logo: "https://static.ustockplus.com/logo/stock/214490.png", bg: "#333333" },
  "뱅크샐러드": { logo: "https://static.ustockplus.com/logo/company/1103.png", bg: "#00C853" },
  "LG CNS": { logo: "", bg: "#A50034" },
  "서울보증보험": { logo: "", bg: "#1976D2" },
  "에이피알": { logo: "", bg: "#43A047" },
  "에임드바이오": { logo: "", bg: "#43A047" },
  "크래프톤": { logo: "", bg: "#333333" },
  "넥슨게임즈": { logo: "", bg: "#1976D2" },
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
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
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
