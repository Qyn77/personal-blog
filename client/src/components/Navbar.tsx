/*
 * 设计哲学：日式极简主义
 * 导航栏：极简，左对齐博客名，右侧导航链接
 * 滚动时背景微透明，细线底部分隔
 */

import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";

const NAV_LINKS = [
  { href: "/", label: "首页" },
  { href: "/blog", label: "文章" },
  { href: "/archive", label: "归档" },
  { href: "/about", label: "关于" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#FAFAF8]/95 backdrop-blur-sm border-b border-[#1A1A1A]/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <nav className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <span className="flex items-center gap-3 group">
              <span
                className="text-[#1A1A1A] font-bold text-xl tracking-tight"
                style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
              >
                墨迹
              </span>
              <span
                className="text-[#6B6B6B] text-xs tracking-[0.15em] uppercase hidden sm:block"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                / ink & thought
              </span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <ul className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => {
              const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
              return (
                <li key={link.href}>
                  <Link href={link.href}>
                    <span
                      className={`relative text-sm tracking-wide transition-colors duration-150 underline-animate ${
                        isActive
                          ? "text-[#1A1A1A] font-medium"
                          : "text-[#6B6B6B] hover:text-[#1A1A1A]"
                      }`}
                      style={{ fontFamily: "'Noto Serif SC', serif" }}
                    >
                      {link.label}
                      {isActive && (
                        <span className="absolute -bottom-0.5 left-0 right-0 h-px bg-[#1A1A1A]" />
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="菜单"
          >
            <span
              className={`block w-5 h-px bg-[#1A1A1A] transition-all duration-200 ${
                menuOpen ? "rotate-45 translate-y-2" : ""
              }`}
            />
            <span
              className={`block w-5 h-px bg-[#1A1A1A] transition-all duration-200 ${
                menuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block w-5 h-px bg-[#1A1A1A] transition-all duration-200 ${
                menuOpen ? "-rotate-45 -translate-y-2" : ""
              }`}
            />
          </button>
        </nav>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-[#1A1A1A]/10 py-4">
            <ul className="flex flex-col gap-4">
              {NAV_LINKS.map((link) => {
                const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
                return (
                  <li key={link.href}>
                    <Link href={link.href}>
                      <span
                        className={`text-sm tracking-wide ${
                          isActive ? "text-[#1A1A1A] font-medium" : "text-[#6B6B6B]"
                        }`}
                        style={{ fontFamily: "'Noto Serif SC', serif" }}
                      >
                        {link.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}
