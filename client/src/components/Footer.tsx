/*
 * 设计哲学：日式极简主义
 * 页脚：极简，细线分隔，等宽字体元信息 + 订阅表单
 */

import SubscribeForm from "./SubscribeForm";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-[#1A1A1A]/10 dark:border-[#F5F5F5]/10 py-12 bg-[#FAFAF8] dark:bg-[#1A1A1A]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
          <div className="shrink-0">
            <p
              className="text-[#1A1A1A] dark:text-[#F5F5F5] font-semibold text-lg mb-1"
              style={{
                fontFamily: "'Playfair Display', 'Noto Serif SC', serif",
              }}
            >
              墨迹
            </p>
            <p
              className="text-[#6B6B6B] dark:text-[#A0A0A0] text-xs tracking-[0.1em]"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              思考 · 写作 · 生活
            </p>
          </div>

          <div className="w-full md:w-auto md:flex-1 md:max-w-xs md:mx-4">
            <SubscribeForm />
          </div>

          <div className="shrink-0 flex flex-col items-start md:items-end gap-2">
            <p
              className="text-[#9B9B9B] dark:text-[#808080] text-xs tracking-[0.08em]"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              © {year} 墨迹博客
            </p>
            <p
              className="text-[#C4C4C0] dark:text-[#555555] text-xs"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              以文字对抗遗忘
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
