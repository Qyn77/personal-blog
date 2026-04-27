/*
 * 设计哲学：日式极简主义
 * 首页：全屏英雄区（墨迹背景 + 大字标题），下方精选文章 + 最新文章列表
 * 左对齐，不对称布局，大量留白
 */

import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import { ARTICLES, getFeaturedArticles, getRecentArticles, CATEGORIES } from "@/lib/blogData";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663603513063/Jv7YCCM3BuDSibFnxHr9Qi/hero-bg-PxUBraARxan7JRGzDyxUyN.webp";

export default function Home() {
  const featured = getFeaturedArticles();
  const recent = getRecentArticles(6);

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#1A1A1A]">
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
          <div className="absolute inset-0 bg-gradient-to-b from-[#FAFAF8]/20 via-transparent to-[#FAFAF8]/90 dark:from-[#1A1A1A]/20 dark:to-[#1A1A1A]/90" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8 w-full">
          <div className="max-w-2xl fade-in-up">
            <p
              className="text-[#6B6B6B] dark:text-[#A0A0A0] text-xs tracking-[0.2em] uppercase mb-6 fade-in-up fade-in-up-delay-1"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Personal Blog · 个人博客
            </p>
            <h1
              className="text-[#1A1A1A] dark:text-[#F5F5F5] text-5xl md:text-7xl font-bold leading-[1.1] mb-6 fade-in-up fade-in-up-delay-2"
              style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif", letterSpacing: "-0.03em" }}
            >
              墨迹
            </h1>
            <p
              className="text-[#4A4A4A] dark:text-[#D0D0D0] text-lg md:text-xl leading-relaxed mb-8 fade-in-up fade-in-up-delay-3"
              style={{ fontFamily: "'Noto Serif SC', serif" }}
            >
              以文字对抗遗忘，以思考丈量世界。
              <br />
              关于阅读、写作、生活与哲学的碎片。
            </p>
            <div className="flex items-center gap-6 fade-in-up fade-in-up-delay-4">
              <Link href="/blog">
                <span
                  className="inline-block text-[#1A1A1A] dark:text-[#F5F5F5] text-sm tracking-[0.1em] border-b border-[#1A1A1A] dark:border-[#F5F5F5] pb-0.5 hover:border-opacity-50 transition-all duration-200"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  浏览文章 →
                </span>
              </Link>
              <Link href="/about">
                <span
                  className="inline-block text-[#6B6B6B] dark:text-[#A0A0A0] text-sm tracking-[0.1em] hover:text-[#1A1A1A] dark:hover:text-[#F5F5F5] transition-colors duration-200"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  关于我
                </span>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8 mt-16 pt-8 border-t border-[#1A1A1A]/10 dark:border-[#F5F5F5]/10">
            <div>
              <p
                className="text-[#1A1A1A] dark:text-[#F5F5F5] text-2xl font-bold"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {ARTICLES.length}
              </p>
              <p
                className="text-[#9B9B9B] dark:text-[#808080] text-xs tracking-[0.1em] mt-0.5"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                篇文章
              </p>
            </div>
            <div className="w-px h-8 bg-[#D4D4D0] dark:bg-[#333333]" />
            <div>
              <p
                className="text-[#1A1A1A] dark:text-[#F5F5F5] text-2xl font-bold"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {CATEGORIES.length}
              </p>
              <p
                className="text-[#9B9B9B] dark:text-[#808080] text-xs tracking-[0.1em] mt-0.5"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                个分类
              </p>
            </div>
            <div className="w-px h-8 bg-[#D4D4D0] dark:bg-[#333333]" />
            <div>
              <p
                className="text-[#1A1A1A] dark:text-[#F5F5F5] text-2xl font-bold"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                2023
              </p>
              <p
                className="text-[#9B9B9B] dark:text-[#808080] text-xs tracking-[0.1em] mt-0.5"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                年开始写作
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      <section className="py-20 max-w-5xl mx-auto px-6 lg:px-8">
        <div className="flex items-baseline justify-between mb-12">
          <h2
            className="text-[#1A1A1A] dark:text-[#F5F5F5] text-2xl font-semibold"
            style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
          >
            精选文章
          </h2>
          <Link href="/blog">
            <span
              className="text-[#9B9B9B] dark:text-[#808080] text-xs tracking-[0.1em] hover:text-[#1A1A1A] dark:hover:text-[#F5F5F5] transition-colors"
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

      {/* Divider */}
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <div className="h-px bg-[#1A1A1A]/8 dark:bg-[#F5F5F5]/8" />
      </div>

      {/* Recent Articles + Sidebar */}
      <section className="py-20 max-w-5xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Main: Recent Articles */}
          <div className="lg:col-span-2">
            <h2
              className="text-[#1A1A1A] dark:text-[#F5F5F5] text-2xl font-semibold mb-8"
              style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
            >
              最新文章
            </h2>
            <div>
              {recent.map((article) => (
                <ArticleCard key={article.id} article={article} variant="default" />
              ))}
            </div>
            <div className="mt-8">
              <Link href="/blog">
                <span
                  className="inline-block text-[#6B6B6B] dark:text-[#A0A0A0] text-sm tracking-[0.1em] border border-[#D4D4D0] dark:border-[#333333] px-6 py-3 hover:bg-[#1A1A1A] hover:text-[#FAFAF8] dark:hover:bg-[#F5F5F5] dark:hover:text-[#1A1A1A] hover:border-[#1A1A1A] dark:hover:border-[#F5F5F5] transition-all duration-200"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  查看全部文章
                </span>
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Categories */}
            <div className="mb-12">
              <h3
                className="text-[#1A1A1A] dark:text-[#F5F5F5] text-sm font-semibold tracking-[0.1em] uppercase mb-6"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                分类
              </h3>
              <ul className="space-y-3">
                {CATEGORIES.map(cat => (
                  <li key={cat.id}>
                    <Link href={`/blog?category=${cat.id}`}>
                      <span className="flex items-center justify-between group cursor-pointer">
                        <span
                          className="text-[#4A4A4A] dark:text-[#D0D0D0] text-sm group-hover:text-[#1A1A1A] dark:group-hover:text-[#F5F5F5] transition-colors"
                          style={{ fontFamily: "'Noto Serif SC', serif" }}
                        >
                          {cat.name}
                        </span>
                        <span
                          className="text-[#9B9B9B] dark:text-[#808080] text-xs"
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

            {/* Quote */}
            <div className="border-l-2 border-[#1A1A1A]/20 dark:border-[#F5F5F5]/20 pl-4 py-2">
              <p
                className="text-[#4A4A4A] dark:text-[#D0D0D0] text-sm leading-relaxed italic"
                style={{ fontFamily: "'Lora', 'Noto Serif SC', serif" }}
              >
                "我走进森林，因为我想从容地生活，只面对生活的本质。"
              </p>
              <p
                className="text-[#9B9B9B] dark:text-[#808080] text-xs mt-2 tracking-[0.05em]"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                — 梭罗《瓦尔登湖》
              </p>
            </div>

            {/* About snippet */}
            <div className="mt-12">
              <h3
                className="text-[#1A1A1A] dark:text-[#F5F5F5] text-sm font-semibold tracking-[0.1em] uppercase mb-4"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                关于博主
              </h3>
              <p
                className="text-[#6B6B6B] dark:text-[#A0A0A0] text-sm leading-relaxed"
                style={{ fontFamily: "'Noto Serif SC', serif" }}
              >
                一个喜欢阅读、写作和散步的人。相信文字是思想最好的容器，相信慢下来是这个时代最重要的能力。
              </p>
              <Link href="/about">
                <span
                  className="inline-block text-[#9B9B9B] dark:text-[#808080] text-xs tracking-[0.1em] mt-3 hover:text-[#1A1A1A] dark:hover:text-[#F5F5F5] transition-colors"
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
