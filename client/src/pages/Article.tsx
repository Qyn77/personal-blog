/*
 * 设计哲学：日式极简主义
 * 文章详情页：宽边距，内容列居中但不满屏，衬线字体，大量留白
 * 使用 Markdown 渲染器渲染文章内容
 * 从本地 Markdown 文件动态加载文章
 */

import { useParams, Link } from "wouter";
import { useEffect, useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { trpc } from "@/lib/trpc";
import ContentStatus from "@/components/ContentStatus";
import { parseTags } from "@/lib/utils";
import {
  setPageMeta,
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
} from "@/lib/seo";
import { assetUrl } from "@/lib/assets";

function resolveBookImage(src: string) {
  if (
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("/")
  ) {
    return assetUrl(src);
  }

  const normalized = src.replace(/^\.\//, "").replace(/^\/+/, "");
  return assetUrl(`/books/${normalized}`);
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function Article() {
  const params = useParams<{ slug: string }>();
  const [readProgress, setReadProgress] = useState(0);
  const [heroOffset, setHeroOffset] = useState(0);

  // 调用 tRPC API 获取单篇文章
  const {
    data: articleData,
    isLoading,
    isError,
    refetch,
  } = trpc.blog.getArticle.useQuery({
    slug: params.slug || "",
  });

  const { data: relatedData } = trpc.blog.relatedArticles.useQuery({
    slug: params.slug || "",
  });
  const relatedArticles = (relatedData?.articles ?? []).map(a => ({
    ...a,
    subtitle: a.subtitle ?? undefined,
    coverImage: a.coverImage ?? undefined,
    tags: parseTags(a.tags),
    featured: a.featured === 1,
  }));

  const article = useMemo(() => {
    const value = articleData?.success ? articleData.article : null;
    return value ? { ...value, tags: parseTags(value.tags) } : null;
  }, [articleData]);
  const failed =
    isError ||
    (!!articleData &&
      !articleData.success &&
      articleData.error !== "Article not found");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [params.slug]);

  // 当文章数据加载完成时
  useEffect(() => {
    if (article) {
      // 动态 meta 标签
      const articleUrl = `${window.location.origin}/article/${article.slug}`;
      const publishedTime = new Date(article.date).toISOString();
      const modifiedTime = article.updatedAt
        ? new Date(article.updatedAt).toISOString()
        : publishedTime;
      setPageMeta({
        title: article.title,
        description: article.excerpt,
        ogImage: assetUrl(article.coverImage),
        ogType: "article",
        keywords: Array.isArray(article.tags)
          ? article.tags.join(",")
          : undefined,
        publishedTime,
        modifiedTime,
        section: article.category,
        jsonLd: [
          buildArticleJsonLd({
            title: article.title,
            description: article.excerpt,
            url: articleUrl,
            image: assetUrl(article.coverImage),
            datePublished: publishedTime,
            dateModified: modifiedTime,
            section: article.category,
            tags: article.tags,
          }),
          buildBreadcrumbJsonLd([
            { name: "首页", url: `${window.location.origin}/` },
            { name: "文章", url: `${window.location.origin}/blog` },
            { name: article.title, url: articleUrl },
          ]),
        ],
      });
    }
  }, [article]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      setReadProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
      setHeroOffset(Math.min(scrollTop * 0.45, 180));
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (isLoading || failed || !article) {
    return (
      <ContentStatus
        loading={isLoading}
        error={failed}
        kind="文章"
        back="/blog"
        retry={() => void refetch()}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* 阅读进度条 */}
      <div
        className="fixed top-0 left-0 h-1 bg-foreground transition-all duration-300 z-[60]"
        style={{ width: `${readProgress}%` }}
      />

      <Navbar />

      <main className="pb-20">
        <article className="max-w-4xl mx-auto px-6 lg:px-8">
          {/* 文章头部 */}
          <div className="mb-12 fade-in-up relative">
            {article.coverImage && (
              <div className="relative left-1/2 right-1/2 w-screen -translate-x-1/2 overflow-hidden aspect-[16/7] max-h-[460px] bg-muted ring-1 ring-foreground/5 shadow-[0_20px_60px_-28px_rgba(0,0,0,0.55)]">
                <img
                  src={resolveBookImage(article.coverImage)}
                  alt={`${article.title} 封面`}
                  className="h-full w-full object-cover"
                  style={{
                    transform: `translate3d(0, ${heroOffset}px, 0) scale(1.14)`,
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/55" />
                <div className="absolute inset-0 bg-black/8 mix-blend-multiply" />
              </div>
            )}
            <div className="relative z-10 -mt-16 rounded-2xl border border-border/60 bg-background/92 px-5 py-6 shadow-[0_18px_50px_-30px_rgba(0,0,0,0.42)] backdrop-blur-md md:px-7">
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
                      {article.tags.map(tag => (
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
                style={{
                  fontFamily: "'Playfair Display', 'Noto Serif SC', serif",
                }}
              >
                相关文章
              </h2>
              <div className="space-y-4">
                {relatedArticles.map(relatedArticle => (
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
