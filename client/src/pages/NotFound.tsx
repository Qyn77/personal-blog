import { Link } from "wouter";
import Navbar from "@/components/Navbar";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="text-center fade-in-up">
          <p
            className="text-[#E8E8E4] text-[10rem] md:text-[12rem] font-bold leading-none select-none"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            404
          </p>
          <p
            className="text-[#1A1A1A] text-xl font-medium mb-3 -mt-4"
            style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
          >
            页面不存在
          </p>
          <p
            className="text-[#6B6B6B] text-sm mb-8"
            style={{ fontFamily: "'Noto Serif SC', serif" }}
          >
            你寻找的页面已经消失在时间的墨迹里。
          </p>
          <Link href="/">
            <span
              className="inline-block text-[#1A1A1A] text-sm tracking-[0.1em] border-b border-[#1A1A1A] pb-0.5 hover:border-opacity-50 transition-all"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              ← 回到首页
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
