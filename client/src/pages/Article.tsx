/*
 * 设计哲学：日式极简主义
 * 文章详情页：宽边距，内容列居中但不满屏，衬线字体，大量留白
 * 使用 Markdown 渲染器渲染文章内容
 * 从本地 Markdown 文件动态加载文章
 */

import { useParams, Link } from "wouter";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import type { Article } from "@/lib/blogData";

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
}

export default function Article() {
  const params = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [readProgress, setReadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);

  // 调用 tRPC API 获取单篇文章
  const { data: articleData, isLoading: isLoadingArticle } = trpc.blog.getArticle.useQuery({
    slug: params.slug || "",
  });

  // 调用 tRPC API 获取所有文章用于推荐
  const { data: allArticlesData } = trpc.blog.listArticles.useQuery();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [params.slug]);

  // 当文章数据加载完成时
  useEffect(() => {
    if (articleData && articleData.success && articleData.article) {
      setArticle(articleData.article as Article);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [articleData]);

  // 计算相关文章
  useEffect(() => {
    if (article && allArticlesData && allArticlesData.success && Array.isArray(allArticlesData.articles)) {
      const related = (allArticlesData.articles as any[])
        .filter(
          (a: any) =>
            a.id !== article.id &&
            (a.category === article.category || a.tags.some((t: string) => article.tags.includes(t)))
        )
        .slice(0, 3);
      setRelatedArticles(related);
    }
  }, [article, allArticlesData]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setReadProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Navbar />
        <Loader2 className="w-8 h-8 animate-spin text-foreground/50" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <p
            className="text-muted-foreground text-sm mb-4"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            404 · 文章不存在
          </p>
          <Link href="/blog">
            <button
              className="text-foreground hover:text-foreground/70 transition-colors"
              style={{ fontFamily: "'Noto Serif SC', serif" }}
            >
              返回文章列表
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 阅读进度条 */}
      <div
        className="fixed top-0 left-0 h-1 bg-foreground transition-all duration-300 z-50"
        style={{ width: `${readProgress}%` }}
      />

      <Navbar />

      <main className="pt-28 pb-20">
        <article className="max-w-2xl mx-auto px-6 lg:px-8">
          {/* 文章头部 */}
          <div className="mb-12 fade-in-up">
            <p
              className="text-muted-foreground text-xs tracking-[0.2em] uppercase mb-3"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {article.category}
            </p>
            <h1
              className="text-foreground text-4xl md:text-5xl font-bold mb-4 leading-tight"
              style={{
                fontFamily: "'Playfair Display', 'Noto Serif SC', serif",
                letterSpacing: "-0.02em",
              }}
            >
              {article.title}
            </h1>
            {article.subtitle && (
              <p
                className="text-foreground/70 text-lg mb-6"
                style={{ fontFamily: "'Noto Serif SC', serif" }}
              >
                {article.subtitle}
              </p>
            )}

            {/* 文章元数据 */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                {formatDate(article.date)}
              </span>
              <span>·</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                {article.readTime} min read
              </span>
              {article.tags.length > 0 && (
                <>
                  <span>·</span>
                  <div className="flex gap-2">
                    {article.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 文章内容 */}
          <div className="mb-16 fade-in-up fade-in-up-delay-1">
            <MarkdownRenderer content={article.content} />
          </div>

          {/* 分割线 */}
          <div className="my-12 border-t border-border" />

          {/* 相关文章 */}
          {relatedArticles.length > 0 && (
            <div className="mb-16 fade-in-up fade-in-up-delay-2">
              <h2
                className="text-foreground text-2xl font-semibold mb-6"
                style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
              >
                相关文章
              </h2>
              <div className="space-y-4">
                {relatedArticles.map((relatedArticle) => (
                  <ArticleCard
                    key={relatedArticle.id}
                    article={relatedArticle}
                    variant="compact"
                  />
                ))}
              </div>
            </div>
          )}

          {/* 返回链接 */}
          <div className="text-center pt-8">
            <Link href="/blog">
              <button
                className="text-foreground hover:text-foreground/70 transition-colors"
                style={{ fontFamily: "'Noto Serif SC', serif" }}
              >
                ← 返回文章列表
              </button>
            </Link>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
