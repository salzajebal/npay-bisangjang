const KNOWN_MARKET_PRICES: Record<string, { price: number; change: number }> = {
  "케이뱅크": { price: 11600, change: -6.45 },
  "두나무": { price: 307000, change: 1.99 },
  "빗썸": { price: 214000, change: -3.17 },
  "무신사": { price: 25700, change: 0 },
  "오아시스": { price: 9600, change: -6.8 },
  "컬리": { price: 20300, change: -1.46 },
  "에스엠랩": { price: 1280, change: 4.07 },
  "야놀자": { price: 26900, change: 0.37 },
  "케이솔루션": { price: 7650, change: 10.87 },
  "에너진": { price: 3560, change: 7.23 },
  "오톰": { price: 15200, change: 2.35 },
  "현대엔지니어링": { price: 68500, change: -0.87 },
  "이브이알스튜디오": { price: 4350, change: 12.41 },
  "토스": { price: 185000, change: 3.52 },
  "에스팀": { price: 7500, change: 5.63 },
  "삼성전자": { price: 55300, change: -1.25 },
  "SK하이닉스": { price: 178000, change: 2.15 },
  "네이버": { price: 192500, change: -0.52 },
  "카카오": { price: 42100, change: 1.67 },
  "LG에너지솔루션": { price: 368000, change: -2.31 },
  "현대차": { price: 215000, change: 0.94 },
  "기아": { price: 89300, change: 1.12 },
  "셀트리온": { price: 178500, change: -0.78 },
  "포스코홀딩스": { price: 298000, change: -1.56 },
  "KB금융": { price: 78200, change: 0.39 },
  "신한지주": { price: 51600, change: 0.58 },
  "하나금융지주": { price: 62400, change: -0.32 },
  "삼성SDI": { price: 352000, change: -1.89 },
  "삼성바이오로직스": { price: 812000, change: 0.25 },
  "LG화학": { price: 298000, change: -1.02 },
  "한화에어로스페이스": { price: 385000, change: 3.78 },
  "크래프톤": { price: 225000, change: 2.14 },
  "두산에너빌리티": { price: 18900, change: -2.06 },
  "카카오뱅크": { price: 24500, change: 1.24 },
  "카카오페이": { price: 35200, change: -0.85 },
  "쿠팡": { price: 32400, change: 1.89 },
};

const sessionPriceCache = new Map<string, { price: number; change: number; timestamp: number }>();

function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const today = new Date().toISOString().slice(0, 10);
  for (let i = 0; i < today.length; i++) {
    const char = today.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return (Math.abs(hash) % 10000) / 10000;
}

export function getCurrentMarketPrice(stockName: string, purchasePrice: number): { currentPrice: number; changePercent: number } {
  const known = KNOWN_MARKET_PRICES[stockName];
  if (known) {
    return { currentPrice: known.price, changePercent: known.change };
  }

  const cached = sessionPriceCache.get(stockName);
  const now = Date.now();
  if (cached && (now - cached.timestamp) < 600000) {
    return { currentPrice: cached.price, changePercent: cached.change };
  }

  const rand = seededRandom(stockName);
  const variationPercent = (rand - 0.4) * 20;
  const currentPrice = Math.round(purchasePrice * (1 + variationPercent / 100));
  const changePercent = Math.round(variationPercent * 100) / 100;

  sessionPriceCache.set(stockName, { price: currentPrice, change: changePercent, timestamp: now });

  return { currentPrice, changePercent };
}

export function getMarketPriceData(stockName: string): { price: number; change: number } | null {
  return KNOWN_MARKET_PRICES[stockName] || null;
}
