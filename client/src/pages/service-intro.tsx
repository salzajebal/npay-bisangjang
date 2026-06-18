import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { SiteLogoBadge } from "@/components/site-logo";

export default function ServiceIntroPage() {
  return (
    <div className="min-h-screen bg-white" data-testid="page-service-intro">
      <header className="border-b border-[#E0E2E4] bg-white sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/">
            <span className="flex items-center gap-1.5 cursor-pointer" data-testid="link-home">
              <SiteLogoBadge size={24} />
            </span>
          </Link>
          <Link href="/">
            <span className="flex items-center gap-1 text-[13px] text-[#585B5E] hover:text-[#14181B] cursor-pointer" data-testid="link-back-home">
              <ArrowLeft className="w-4 h-4" />
              홈으로
            </span>
          </Link>
        </div>
      </header>

      <div className="max-w-[800px] mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-[#14181B] mb-6" data-testid="text-service-title">서비스소개</h1>

        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-[#F3F5F6] flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[#9D9FA0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-[#9D9FA0] text-[15px]">서비스 소개 내용이 준비 중입니다.</p>
        </div>
      </div>
    </div>
  );
}
