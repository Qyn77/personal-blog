/*
 * 设计哲学：日式极简主义
 * 文章详情页：宽边距，内容列居中但不满屏，衬线字体，大量留白
 */

import { useParams, Link } from "wouter";
import { useEffect, useState, type ReactNode } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import { getArticleBySlug, ARTICLES } from "@/lib/blogData";

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
}

function renderContent(content: string) {
  const lines = content.split("\n");
  const elements: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("## ")) {
      elements.push(
        <h2
          key={i}
          className="text-[#1A1A1A] dark:text-[#F5F5F5] text-2xl font-semibold mt-12 mb-4"
          style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
        >
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3
          key={i}
          className="text-[#1A1A1A] dark:text-[#F5F5F5] text-xl font-semibold mt-8 mb-3"
          style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
        >
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith("> ")) {
      elements.push(
        <blockquote
          key={i}
          className="border-l-2 border-[#1A1A1A]/25 dark:border-[#F5F5F5]/25 pl-5 py-1 my-6 text-[#4A4A4A] dark:text-[#D0D0D0] italic"
          style={{ fontFamily: "'Lora', 'Noto Serif SC', serif" }}
        >
          {line.slice(2)}
        </blockquote>
      );
    } else if (line.trim() === "") {
      // skip empty lines (paragraph breaks handled by p margin)
    } else {
      elements.push(
        <p
          key={i}
          className="text-[#2A2A2A] dark:text-[#D0D0D0] text-[1.0625rem] leading-[1.9] mb-5"
          style={{ fontFamily: "'Noto Serif SC', serif" }}
        >
          {line}
        </p>
      );
    }
    i++;
  }

  return elements;
}

export default function Article() {
  const params = useParams<{ slug: string }>();
  const article = getArticleBySlug(params.slug);
  const [readProgress, setReadProgress] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [params.slug]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setReadProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!article) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#1A1A1A] flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <p
            className="text-[#9B9B9B] dark:text-[#808080] text-sm mb-4"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            404 · 文章不存在
          </p>
          <Link href="/blog">
            <span className="text-[#1A1A1A] dark:text-[#F5F5F5] text-sm underline">返回文章列表</span>
          </Link>
        </div>
      </div>
    );
  }

  // Related articles: same category, exclude current
  const related = ARTICLES.filter(
    a => a.category === article.category && a.id !== article.id
  ).slice(0, 3);

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#1A1A1A]">
      {/* Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 z-[60] h-0.5 bg-[#1A1A1A] dark:bg-[#F5F5F5] transition-all duration-100"
        style={{ width: `${readProgress}%` }}
      />

      <Navbar />

      <main className="pt-28 pb-20">
        {/* Article Header */}
        <div className="max-w-3xl mx-auto px-6 lg:px-8 mb-12 fade-in-up">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-8">
            <Link href="/">
              <span
                className="text-[#9B9B9B] dark:text-[#808080] text-xs hover:text-[#1A1A1A] dark:hover:text-[#F5F5F5] transition-colors"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                首页
              </span>
            </Link>
            <span className="text-[#D4D4D0] dark:text-[#333333] text-xs">/</span>
            <Link href="/blog">
              <span
                className="text-[#9B9B9B] dark:text-[#808080] text-xs hover:text-[#1A1A1A] dark:hover:text-[#F5F5F5] transition-colors"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                文章
              </span>
            </Link>
            <span className="text-[#D4D4D0] dark:text-[#333333] text-xs">/</span>
            <span
              className="text-[#6B6B6B] dark:text-[#A0A0A0] text-xs line-clamp-1"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {article.title}
            </span>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4 mb-6">
            <span
              className="text-[#9B9B9B] dark:text-[#808080] text-xs tracking-[0.08em]"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {formatDate(article.date)}
            </span>
            <span className="w-px h-3 bg-[#D4D4D0] dark:bg-[#333333]" />
            <span
              className="text-[#9B9B9B] dark:text-[#808080] text-xs tracking-[0.08em]"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {article.readTime} min read
            </span>
          </div>

          {/* Title */}
          <h1
            className="text-[#1A1A1A] dark:text-[#F5F5F5] text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4"
            style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif", letterSpacing: "-0.02em" }}
          >
            {article.title}
          </h1>

          {article.subtitle && (
            <p
              className="text-[#6B6B6B] dark:text-[#A0A0A0] text-lg italic mb-6"
              style={{ fontFamily: "'Lora', 'Noto Serif SC', serif" }}
            >
              {article.subtitle}
            </p>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            {article.tags.map(tag => (
              <Link key={tag} href={`/blog?tag=${tag}`}>
                <span className="tag-pill">{tag}</span>
              </Link>
            ))}
          </div>

          {/* Excerpt / Lead */}
          <p
            className="text-[#4A4A4A] dark:text-[#D0D0D0] text-lg leading-relaxed border-l-2 border-[#1A1A1A]/20 dark:border-[#F5F5F5]/20 pl-5 py-1"
            style={{ fontFamily: "'Noto Serif SC', serif" }}
          >
            {article.excerpt}
          </p>
        </div>

        {/* Cover Image */}
        {article.coverImage && (
          <div className="max-w-4xl mx-auto px-6 lg:px-8 mb-12">
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full aspect-[16/7] object-cover"
            />
          </div>
        )}

        {/* Article Content */}
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <div className="fade-in-up fade-in-up-delay-2">
            {renderContent(article.content)}
          </div>

          {/* Article Footer */}
          <div className="mt-16 pt-8 border-t border-[#1A1A1A]/10 dark:border-[#F5F5F5]/10">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex flex-wrap gap-2">
                {article.tags.map(tag => (
                  <Link key={tag} href={`/blog?tag=${tag}`}>
                    <span className="tag-pill">{tag}</span>
                  </Link>
                ))}
              </div>
              <Link href="/blog">
                <span
                  className="text-[#6B6B6B] dark:text-[#A0A0A0] text-xs tracking-[0.1em] hover:text-[#1A1A1A] dark:hover:text-[#F5F5F5] transition-colors"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  ← 返回文章列表
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Related Articles */}
        {related.length > 0 && (
          <div className="max-w-5xl mx-auto px-6 lg:px-8 mt-20">
            <div className="h-px bg-[#1A1A1A]/8 dark:bg-[#F5F5F5]/8 mb-12" />
            <h2
              className="text-[#1A1A1A] dark:text-[#F5F5F5] text-xl font-semibold mb-8"
              style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
            >
              相关文章
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {related.map(a => (
                <ArticleCard key={a.id} article={a} variant="compact" />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
