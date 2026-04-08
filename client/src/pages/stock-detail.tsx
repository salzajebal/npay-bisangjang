import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { StockIcon } from "@/components/stock-icon";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, TrendingUp, TrendingDown, Minus, Calendar, Building2, BarChart3 } from "lucide-react";
import type { IpoStock } from "@shared/schema";
import { useState } from "react";

const STOCK_EXTRA: Record<string, { category: string; desc: string }> = {
  "두나무": { category: "핀테크", desc: "두나무는 국내 최대 암호화폐 거래소 업비트를 운영하는 핀테크 기업입니다." },
  "빗썸": { category: "핀테크", desc: "빗썸은 국내 주요 암호화폐 거래소로, 다양한 디지털 자산을 거래할 수 있습니다." },
  "무신사": { category: "패션/커머스", desc: "무신사는 국내 최대 온라인 패션 플랫폼으로 다양한 브랜드를 보유한 커머스 기업입니다." },
  "토스": { category: "핀테크", desc: "토스는 간편 송금 서비스로 시작해 종합 금융 플랫폼으로 성장한 핀테크 기업입니다." },
  "야놀자": { category: "여행/숙박", desc: "야놀자는 국내 1위 여가 플랫폼으로 호텔, 레저, 항공 등 여행 서비스를 제공합니다." },
  "컬리": { category: "식품/커머스", desc: "컬리는 새벽 배송 서비스 '마켓컬리'로 유명한 프리미엄 식품 커머스 기업입니다." },
  "오아시스": { category: "식품/커머스", desc: "오아시스는 유기농·친환경 식품을 중심으로 한 신선식품 새벽 배송 기업입니다." },
  "케이뱅크": { category: "인터넷은행", desc: "케이뱅크는 국내 최초 인터넷전문은행으로 다양한 금융 서비스를 제공합니다." },
  "한패스": { category: "공모주", desc: "한패스는 공모주 청약 서비스로 투자자들에게 공모주 참여 기회를 제공하는 기업입니다." },
  "채비": { category: "공모주/전기차", desc: "채비는 전기차 충전 인프라를 구축·운영하는 기업으로 공모주 청약을 진행 중입니다." },
  "코스모로보틱스": { category: "공모주/로봇", desc: "코스모로보틱스는 산업용 로봇 솔루션을 개발하는 기업으로 공모주 청약을 진행합니다." },
  "리센스메디컬": { category: "공모주/의료", desc: "리센스메디컬은 의료기기 및 헬스케어 솔루션을 개발하는 바이오 기업입니다." },
  "에스팀": { category: "일반", desc: "에스팀은 비상장 종목으로 투자자들의 관심을 받고 있는 기업입니다." },
  "에너진": { category: "에너지", desc: "에너진은 신재생에너지 및 배터리 관련 사업을 영위하는 기업입니다." },
  "오톰": { category: "AI/로봇", desc: "오톰은 인공지능과 로봇 기술을 결합한 솔루션을 개발하는 기업입니다." },
  "이브이알스튜디오": { category: "메타버스/VR", desc: "이브이알스튜디오는 VR·AR 콘텐츠 제작 및 메타버스 플랫폼을 운영하는 기업입니다." },
  "에스엠랩": { category: "소재", desc: "에스엠랩은 첨단 소재 연구개발을 하는 기업입니다." },
  "케이솔루션": { category: "IT솔루션", desc: "케이솔루션은 기업용 IT 솔루션 및 소프트웨어를 개발하는 기업입니다." },
  "현대엔지니어링": { category: "건설/플랜트", desc: "현대엔지니어링은 현대그룹 계열의 건설·플랜트 전문 기업입니다." },
};

