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
  "오톰": { logo: "https://static.ustockplus.com/logo/company/77025.png", bg: "#333333" },
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
  "비상장주식": { logo: "", bg: "#E8344E" },

  "카카오뱅크": { logo: "https://static.ustockplus.com/logo/stock/323410.png", bg: "#FFCD00" },
  "카카오": { logo: "https://static.ustockplus.com/logo/stock/035720.png", bg: "#FEE500" },
  "카카오게임즈": { logo: "https://static.ustockplus.com/logo/stock/293490.png", bg: "#FEE500" },
  "삼성전자": { logo: "https://static.ustockplus.com/logo/stock/005930.png", bg: "#1428A0" },
  "SK하이닉스": { logo: "https://static.ustockplus.com/logo/stock/000660.png", bg: "#E8344E" },
  "LG에너지솔루션": { logo: "https://static.ustockplus.com/logo/stock/373220.png", bg: "#A50034" },
  "삼성바이오로직스": { logo: "https://static.ustockplus.com/logo/stock/207940.png", bg: "#1428A0" },
  "현대자동차": { logo: "https://static.ustockplus.com/logo/stock/005380.png", bg: "#003DA5" },
  "기아": { logo: "https://static.ustockplus.com/logo/stock/000270.png", bg: "#05141F" },
  "셀트리온": { logo: "https://static.ustockplus.com/logo/stock/068270.png", bg: "#003DA5" },
  "KB금융": { logo: "https://static.ustockplus.com/logo/stock/105560.png", bg: "#FFBC00" },
  "POSCO홀딩스": { logo: "https://static.ustockplus.com/logo/stock/005490.png", bg: "#004B93" },
  "신한지주": { logo: "https://static.ustockplus.com/logo/stock/055550.png", bg: "#0046FF" },
  "삼성SDI": { logo: "https://static.ustockplus.com/logo/stock/006400.png", bg: "#1428A0" },
  "LG화학": { logo: "https://static.ustockplus.com/logo/stock/051910.png", bg: "#A50034" },
  "NAVER": { logo: "https://static.ustockplus.com/logo/stock/035420.png", bg: "#03CF5D" },
  "하나금융지주": { logo: "https://static.ustockplus.com/logo/stock/086790.png", bg: "#008C73" },
  "현대모비스": { logo: "https://static.ustockplus.com/logo/stock/012330.png", bg: "#003DA5" },
  "삼성물산": { logo: "https://static.ustockplus.com/logo/stock/028260.png", bg: "#1428A0" },
  "SK이노베이션": { logo: "https://static.ustockplus.com/logo/stock/096770.png", bg: "#E8344E" },
  "LG전자": { logo: "https://static.ustockplus.com/logo/stock/066570.png", bg: "#A50034" },
  "삼성생명": { logo: "https://static.ustockplus.com/logo/stock/032830.png", bg: "#1428A0" },
  "한국전력": { logo: "https://static.ustockplus.com/logo/stock/015760.png", bg: "#1976D2" },
  "SK텔레콤": { logo: "https://static.ustockplus.com/logo/stock/017670.png", bg: "#E8344E" },
  "KT": { logo: "https://static.ustockplus.com/logo/stock/030200.png", bg: "#E8344E" },
  "우리금융지주": { logo: "https://static.ustockplus.com/logo/stock/316140.png", bg: "#0066B3" },
  "삼성화재": { logo: "https://static.ustockplus.com/logo/stock/000810.png", bg: "#1428A0" },
  "포스코인터내셔널": { logo: "https://static.ustockplus.com/logo/stock/047050.png", bg: "#004B93" },
  "SK": { logo: "https://static.ustockplus.com/logo/stock/034730.png", bg: "#E8344E" },
  "한화에어로스페이스": { logo: "https://static.ustockplus.com/logo/stock/012450.png", bg: "#F37321" },
  "대한항공": { logo: "https://static.ustockplus.com/logo/stock/003490.png", bg: "#00256C" },
  "HMM": { logo: "https://static.ustockplus.com/logo/stock/011200.png", bg: "#003DA5" },
  "LG": { logo: "https://static.ustockplus.com/logo/stock/003550.png", bg: "#A50034" },
  "고려아연": { logo: "https://static.ustockplus.com/logo/stock/010130.png", bg: "#003DA5" },
  "삼성전기": { logo: "https://static.ustockplus.com/logo/stock/009150.png", bg: "#1428A0" },
  "한화솔루션": { logo: "https://static.ustockplus.com/logo/stock/009830.png", bg: "#F37321" },
  "CJ제일제당": { logo: "https://static.ustockplus.com/logo/stock/097950.png", bg: "#E8344E" },
  "S-Oil": { logo: "https://static.ustockplus.com/logo/stock/010950.png", bg: "#FFB300" },
  "두산에너빌리티": { logo: "https://static.ustockplus.com/logo/stock/034020.png", bg: "#1976D2" },
  "롯데케미칼": { logo: "https://static.ustockplus.com/logo/stock/011170.png", bg: "#E8344E" },
  "엔씨소프트": { logo: "https://static.ustockplus.com/logo/stock/036570.png", bg: "#333333" },
  "크래프톤": { logo: "https://static.ustockplus.com/logo/stock/259960.png", bg: "#333333" },
  "삼성에스디에스": { logo: "https://static.ustockplus.com/logo/stock/018260.png", bg: "#1428A0" },
  "NH투자증권": { logo: "https://static.ustockplus.com/logo/stock/005940.png", bg: "#003DA5" },
  "미래에셋증권": { logo: "https://static.ustockplus.com/logo/stock/006800.png", bg: "#F37321" },
  "한국투자증권": { logo: "https://static.ustockplus.com/logo/stock/071050.png", bg: "#003DA5" },
  "키움증권": { logo: "https://static.ustockplus.com/logo/stock/039490.png", bg: "#F37321" },
  "대신증권": { logo: "https://static.ustockplus.com/logo/stock/003540.png", bg: "#1976D2" },
  "SK바이오팜": { logo: "https://static.ustockplus.com/logo/stock/326030.png", bg: "#E8344E" },
  "SK바이오사이언스": { logo: "https://static.ustockplus.com/logo/stock/302440.png", bg: "#E8344E" },
  "에코프로비엠": { logo: "https://static.ustockplus.com/logo/stock/247540.png", bg: "#43A047" },
  "에코프로": { logo: "https://static.ustockplus.com/logo/stock/086520.png", bg: "#43A047" },
  "포스코퓨처엠": { logo: "https://static.ustockplus.com/logo/stock/003670.png", bg: "#004B93" },
  "알테오젠": { logo: "https://static.ustockplus.com/logo/stock/196170.png", bg: "#1976D2" },
  "한미약품": { logo: "https://static.ustockplus.com/logo/stock/128940.png", bg: "#003DA5" },
  "유한양행": { logo: "https://static.ustockplus.com/logo/stock/000100.png", bg: "#43A047" },
  "녹십자": { logo: "https://static.ustockplus.com/logo/stock/006280.png", bg: "#E8344E" },
  "JYP엔터": { logo: "https://static.ustockplus.com/logo/stock/035900.png", bg: "#333333" },
  "HYBE": { logo: "https://static.ustockplus.com/logo/stock/352820.png", bg: "#333333" },
  "하이브": { logo: "https://static.ustockplus.com/logo/stock/352820.png", bg: "#333333" },
  "SM엔터": { logo: "https://static.ustockplus.com/logo/stock/041510.png", bg: "#E8344E" },
  "넷마블": { logo: "https://static.ustockplus.com/logo/stock/251270.png", bg: "#333333" },
  "펄어비스": { logo: "https://static.ustockplus.com/logo/stock/263750.png", bg: "#333333" },
  "컴투스": { logo: "https://static.ustockplus.com/logo/stock/078340.png", bg: "#1976D2" },
  "CJ ENM": { logo: "https://static.ustockplus.com/logo/stock/035760.png", bg: "#E8344E" },
  "스튜디오드래곤": { logo: "https://static.ustockplus.com/logo/stock/253450.png", bg: "#333333" },
  "위메이드": { logo: "https://static.ustockplus.com/logo/stock/112040.png", bg: "#333333" },
  "쿠팡": { logo: "https://static.ustockplus.com/logo/stock/CPNG.png", bg: "#E8344E" },
  "SK스퀘어": { logo: "https://static.ustockplus.com/logo/stock/402340.png", bg: "#E8344E" },
  "LG이노텍": { logo: "https://static.ustockplus.com/logo/stock/011070.png", bg: "#A50034" },
  "두산밥캣": { logo: "https://static.ustockplus.com/logo/stock/241560.png", bg: "#333333" },
  "한화오션": { logo: "https://static.ustockplus.com/logo/stock/042660.png", bg: "#F37321" },
  "HD현대": { logo: "https://static.ustockplus.com/logo/stock/267250.png", bg: "#003DA5" },
  "HD한국조선해양": { logo: "https://static.ustockplus.com/logo/stock/009540.png", bg: "#003DA5" },
  "HD현대중공업": { logo: "https://static.ustockplus.com/logo/stock/329180.png", bg: "#003DA5" },
  "현대건설": { logo: "https://static.ustockplus.com/logo/stock/000720.png", bg: "#003DA5" },
  "GS건설": { logo: "https://static.ustockplus.com/logo/stock/006360.png", bg: "#F37321" },
  "대우건설": { logo: "https://static.ustockplus.com/logo/stock/047040.png", bg: "#003DA5" },
  "DL이앤씨": { logo: "https://static.ustockplus.com/logo/stock/375500.png", bg: "#003DA5" },
  "한전KPS": { logo: "https://static.ustockplus.com/logo/stock/051600.png", bg: "#1976D2" },
  "한국가스공사": { logo: "https://static.ustockplus.com/logo/stock/036460.png", bg: "#003DA5" },
  "에스원": { logo: "https://static.ustockplus.com/logo/stock/012750.png", bg: "#1428A0" },
  "CJ대한통운": { logo: "https://static.ustockplus.com/logo/stock/000120.png", bg: "#E8344E" },
  "아모레퍼시픽": { logo: "https://static.ustockplus.com/logo/stock/090430.png", bg: "#333333" },
  "LG생활건강": { logo: "https://static.ustockplus.com/logo/stock/051900.png", bg: "#A50034" },
  "호텔신라": { logo: "https://static.ustockplus.com/logo/stock/008770.png", bg: "#333333" },
  "F&F": { logo: "https://static.ustockplus.com/logo/stock/383220.png", bg: "#333333" },
  "한섬": { logo: "https://static.ustockplus.com/logo/stock/020000.png", bg: "#333333" },
  "직방": { logo: "https://static.ustockplus.com/logo/company/1419.png", bg: "#333333" },
  "마켓컬리": { logo: "https://static.ustockplus.com/logo/stock/408480.png", bg: "#5F0080" },
  "쏘카": { logo: "https://static.ustockplus.com/logo/stock/403550.png", bg: "#00B4D8" },
  "원스토어": { logo: "https://static.ustockplus.com/logo/company/1105.png", bg: "#E8344E" },
  "당근": { logo: "https://static.ustockplus.com/logo/company/1424.png", bg: "#FF6F00" },
  "LG CNS": { logo: "https://static.ustockplus.com/logo/company/80119.png", bg: "#A50034" },
  "서울보증보험": { logo: "https://static.ustockplus.com/logo/stock/004370.png", bg: "#1976D2" },
  "에이피알": { logo: "https://static.ustockplus.com/logo/stock/278470.png", bg: "#333333" },
  "한국항공우주": { logo: "https://static.ustockplus.com/logo/stock/047810.png", bg: "#003DA5" },
  "한화": { logo: "https://static.ustockplus.com/logo/stock/000880.png", bg: "#F37321" },
  "한화시스템": { logo: "https://static.ustockplus.com/logo/stock/272210.png", bg: "#F37321" },
  "LIG넥스원": { logo: "https://static.ustockplus.com/logo/stock/079550.png", bg: "#003DA5" },
  "현대로템": { logo: "https://static.ustockplus.com/logo/stock/064350.png", bg: "#003DA5" },
  "풍산": { logo: "https://static.ustockplus.com/logo/stock/103140.png", bg: "#003DA5" },
  "LG디스플레이": { logo: "https://static.ustockplus.com/logo/stock/034220.png", bg: "#A50034" },
  "넥슨게임즈": { logo: "https://static.ustockplus.com/logo/stock/225570.png", bg: "#1976D2" },
  "한국타이어앤테크놀로지": { logo: "https://static.ustockplus.com/logo/stock/161390.png", bg: "#E8344E" },
  "에임드바이오": { logo: "https://static.ustockplus.com/logo/company/77551.png", bg: "#43A047" },
  "레인보우로보틱스": { logo: "https://static.ustockplus.com/logo/stock/277810.png", bg: "#333333" },
  "두산로보틱스": { logo: "https://static.ustockplus.com/logo/stock/454910.png", bg: "#1976D2" },
  "메디톡스": { logo: "https://static.ustockplus.com/logo/stock/086900.png", bg: "#333333" },
  "휴젤": { logo: "https://static.ustockplus.com/logo/stock/145020.png", bg: "#1976D2" },
  "파마리서치": { logo: "https://static.ustockplus.com/logo/stock/214450.png", bg: "#003DA5" },
  "제넥신": { logo: "https://static.ustockplus.com/logo/stock/095700.png", bg: "#43A047" },
  "씨젠": { logo: "https://static.ustockplus.com/logo/stock/096530.png", bg: "#003DA5" },
  "에이비엘바이오": { logo: "https://static.ustockplus.com/logo/stock/298380.png", bg: "#003DA5" },
  "카나프테라퓨틱스": { logo: "https://static.ustockplus.com/logo/company/77417.png", bg: "#333333" },
  "엑스비스": { logo: "https://static.ustockplus.com/logo/company/77550.png", bg: "#333333" },
  "리디": { logo: "https://static.ustockplus.com/logo/company/1122.png", bg: "#333333" },
  "버킷플레이스": { logo: "https://static.ustockplus.com/logo/company/1097.png", bg: "#35C5F0" },
  "지그재그": { logo: "https://static.ustockplus.com/logo/company/1427.png", bg: "#333333" },
  "클래스101": { logo: "https://static.ustockplus.com/logo/company/1428.png", bg: "#E8344E" },
  "마이리얼트립": { logo: "https://static.ustockplus.com/logo/company/1430.png", bg: "#3182f6" },
  "진원생명과학": { logo: "https://static.ustockplus.com/logo/stock/011000.png", bg: "#43A047" },
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

export function StockIcon({ name, size = 32 }: { name: string; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const entry = STOCK_LOGOS[name];
  const logoUrl = entry?.logo;
  const bg = entry?.bg || getBrandColor(name);
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
