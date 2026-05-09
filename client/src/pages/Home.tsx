/*
 * 设计哲学：日式极简主义
 * 首页：全屏英雄区（墨迹背景 + 大字标题），下方精选文章 + 最新文章列表
 * 左对齐，不对称布局，大量留白
 */

import { useState, useEffect } from "react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { parseTags } from "@/lib/utils";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663603513063/Jv7YCCM3BuDSibFnxHr9Qi/hero-bg-PxUBraARxan7JRGzDyxUyN.webp";

export default function Home() {
  const [articles, setArticles] = useState<any[]>([]);
  const [archives, setArchives] = useState<any[]>([]);
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 加载文章数据
  const { data: articlesData, isLoading: articlesLoading } = trpc.blog.listArticles.useQuery();

  // 加载归档数据
  const { data: archivesData, isLoading: archivesLoading } = trpc.archive.listArchives.useQuery();

  useEffect(() => {
    if (articlesData && articlesData.success) {
      const processedArticles = articlesData.articles.map((a: any) => ({
        ...a,
        tags: parseTags(a.tags),
        featured: typeof a.featured === 'number' ? a.featured === 1 : a.featured,
      }));
      setArticles(processedArticles);

      // 统计分类
      const categoryMap = new Map<string, number>();
      processedArticles.forEach((article: any) => {
        const count = categoryMap.get(article.category) || 0;
        categoryMap.set(article.category, count + 1);
      });
      const cats = Array.from(categoryMap.entries()).map(([name, count]) => ({
        name,
        count,
      }));
      setCategories(cats);
    }
  }, [articlesData]);

  useEffect(() => {
    if (archivesData && archivesData.success) {
      const processedArchives = archivesData.archives.map((a: any) => ({
        ...a,
        tags: parseTags(a.tags),
      }));
      setArchives(processedArchives);
    }
  }, [archivesData]);

  useEffect(() => {
    if (!articlesLoading && !archivesLoading) {
      setIsLoading(false);
    }
  }, [articlesLoading, archivesLoading]);

  // 获取精选文章（featured 为 true 的文章）
  const featured = articles.filter(a => a.featured).slice(0, 2);

  // 获取最新文章
  const recent = [...articles]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  // 获取最新归档
  const recentArchives = [...archives]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  // 计算开始写作年份
  const allDates = [...articles.map(a => a.date), ...archives.map(a => a.date)];
  const startYear = allDates.length > 0 
    ? Math.min(...allDates.map(d => new Date(d).getFullYear()))
    : new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-end pb-20 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={HERO_BG}
            alt=""
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background/90" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8 w-full">
          <div className="max-w-2xl fade-in-up">
            <p
              className="text-muted-foreground text-xs tracking-[0.2em] uppercase mb-6 fade-in-up fade-in-up-delay-1"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Personal Blog · 个人博客
            </p>
            <h1
              className="text-foreground text-5xl md:text-7xl font-bold leading-[1.1] mb-6 fade-in-up fade-in-up-delay-2"
              style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif", letterSpacing: "-0.03em" }}
            >
              墨迹
            </h1>
            <p
              className="text-foreground/70 text-lg md:text-xl leading-relaxed mb-8 fade-in-up fade-in-up-delay-3"
              style={{ fontFamily: "'Noto Serif SC', serif" }}
            >
              以文字对抗遗忘，以思考丈量世界。
              <br />
              关于阅读、写作、生活与哲学的碎片。
            </p>
            <div className="flex items-center gap-6 fade-in-up fade-in-up-delay-4">
              <Link href="/blog">
                <span
                  className="inline-block text-foreground text-sm tracking-[0.1em] border-b border-foreground pb-0.5 hover:border-opacity-50 transition-all duration-200 cursor-pointer"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  浏览文章 →
                </span>
              </Link>
              <Link href="/about">
                <span
                  className="inline-block text-muted-foreground text-sm tracking-[0.1em] hover:text-foreground transition-colors duration-200 cursor-pointer"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  关于我
                </span>
              </Link>
            </div>
          </div>

          {/* Stats */}
          {isLoading ? (
            <div className="flex items-center gap-8 mt-16 pt-8 border-t border-foreground/10">
              <Loader2 className="w-6 h-6 animate-spin text-foreground/50" />
            </div>
          ) : (
            <div className="flex items-center gap-8 mt-16 pt-8 border-t border-foreground/10">
              <div>
                <p
                  className="text-foreground text-2xl font-bold"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {articles.length}
                </p>
                <p
                  className="text-muted-foreground text-xs tracking-[0.1em] mt-0.5"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  篇文章
                </p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div>
                <p
                  className="text-foreground text-2xl font-bold"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {archives.length}
                </p>
                <p
                  className="text-muted-foreground text-xs tracking-[0.1em] mt-0.5"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  篇归档
                </p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div>
                <p
                  className="text-foreground text-2xl font-bold"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {categories.length}
                </p>
                <p
                  className="text-muted-foreground text-xs tracking-[0.1em] mt-0.5"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  个分类
                </p>
              </div>
              <div className="w-px h-8 bg-border" />
              <div>
                <p
                  className="text-foreground text-2xl font-bold"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {startYear}
                </p>
                <p
                  className="text-muted-foreground text-xs tracking-[0.1em] mt-0.5"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  年开始写作
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Featured Articles */}
      {featured.length > 0 && (
        <section className="py-20 max-w-5xl mx-auto px-6 lg:px-8">
          <div className="flex items-baseline justify-between mb-12">
            <h2
              className="text-foreground text-2xl font-semibold"
              style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
            >
              精选文章
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {featured.map((article, i) => (
              <div key={article.id} className={`fade-in-up fade-in-up-delay-${i + 1}`}>
                <ArticleCard article={article} variant="featured" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Divider */}
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <div className="h-px bg-border" />
      </div>

      {/* Recent Articles + Sidebar */}
      <section className="py-20 max-w-5xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Main: Recent Articles */}
          <div className="lg:col-span-2">
            <h2
              className="text-foreground text-2xl font-semibold mb-8"
              style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
            >
              最新文章
            </h2>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-foreground/50" />
              </div>
            ) : recent.length > 0 ? (
              <>
                <div>
                  {recent.map((article) => (
                    <ArticleCard key={article.id} article={article} variant="default" />
                  ))}
                </div>
                <div className="mt-8">
                  <Link href="/blog">
                    <span
                      className="inline-block text-muted-foreground text-sm tracking-[0.1em] border border-border px-6 py-3 hover:bg-foreground hover:text-background dark:hover:bg-background dark:hover:text-foreground hover:border-foreground transition-all duration-200 cursor-pointer"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      查看全部文章
                    </span>
                  </Link>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">暂无文章</p>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Categories */}
            {categories.length > 0 && (
              <div className="mb-12">
                <h3
                  className="text-foreground text-sm font-semibold tracking-[0.1em] uppercase mb-6"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  分类
                </h3>
                <ul className="space-y-3">
                  {categories.map(cat => (
                    <li key={cat.name}>
                      <Link href={`/blog?category=${cat.name}`}>
                        <span className="flex items-center justify-between group cursor-pointer">
                          <span
                            className="text-foreground/70 text-sm group-hover:text-foreground transition-colors"
                            style={{ fontFamily: "'Noto Serif SC', serif" }}
                          >
                            {cat.name}
                          </span>
                          <span
                            className="text-muted-foreground text-xs"
                            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                          >
                            {cat.count}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recent Archives */}
            {recentArchives.length > 0 && (
              <div className="mb-12">
                <h3
                  className="text-foreground text-sm font-semibold tracking-[0.1em] uppercase mb-6"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  最新归档
                </h3>
                <ul className="space-y-3">
                  {recentArchives.map(archive => (
                    <li key={archive.id}>
                      <Link href={`/archive/${archive.slug}`}>
                        <div className="group cursor-pointer">
                          <p
                            className="text-foreground/70 text-sm group-hover:text-foreground transition-colors line-clamp-2"
                            style={{ fontFamily: "'Noto Serif SC', serif" }}
                          >
                            {archive.title}
                          </p>
                          <p
                            className="text-muted-foreground text-xs mt-1"
                            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                          >
                            {new Date(archive.date).toLocaleDateString('zh-CN', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href="/archive">
                  <span
                    className="inline-block text-muted-foreground text-xs tracking-[0.1em] mt-4 hover:text-foreground transition-colors cursor-pointer"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    查看全部归档 →
                  </span>
                </Link>
              </div>
            )}

            {/* Quote */}
            <div className="border-l-2 border-foreground/20 pl-4 py-2 mb-12">
              <p
                className="text-foreground/70 text-sm leading-relaxed italic"
                style={{ fontFamily: "'Lora', 'Noto Serif SC', serif" }}
              >
                "我走进森林，因为我想从容地生活，只面对生活的本质。"
              </p>
              <p
                className="text-muted-foreground text-xs mt-2 tracking-[0.05em]"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                — 梭罗《瓦尔登湖》
              </p>
            </div>

            {/* About snippet */}
            <div>
              <h3
                className="text-foreground text-sm font-semibold tracking-[0.1em] uppercase mb-4"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                关于博主
              </h3>
              <p
                className="text-muted-foreground text-sm leading-relaxed"
                style={{ fontFamily: "'Noto Serif SC', serif" }}
              >
                一个喜欢阅读、写作和散步的人。相信文字是思想最好的容器，相信慢下来是这个时代最重要的能力。
              </p>
              <Link href="/about">
                <span
                  className="inline-block text-muted-foreground text-xs tracking-[0.1em] mt-3 hover:text-foreground transition-colors cursor-pointer"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  了解更多 →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
