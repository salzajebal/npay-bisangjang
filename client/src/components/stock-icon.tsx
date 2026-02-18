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
  "현대엔지니어링": { logo: "https://static.ustockplus.com/admin/2023-01/d9602423-0b56-419f-8737-8d30c015e379.png", bg: "#003DA5" },
  "이브이알스튜디오": { logo: "https://static.ustockplus.com/logo/company/563.png", bg: "#6B4CE6" },
  "에스팀": { logo: "https://static.ustockplus.com/admin/2025-09/414cc8ab-b009-41ba-b180-e5f2ba97a32e.png", bg: "#333333" },
  "서울로보틱스": { logo: "https://static.ustockplus.com/logo/company/76915.png", bg: "#333333" },
  "에이치디현대삼호": { logo: "https://static.ustockplus.com/admin/2023-01/d9602423-0b56-419f-8737-8d30c015e379.png", bg: "#1976D2" },
  "카카오모빌리티": { logo: "https://static.ustockplus.com/logo/company/99.png", bg: "#FEE500" },
  "현대카드": { logo: "https://static.ustockplus.com/admin/2023-01/ec31a6fe-2148-477e-bdde-e6efcfd95224.png", bg: "#333333" },
  "스트라드비젼": { logo: "https://static.ustockplus.com/logo/company/77183.png", bg: "#1976D2" },
  "코스모로보틱스": { logo: "https://static.ustockplus.com/logo/company/62977.png", bg: "#333333" },
  "뱅크샐러드": { logo: "https://static.ustockplus.com/logo/company/1103.png", bg: "#00C853" },
  "카나프테라퓨틱스": { logo: "https://static.ustockplus.com/logo/company/77417.png", bg: "#333333" },
  "에임드바이오": { logo: "https://static.ustockplus.com/logo/company/77551.png", bg: "#43A047" },
  "직방": { logo: "https://static.ustockplus.com/logo/company/1419.png", bg: "#333333" },
  "당근": { logo: "https://static.ustockplus.com/logo/company/1424.png", bg: "#FF6F00" },
  "원스토어": { logo: "https://static.ustockplus.com/logo/company/1105.png", bg: "#E8344E" },
  "지그재그": { logo: "https://static.ustockplus.com/logo/company/1427.png", bg: "#333333" },
  "클래스101": { logo: "https://static.ustockplus.com/logo/company/1428.png", bg: "#E8344E" },
  "마이리얼트립": { logo: "https://static.ustockplus.com/logo/company/1430.png", bg: "#3182f6" },
  "리센스메디컬": { logo: "https://static.ustockplus.com/logo/company/105.png", bg: "#1976D2" },
  "비상장주식": { logo: "", bg: "#E8344E" },
};

