/*
 * 设计哲学：日式极简主义
 * 文章卡片：无边框，靠间距区分，悬停时背景微变
 */

import { Link } from "wouter";
import type { Article } from "@/type/blogData";

interface ArticleCardProps {
  article: Article;
  variant?: "default" | "featured" | "compact";
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ArticleCard({
  article,
  variant = "default",
}: ArticleCardProps) {
  const coverAlt = `${article.title} 封面`;

  if (variant === "compact") {
    return (
      <Link href={`/article/${article.slug}`}>
        <article className="article-card group py-4 px-2 -mx-2 transition-colors duration-150 cursor-pointer">
          <div className="grid grid-cols-1 md:grid-cols-[1.8fr_1fr] gap-5 items-stretch">
            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-baseline justify-between gap-4">
                <h3
                  className="text-[#1A1A1A] dark:text-[#F5F5F5] text-base font-medium group-hover:text-[#000] dark:group-hover:text-[#FFF] transition-colors line-clamp-1 flex-1"
                  style={{ fontFamily: "'Noto Serif SC', serif" }}
                >
                  {article.title}
                </h3>
                <span
                  className="text-[#9B9B9B] dark:text-[#808080] text-xs shrink-0"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {article.date.slice(0, 7)}
                </span>
              </div>
              <p
                className="text-[#6B6B6B] dark:text-[#A0A0A0] text-sm mt-1 line-clamp-1"
                style={{ fontFamily: "'Noto Serif SC', serif" }}
              >
                {article.excerpt}
              </p>
            </div>
            {article.coverImage ? (
              <div className="overflow-hidden rounded-xl aspect-[16/9] bg-muted ring-1 ring-foreground/5 shadow-[0_14px_34px_-22px_rgba(0,0,0,0.45)] transition-transform duration-500 group-hover:-translate-y-0.5">
                <img
                  src={article.coverImage}
                  alt={coverAlt}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ) : null}
          </div>
        </article>
      </Link>
    );
  }

  if (variant === "featured") {
    return (
      <Link href={`/article/${article.slug}`}>
        <article className="group cursor-pointer min-h-[320px] md:min-h-[280px] flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-[1.15fr_0.95fr] gap-8 items-stretch flex-1">
            <div className="order-2 md:order-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
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
                <h2
                  className="text-[#1A1A1A] dark:text-[#F5F5F5] text-xl md:text-2xl font-semibold mb-2 leading-tight group-hover:text-[#000] dark:group-hover:text-[#FFF] transition-colors line-clamp-2"
                  style={{
                    fontFamily: "'Playfair Display', 'Noto Serif SC', serif",
                  }}
                >
                  {article.title}
                </h2>
                {article.subtitle && (
                  <p
                    className="text-[#6B6B6B] dark:text-[#A0A0A0] text-sm mb-3 italic line-clamp-1"
                    style={{ fontFamily: "'Lora', 'Noto Serif SC', serif" }}
                  >
                    {article.subtitle}
                  </p>
                )}
                <p
                  className="text-[#4A4A4A] dark:text-[#D0D0D0] text-sm leading-relaxed line-clamp-3"
                  style={{ fontFamily: "'Noto Serif SC', serif" }}
                >
                  {article.excerpt}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 mt-4 min-h-[28px]">
                {article.tags.length > 0 ? (
                  article.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="tag-pill">
                      {tag}
                    </span>
                  ))
                ) : (
                  <span
                    className="text-muted-foreground text-xs opacity-50"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    暂无标签
                  </span>
                )}
              </div>
            </div>
            <div className="order-1 md:order-2 flex items-center justify-center">
              {article.coverImage ? (
                <div className="overflow-hidden rounded-2xl aspect-[4/3] md:aspect-[5/4] bg-muted ring-1 ring-foreground/5 shadow-[0_18px_50px_-28px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_24px_60px_-24px_rgba(0,0,0,0.55)] w-full">
                  <img
                    src={article.coverImage}
                    alt={coverAlt}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              ) : (
                <div className="rounded-2xl aspect-[4/3] md:aspect-[5/4] bg-muted/50 ring-1 ring-foreground/5 flex items-center justify-center w-full">
                  <span
                    className="text-muted-foreground text-xs"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    No Cover
                  </span>
                </div>
              )}
            </div>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={`/article/${article.slug}`}>
      <article className="article-card group py-6 px-4 -mx-4 cursor-pointer border-b border-[#1A1A1A]/8 dark:border-[#F5F5F5]/8">
        <div className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr] gap-6 items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
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
                {article.readTime} min
              </span>
            </div>
            <h2
              className="text-[#1A1A1A] dark:text-[#F5F5F5] text-xl font-semibold mb-2 group-hover:text-[#000] dark:group-hover:text-[#FFF] transition-colors"
              style={{
                fontFamily: "'Playfair Display', 'Noto Serif SC', serif",
              }}
            >
              {article.title}
            </h2>
            {article.subtitle && (
              <p
                className="text-[#6B6B6B] dark:text-[#A0A0A0] text-sm mb-2 italic"
                style={{ fontFamily: "'Lora', 'Noto Serif SC', serif" }}
              >
                {article.subtitle}
              </p>
            )}
            <p
              className="text-[#4A4A4A] dark:text-[#D0D0D0] text-sm leading-relaxed line-clamp-2"
              style={{ fontFamily: "'Noto Serif SC', serif" }}
            >
              {article.excerpt}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {article.tags.slice(0, 3).map(tag => (
                <span key={tag} className="tag-pill">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {article.coverImage ? (
            <div className="overflow-hidden rounded-xl aspect-[16/9] bg-muted ring-1 ring-foreground/5 shadow-[0_16px_40px_-26px_rgba(0,0,0,0.45)] transition-transform duration-500 group-hover:-translate-y-1 group-hover:shadow-[0_22px_54px_-24px_rgba(0,0,0,0.5)]">
              <img
                src={article.coverImage}
                alt={coverAlt}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                loading="lazy"
                decoding="async"
              />
            </div>
          ) : null}
        </div>
      </article>
    </Link>
  );
}
