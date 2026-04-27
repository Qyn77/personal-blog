/*
 * 设计哲学：日式极简主义
 * 关于页：左侧插图，右侧文字，大量留白，衬线字体
 */

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import { getRecentArticles } from "@/lib/blogData";
import { Link } from "wouter";

const ABOUT_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663603513063/Jv7YCCM3BuDSibFnxHr9Qi/about-portrait-LjyC39wzLU5FpMeSGZr8Yy.webp";

const SKILLS = [
  { label: "阅读", desc: "每年约 40-50 本书，偏爱哲学、文学与自然写作" },
  { label: "写作", desc: "坚持写日记 10 年，博客写作 2 年" },
  { label: "散步", desc: "相信行走是最好的思考方式" },
  { label: "茶道", desc: "修习日本茶道三年，寻找「間」的哲学" },
];

const FAVORITES = [
  { category: "书", items: ["《瓦尔登湖》梭罗", "《局外人》加缪", "《禅与摩托车维修艺术》波西格", "《给一位年轻诗人的信》里尔克"] },
  { category: "概念", items: ["物の哀れ（物哀）", "侘寂（Wabi-sabi）", "間（Ma）", "一期一会"] },
  { category: "习惯", items: ["晨间写作", "无手机散步", "慢读", "每日冥想"] },
];

export default function About() {
  const recent = getRecentArticles(3);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="pt-28 pb-20">
        {/* Hero Section */}
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start mb-20">
            {/* Left: Image */}
            <div className="fade-in-up">
              <div className="relative">
                <img
                  src={ABOUT_IMG}
                  alt="关于我"
                  className="w-full max-w-sm aspect-[3/4] object-cover"
                />
                <div className="absolute -bottom-4 -right-4 w-24 h-24 border border-foreground/15 hidden lg:block" />
              </div>
            </div>

            {/* Right: Text */}
            <div className="fade-in-up fade-in-up-delay-2">
              <p
                className="text-muted-foreground text-xs tracking-[0.2em] uppercase mb-4"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                About
              </p>
              <h1
                className="text-foreground text-4xl md:text-5xl font-bold mb-6"
                style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif", letterSpacing: "-0.02em" }}
              >
                关于我
              </h1>

              <div className="space-y-5">
                <p
                  className="text-foreground/80 text-base leading-[1.9]"
                  style={{ fontFamily: "'Noto Serif SC', serif" }}
                >
                  你好，我是这个博客的作者。我是一个喜欢阅读、写作和散步的人，相信文字是思想最好的容器，相信慢下来是这个时代最重要的能力。
                </p>
                <p
                  className="text-foreground/80 text-base leading-[1.9]"
                  style={{ fontFamily: "'Noto Serif SC', serif" }}
                >
                  这个博客叫做「墨迹」，取自墨水在纸上留下的痕迹。我希望这里的每一篇文章，都像墨迹一样——有深有浅，有浓有淡，但都是真实的。
                </p>
                <p
                  className="text-foreground/80 text-base leading-[1.9]"
                  style={{ fontFamily: "'Noto Serif SC', serif" }}
                >
                  我写作的主题包括：哲学与思考、阅读笔记、写作方法、生活方式，以及偶尔的技术思考。不追求系统，只追求真实。
                </p>
              </div>

              {/* Quote */}
              <div className="mt-8 border-l-2 border-foreground/20 pl-5 py-1">
                <p
                  className="text-foreground/70 text-sm leading-relaxed italic"
                  style={{ fontFamily: "'Lora', 'Noto Serif SC', serif" }}
                >
                  "写作是一种与沉默的对话。那片空白本身就是一种语言。"
                </p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border mb-20" />

          {/* Interests */}
          <div className="mb-20 fade-in-up fade-in-up-delay-1">
            <h2
              className="text-foreground text-2xl font-semibold mb-10"
              style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
            >
              关注的事
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {SKILLS.map((skill, i) => (
                <div key={skill.label} className={`fade-in-up fade-in-up-delay-${i + 1}`}>
                  <h3
                    className="text-foreground text-lg font-semibold mb-2"
                    style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
                  >
                    {skill.label}
                  </h3>
                  <p
                    className="text-foreground/70 text-sm leading-relaxed"
                    style={{ fontFamily: "'Noto Serif SC', serif" }}
                  >
                    {skill.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border mb-20" />

          {/* Favorites */}
          <div className="mb-20 fade-in-up">
            <h2
              className="text-foreground text-2xl font-semibold mb-10"
              style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
            >
              喜欢的事物
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {FAVORITES.map(fav => (
                <div key={fav.category}>
                  <h3
                    className="text-foreground text-xs font-semibold tracking-[0.15em] uppercase mb-4"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {fav.category}
                  </h3>
                  <ul className="space-y-2">
                    {fav.items.map(item => (
                      <li
                        key={item}
                        className="text-foreground/80 text-sm leading-relaxed"
                        style={{ fontFamily: "'Noto Serif SC', serif" }}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border mb-20" />

          {/* Recent Articles */}
          <div className="fade-in-up">
            <div className="flex items-baseline justify-between mb-8">
              <h2
                className="text-foreground text-2xl font-semibold"
                style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
              >
                最近写了
              </h2>
              <Link href="/blog">
                <span
                  className="text-muted-foreground text-xs tracking-[0.1em] hover:text-foreground transition-colors"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  全部文章 →
                </span>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {recent.map(article => (
                <ArticleCard key={article.id} article={article} variant="compact" />
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