const STOCK_CODE_MAP: Record<string, string> = {
  "카카오뱅크": "323410",
  "삼성전자": "005930",
  "SK하이닉스": "000660",
  "LG에너지솔루션": "373220",
  "삼성바이오로직스": "207940",
  "현대자동차": "005380",
  "기아": "000270",
  "셀트리온": "068270",
  "KB금융": "105560",
  "POSCO홀딩스": "005490",
  "신한지주": "055550",
  "삼성SDI": "006400",
  "LG화학": "051910",
  "NAVER": "035420",
  "카카오": "035720",
  "하나금융지주": "086790",
  "현대모비스": "012330",
  "삼성물산": "028260",
  "SK이노베이션": "096770",
  "LG전자": "066570",
  "삼성생명": "032830",
  "한국전력": "015760",
  "SK텔레콤": "017670",
  "KT": "030200",
  "우리금융지주": "316140",
  "삼성화재": "000810",
  "포스코인터내셔널": "047050",
  "SK": "034730",
  "한화에어로스페이스": "012450",
  "대한항공": "003490",
  "HMM": "011200",
  "LG": "003550",
  "고려아연": "010130",
  "삼성전기": "009150",
  "한화솔루션": "009830",
  "한국타이어앤테크놀로지": "161390",
  "CJ제일제당": "097950",
  "S-Oil": "010950",
  "두산에너빌리티": "034020",
  "롯데케미칼": "011170",
  "엔씨소프트": "036570",
  "크래프톤": "259960",
  "삼성에스디에스": "018260",
  "NH투자증권": "005940",
  "미래에셋증권": "006800",
  "한국투자증권": "071050",
  "키움증권": "039490",
  "대신증권": "003540",
  "SK바이오팜": "326030",
  "SK바이오사이언스": "302440",
  "에코프로비엠": "247540",
  "에코프로": "086520",
  "포스코퓨처엠": "003670",
  "알테오젠": "196170",
  "한미약품": "128940",
  "유한양행": "000100",
  "녹십자": "006280",
  "JYP엔터": "035900",
  "HYBE": "352820",
  "하이브": "352820",
  "SM엔터": "041510",
  "넷마블": "251270",
  "펄어비스": "263750",
  "컴투스": "078340",
  "CJ ENM": "035760",
  "스튜디오드래곤": "253450",
  "위메이드": "112040",
  "SK스퀘어": "402340",
  "LG이노텍": "011070",
  "두산밥캣": "241560",
  "한화오션": "042660",
  "HD현대": "267250",
  "HD한국조선해양": "009540",
  "HD현대중공업": "329180",
  "현대건설": "000720",
  "GS건설": "006360",
  "대우건설": "047040",
  "DL이앤씨": "375500",
  "한전KPS": "051600",
  "한국가스공사": "036460",
  "에스원": "012750",
  "CJ대한통운": "000120",
  "아모레퍼시픽": "090430",
  "LG생활건강": "051900",
  "호텔신라": "008770",
  "F&F": "383220",
  "한섬": "020000",
  "쏘카": "403550",
  "카카오게임즈": "293490",
  "한화": "000880",
  "한화시스템": "272210",
  "LIG넥스원": "079550",
  "현대로템": "064350",
  "풍산": "103140",
  "LG디스플레이": "034220",
  "한국항공우주": "047810",
  "넥슨게임즈": "225570",
  "서울보증보험": "004370",
  "에이피알": "278470",
  "레인보우로보틱스": "277810",
  "두산로보틱스": "454910",
  "메디톡스": "086900",
  "휴젤": "145020",
  "파마리서치": "214450",
  "제넥신": "095700",
  "씨젠": "096530",
  "에이비엘바이오": "298380",
  "진원생명과학": "011000",
  "LG CNS": "064400",
  "마켓컬리": "408480",
};

const BRAND_COLORS: Record<string, string> = {
  "카카오": "#FEE500",
  "삼성": "#1428A0",
  "SK": "#E8344E",
  "LG": "#A50034",
  "현대": "#003DA5",
  "한화": "#F37321",
  "HD": "#003DA5",
  "POSCO": "#004B93",
  "포스코": "#004B93",
  "CJ": "#E8344E",
  "롯데": "#E8344E",
  "GS": "#F37321",
  "DL": "#003DA5",
  "NH": "#003DA5",
  "KB": "#FFBC00",
  "두산": "#1976D2",
};

function getBrandColor(name: string): string {
  for (const [brand, color] of Object.entries(BRAND_COLORS)) {
    if (name.startsWith(brand) || name.includes(brand)) return color;
  }
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ["#E8344E", "#1976D2", "#43A047", "#F37321", "#003DA5", "#333333", "#6B4CE6", "#00B4D8", "#5F0080"];
  return colors[Math.abs(hash) % colors.length];
}

function getLogoUrl(name: string): string | null {
  const entry = STOCK_LOGOS[name];
  if (entry?.logo) return entry.logo;

  const code = STOCK_CODE_MAP[name];
  if (code) {
    return `https://file.alphasquare.co.kr/media/images/stock_logo/kr/${code}.png`;
  }

  return null;
}

export function StockIcon({ name, size = 32 }: { name: string; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const logoUrl = getLogoUrl(name);
  const bg = STOCK_LOGOS[name]?.bg || getBrandColor(name);
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
        loading="lazy"
        decoding="async"
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
  return STOCK_LOGOS[name]?.bg || getBrandColor(name);
}
