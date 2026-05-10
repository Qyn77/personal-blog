/*
 * 设计哲学：日式极简主义
 * 关于页：左侧插图，右侧文字，大量留白，衬线字体
 */

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";
import { parseTags } from "@/lib/utils";
import { setPageMeta } from "@/lib/seo";

interface AboutConfig {
  hero: {
    image: string;
    title: string;
    paragraphs: string[];
    quote: string;
  };
  interests: Array<{
    label: string;
    description: string;
  }>;
  favorites: Array<{
    category: string;
    items: string[];
  }>;
}

export default function About() {
  const [config, setConfig] = useState<AboutConfig | null>(null);
  const [recentArticles, setRecentArticles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [configError, setConfigError] = useState(false);

  // 页面 meta
  useEffect(() => {
    setPageMeta({
      title: "关于",
      description: "关于博主的故事、兴趣和喜欢的事物。",
    });
  }, []);

  // 加载配置文件
  useEffect(() => {
    fetch("/about-config.json")
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(err => {
        console.error("Failed to load about config:", err);
        setConfigError(true);
      });
  }, []);

  // 加载最新文章
  const { data: articlesData, isLoading: articlesLoading } =
    trpc.blog.listArticles.useQuery();

  useEffect(() => {
    if (articlesData && articlesData.success) {
      const processedArticles = articlesData.articles.map((a: any) => ({
        ...a,
        tags: parseTags(a.tags),
        featured:
          typeof a.featured === "number" ? a.featured === 1 : a.featured,
      }));

      // 获取最新 3 篇文章
      const recent = processedArticles
        .sort(
          (a: any, b: any) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        .slice(0, 3);

      setRecentArticles(recent);
    }
  }, [articlesData]);

  useEffect(() => {
    // 配置加载完成（成功或失败）且文章查询完成
    if ((config !== null || configError) && !articlesLoading) {
      setIsLoading(false);
    }
  }, [config, configError, articlesLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Navbar />
        <Loader2 className="w-8 h-8 animate-spin text-foreground/50" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="pt-28 pb-20 max-w-5xl mx-auto px-6 lg:px-8">
          <p className="text-muted-foreground">加载失败，请刷新重试。</p>
        </main>
        <Footer />
      </div>
    );
  }

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
                  src={config.hero.image}
                  alt={config.hero.title}
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
                style={{
                  fontFamily: "'Playfair Display', 'Noto Serif SC', serif",
                  letterSpacing: "-0.02em",
                }}
              >
                {config.hero.title}
              </h1>

              <div className="space-y-5">
                {config.hero.paragraphs.map((paragraph, index) => (
                  <p
                    key={index}
                    className="text-foreground/80 text-base leading-[1.9]"
                    style={{ fontFamily: "'Noto Serif SC', serif" }}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Quote */}
              <div className="mt-8 border-l-2 border-foreground/20 pl-5 py-1">
                <p
                  className="text-foreground/70 text-sm leading-relaxed italic"
                  style={{ fontFamily: "'Lora', 'Noto Serif SC', serif" }}
                >
                  "{config.hero.quote}"
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
              style={{
                fontFamily: "'Playfair Display', 'Noto Serif SC', serif",
              }}
            >
              关注的事
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {config.interests.map((interest, i) => (
                <div
                  key={interest.label}
                  className={`fade-in-up fade-in-up-delay-${i + 1}`}
                >
                  <h3
                    className="text-foreground text-lg font-semibold mb-2"
                    style={{
                      fontFamily: "'Playfair Display', 'Noto Serif SC', serif",
                    }}
                  >
                    {interest.label}
                  </h3>
                  <p
                    className="text-foreground/70 text-sm leading-relaxed"
                    style={{ fontFamily: "'Noto Serif SC', serif" }}
                  >
                    {interest.description}
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
              style={{
                fontFamily: "'Playfair Display', 'Noto Serif SC', serif",
              }}
            >
              喜欢的事物
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {config.favorites.map(fav => (
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
                style={{
                  fontFamily: "'Playfair Display', 'Noto Serif SC', serif",
                }}
              >
                最近写了
              </h2>
              <Link href="/blog">
                <span
                  className="text-muted-foreground text-xs tracking-[0.1em] hover:text-foreground transition-colors cursor-pointer"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  全部文章 →
                </span>
              </Link>
            </div>
            {recentArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {recentArticles.map(article => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    variant="compact"
                  />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">暂无文章</p>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
