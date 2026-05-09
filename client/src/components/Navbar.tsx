/*
 * 设计哲学：日式极简主义
 * 导航栏：极简，左对齐博客名，右侧导航链接
 * 滚动时背景微透明，细线底部分隔
 */

import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";

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
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#FAFAF8]/95 dark:bg-[#1A1A1A]/95 backdrop-blur-sm border-b border-[#1A1A1A]/10 dark:border-[#F5F5F5]/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <nav className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <span className="flex items-center gap-3 group">
              <span
                className="text-[#1A1A1A] dark:text-[#F5F5F5] font-bold text-xl tracking-tight transition-colors"
                style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
              >
                墨迹
              </span>
              <span
                className="text-[#6B6B6B] dark:text-[#A0A0A0] text-xs tracking-[0.15em] uppercase hidden sm:block transition-colors"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                / ink & thought
              </span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <ul className="flex items-center gap-8">
              {NAV_LINKS.map((link) => {
                const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
                return (
                  <li key={link.href}>
                    <Link href={link.href}>
                      <span
                        className={`relative text-sm tracking-wide transition-colors duration-150 underline-animate ${
                          isActive
                            ? "text-[#1A1A1A] dark:text-[#F5F5F5] font-medium"
                            : "text-[#6B6B6B] dark:text-[#A0A0A0] hover:text-[#1A1A1A] dark:hover:text-[#F5F5F5]"
                        }`}
                        style={{ fontFamily: "'Noto Serif SC', serif" }}
                      >
                        {link.label}
                        {isActive && (
                          <span className="absolute -bottom-0.5 left-0 right-0 h-px bg-[#1A1A1A] dark:bg-[#F5F5F5]" />
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-colors duration-200 hover:bg-[#F0F0EE] dark:hover:bg-[#22222A] text-[#1A1A1A] dark:text-[#F5F5F5]"
              aria-label="切换深色模式"
              title={theme === "light" ? "切换到深色模式" : "切换到浅色模式"}
            >
              {theme === "light" ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="菜单"
          >
            <span
              className={`block w-5 h-px bg-[#1A1A1A] dark:bg-[#F5F5F5] transition-all duration-200 ${
                menuOpen ? "rotate-45 translate-y-2" : ""
              }`}
            />
            <span
              className={`block w-5 h-px bg-[#1A1A1A] dark:bg-[#F5F5F5] transition-all duration-200 ${
                menuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block w-5 h-px bg-[#1A1A1A] dark:bg-[#F5F5F5] transition-all duration-200 ${
                menuOpen ? "-rotate-45 -translate-y-2" : ""
              }`}
            />
          </button>
        </nav>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-[#1A1A1A]/10 dark:border-[#F5F5F5]/10 py-4">
            <ul className="flex flex-col gap-4">
              {NAV_LINKS.map((link) => {
                const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
                return (
                  <li key={link.href}>
                    <Link href={link.href}>
                      <span
                        className={`text-sm tracking-wide ${
                          isActive
                            ? "text-[#1A1A1A] dark:text-[#F5F5F5] font-medium"
                            : "text-[#6B6B6B] dark:text-[#A0A0A0]"
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
            {/* Mobile Theme Toggle */}
            <div className="mt-4 pt-4 border-t border-[#1A1A1A]/10 dark:border-[#F5F5F5]/10">
              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg transition-colors duration-200 hover:bg-[#F0F0EE] dark:hover:bg-[#22222A] text-[#1A1A1A] dark:text-[#F5F5F5]"
                aria-label="切换深色模式"
              >
                {theme === "light" ? (
                  <>
                    <Moon className="w-4 h-4" />
                    <span
                      className="text-sm"
                      style={{ fontFamily: "'Noto Serif SC', serif" }}
                    >
                      深色模式
                    </span>
                  </>
                ) : (
                  <>
                    <Sun className="w-4 h-4" />
                    <span
                      className="text-sm"
                      style={{ fontFamily: "'Noto Serif SC', serif" }}
                    >
                      浅色模式
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
