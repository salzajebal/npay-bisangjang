import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Menu, X, LogIn, LogOut, User } from "lucide-react";
import { SiteLogoBadge } from "@/components/site-logo";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

const NAV_LINKS = [
  { label: "공모주 IPO 캘린더", href: "/ipo-calendar" },
  { label: "서비스소개", href: "/service" },
  { label: "이벤트", href: "/events" },
  { label: "공지사항", href: "/notices" },
];

export function GlobalNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  const { data: user } = useQuery<{ id: number; fullName: string; username: string } | null>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  async function handleLogout() {
    try {
      await apiRequest("POST", "/api/auth/logout");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    } catch {}
  }

  return (
    <header className="sticky top-0 z-[9999] bg-white border-b border-[#E0E2E4]" data-testid="global-nav">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex items-center justify-between h-14 gap-4">
          {/* Logo */}
          <Link href="/">
            <div className="shrink-0 cursor-pointer" data-testid="link-home-nav">
              <SiteLogoBadge size={30} />
            </div>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1 ml-4">
            {NAV_LINKS.map((link) => {
              const isActive = location === link.href || location.startsWith(link.href + "/");
              return (
                <Link key={link.label} href={link.href}>
                  <span
                    className={`text-[13px] px-3 py-1.5 rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                      isActive
                        ? "text-[#03C75A] font-bold"
                        : "text-[#585B5E] hover:text-[#14181B]"
                    }`}
                    data-testid={`link-nav-${link.label}`}
                  >
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {user ? (
              <>
                <Link href="/dashboard">
                  <span className="flex items-center gap-1 text-sm text-[#585B5E] hover:text-[#14181B] cursor-pointer">
                    <User className="w-4 h-4" />
                    {user.fullName}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-sm text-[#585B5E] hover:text-[#F73631] transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <span className="flex items-center gap-1 text-sm text-white bg-[#03C75A] px-3 py-1.5 rounded-md hover:bg-[#02b350] transition-colors cursor-pointer">
                    <LogIn className="w-3.5 h-3.5" />
                    로그인
                  </span>
                </Link>
                <Link href="/register">
                  <span className="text-sm text-[#585B5E] hover:text-[#14181B] cursor-pointer">회원가입</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex items-center justify-center w-9 h-9"
            onClick={() => setMobileOpen(!mobileOpen)}
            data-testid="button-mobile-menu-nav"
          >
            {mobileOpen ? <X className="w-5 h-5 text-[#222]" /> : <Menu className="w-5 h-5 text-[#222]" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-[#E0E2E4] px-4 py-3 space-y-1">
          {NAV_LINKS.map((link) => {
            const isActive = location === link.href;
            return (
              <Link key={link.label} href={link.href}>
                <span
                  onClick={() => setMobileOpen(false)}
                  className={`block text-sm py-2.5 border-b border-[#F3F5F6] cursor-pointer ${
                    isActive ? "text-[#03C75A] font-bold" : "text-[#585B5E]"
                  }`}
                >
                  {link.label}
                </span>
              </Link>
            );
          })}
          <div className="pt-3 flex items-center gap-3">
            {user ? (
              <>
                <Link href="/dashboard">
                  <span className="text-sm text-[#14181B] font-medium cursor-pointer">{user.fullName}</span>
                </Link>
                <button onClick={handleLogout} className="text-sm text-[#03C75A]">로그아웃</button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <span className="text-sm text-white bg-[#03C75A] px-4 py-1.5 rounded-md cursor-pointer">로그인</span>
                </Link>
                <Link href="/register">
                  <span className="text-sm text-[#585B5E] cursor-pointer">회원가입</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