export default function StockDetailPage() {
  const { name: encodedName } = useParams<{ name: string }>();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"시세" | "IPO">("시세");

  const stockName = decodeURIComponent(encodedName || "");

  const { data: priceData, isLoading: priceLoading } = useQuery<Record<string, { currentPrice: number; changePercent: number }>>({
    queryKey: ["/api/stocks/prices", stockName],
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/stocks/prices", { stockNames: [stockName] });
      return res.json();
    },
    enabled: !!stockName,
    staleTime: 30000,
  });

  const { data: ipoList = [] } = useQuery<IpoStock[]>({
    queryKey: ["/api/ipo-stocks"],
  });

  const price = priceData?.[stockName];
  const ipoData = ipoList.find(s => s.stockName === stockName);
  const extra = STOCK_EXTRA[stockName];

  const hasPriceData = !!price;
  const hasIpoData = !!ipoData;
  const hasAnyData = hasPriceData || hasIpoData;

  const tabs: ("시세" | "IPO")[] = [
    ...(hasPriceData ? ["시세" as const] : []),
    ...(hasIpoData ? ["IPO" as const] : []),
  ];

  const changeAmt = price ? Math.round(price.currentPrice * price.changePercent / 100) : 0;
  const isUp = (price?.changePercent ?? 0) > 0;
  const isDown = (price?.changePercent ?? 0) < 0;

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      {/* 상단 헤더 */}
      <header className="bg-white border-b border-[#eee] sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => setLocation("/")} className="p-1.5 rounded-md hover:bg-[#f5f5f5] transition-colors">
            <ChevronLeft className="w-5 h-5 text-[#444]" />
          </button>
          <div className="flex items-center gap-2">
            <StockIcon name={stockName} size={28} />
            <span className="font-bold text-[#222] text-base">{stockName}</span>
          </div>
          {hasIpoData && (
            <Badge className="bg-[#E8344E] text-white text-[10px] px-1.5 py-0.5">IPO</Badge>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

        {/* 가격 정보 */}
        {priceLoading ? (
          <Card className="p-5 space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-5 w-28" />
          </Card>
        ) : hasPriceData ? (
          <Card className="p-5">
            <p className="text-3xl font-bold text-[#222] tabular-nums">
              {price!.currentPrice.toLocaleString()}원
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              {isUp && <TrendingUp className="w-4 h-4 text-[#f04452]" />}
              {isDown && <TrendingDown className="w-4 h-4 text-[#3182f6]" />}
              {!isUp && !isDown && <Minus className="w-4 h-4 text-[#999]" />}
              <span className={`text-sm font-semibold tabular-nums ${isUp ? "text-[#f04452]" : isDown ? "text-[#3182f6]" : "text-[#999]"}`}>
                {isUp ? "+" : ""}{changeAmt.toLocaleString()}원
                &nbsp;({isUp ? "+" : ""}{price!.changePercent.toFixed(2)}%)
              </span>
              <span className="text-xs text-[#bbb]">전일대비</span>
            </div>
            {extra && (
              <p className="text-xs text-[#999] mt-3 leading-relaxed">{extra.desc}</p>
            )}
          </Card>
        ) : null}

        {/* 데이터 없음 */}
        {!priceLoading && !hasAnyData && (
          <Card className="p-10 text-center">
            <BarChart3 className="w-10 h-10 mx-auto mb-3 text-[#ddd]" />
            <p className="font-medium text-[#999]">데이터가 없는 종목입니다</p>
            <p className="text-sm text-[#bbb] mt-1">현재 시세 정보를 제공하지 않는 종목입니다</p>
            <button onClick={() => setLocation("/")} className="mt-4 text-sm text-[#E8344E] hover:underline">
              메인으로 돌아가기
            </button>
          </Card>
        )}

        {/* 탭 (데이터 있을 때만) */}
        {hasAnyData && tabs.length > 0 && (
          <>
            {tabs.length > 1 && (
              <div className="flex border-b border-[#eee] bg-white rounded-t-lg overflow-hidden">
                {tabs.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? "text-[#E8344E] border-b-2 border-[#E8344E] -mb-px"
                        : "text-[#999] hover:text-[#666]"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}

            {/* 시세 탭 */}
            {(activeTab === "시세" || tabs.length === 1 && tabs[0] === "시세") && hasPriceData && (
              <Card className="p-5 space-y-0 divide-y divide-[#f5f5f5]">
                <h3 className="text-sm font-semibold text-[#444] pb-3">시세정보</h3>
                {[
                  { label: "현재가", value: `${price!.currentPrice.toLocaleString()}원`, colored: false },
                  { label: "전일대비", value: `${isUp ? "+" : ""}${changeAmt.toLocaleString()}원 (${isUp ? "+" : ""}${price!.changePercent.toFixed(2)}%)`, colored: true, up: isUp, down: isDown },
                  ...(extra ? [{ label: "업종", value: extra.category, colored: false }] : []),
                ].map(row => (
                  <div key={row.label} className="flex justify-between py-3 text-sm">
                    <span className="text-[#999]">{row.label}</span>
                    <span className={`font-medium tabular-nums ${
                      row.colored
                        ? row.up ? "text-[#f04452]" : row.down ? "text-[#3182f6]" : "text-[#999]"
                        : "text-[#222]"
                    }`}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </Card>
            )}

            {/* IPO 탭 */}
            {(activeTab === "IPO" || tabs.length === 1 && tabs[0] === "IPO") && hasIpoData && (
              <Card className="p-5 space-y-0 divide-y divide-[#f5f5f5]">
                <h3 className="text-sm font-semibold text-[#444] pb-3">공모주 청약 정보</h3>
                {[
                  ipoData!.startDate && ipoData!.endDate
                    ? { label: "청약기간", value: `${ipoData!.startDate} ~ ${ipoData!.endDate}`, icon: Calendar }
                    : null,
                  ipoData!.priceMin && ipoData!.priceMax
                    ? { label: "공모가 범위", value: `${ipoData!.priceMin.toLocaleString()}원 ~ ${ipoData!.priceMax.toLocaleString()}원`, icon: BarChart3 }
                    : null,
                  ipoData!.brokers
                    ? { label: "주관사", value: ipoData!.brokers, icon: Building2 }
                    : null,
                  ipoData!.competitionRate && ipoData!.competitionRate !== "-"
                    ? { label: "경쟁률", value: ipoData!.competitionRate, icon: TrendingUp }
                    : null,
                  ipoData!.subscriptionStatus
                    ? { label: "청약상태", value: ipoData!.subscriptionStatus, icon: null }
                    : null,
                ].filter(Boolean).map((row) => (
                  <div key={row!.label} className="flex justify-between items-center py-3 text-sm">
                    <span className="text-[#999]">{row!.label}</span>
                    <div className="flex items-center gap-1.5">
                      {row!.label === "청약상태" ? (
                        <Badge className={`text-xs ${ipoData!.subscriptionStatus === "청약진행중" ? "bg-[#E8344E] text-white" : "bg-orange-400 text-white"}`}>
                          {row!.value}
                        </Badge>
                      ) : (
                        <span className="font-medium text-[#222] text-right">{row!.value}</span>
                      )}
                    </div>
                  </div>
                ))}
              </Card>
            )}
          </>
        )}

        {/* 하단 여백 */}
        <div className="h-4" />
      </div>
    </div>
  );
}
