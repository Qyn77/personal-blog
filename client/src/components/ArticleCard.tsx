/*
 * 设计哲学：日式极简主义
 * 文章卡片：无边框，靠间距区分，悬停时背景微变
 */

import { Link } from "wouter";
import type { Article } from "@/lib/blogData";

interface ArticleCardProps {
  article: Article;
  variant?: "default" | "featured" | "compact";
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
}

export default function ArticleCard({ article, variant = "default" }: ArticleCardProps) {
  if (variant === "compact") {
    return (
      <Link href={`/article/${article.slug}`}>
        <article className="article-card group py-4 px-2 -mx-2 transition-colors duration-150 cursor-pointer">
          <div className="flex items-baseline justify-between gap-4">
            <h3
              className="text-[#1A1A1A] text-base font-medium group-hover:text-[#000] transition-colors line-clamp-1 flex-1"
              style={{ fontFamily: "'Noto Serif SC', serif" }}
            >
              {article.title}
            </h3>
            <span
              className="text-[#9B9B9B] text-xs shrink-0"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {article.date.slice(0, 7)}
            </span>
          </div>
          <p className="text-[#6B6B6B] text-sm mt-1 line-clamp-1" style={{ fontFamily: "'Noto Serif SC', serif" }}>
            {article.excerpt}
          </p>
        </article>
      </Link>
    );
  }

  if (variant === "featured") {
    return (
      <Link href={`/article/${article.slug}`}>
        <article className="group cursor-pointer">
          {article.coverImage && (
            <div className="overflow-hidden mb-5 aspect-[16/9]">
              <img
                src={article.coverImage}
                alt={article.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </div>
          )}
          <div className="flex items-center gap-3 mb-3">
            <span
              className="text-[#9B9B9B] text-xs tracking-[0.08em]"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {formatDate(article.date)}
            </span>
            <span className="w-px h-3 bg-[#D4D4D0]" />
            <span
              className="text-[#9B9B9B] text-xs tracking-[0.08em]"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {article.readTime} min read
            </span>
          </div>
          <h2
            className="text-[#1A1A1A] text-2xl font-semibold mb-2 leading-tight group-hover:text-[#000] transition-colors"
            style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
          >
            {article.title}
          </h2>
          {article.subtitle && (
            <p
              className="text-[#6B6B6B] text-sm mb-3 italic"
              style={{ fontFamily: "'Lora', 'Noto Serif SC', serif" }}
            >
              {article.subtitle}
            </p>
          )}
          <p
            className="text-[#4A4A4A] text-sm leading-relaxed line-clamp-3"
            style={{ fontFamily: "'Noto Serif SC', serif" }}
          >
            {article.excerpt}
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {article.tags.slice(0, 3).map(tag => (
              <span key={tag} className="tag-pill">{tag}</span>
            ))}
          </div>
        </article>
      </Link>
    );
  }

  // Default variant
  return (
    <Link href={`/article/${article.slug}`}>
      <article className="article-card group py-6 px-4 -mx-4 cursor-pointer border-b border-[#1A1A1A]/8">
        <div className="flex items-center gap-3 mb-2">
          <span
            className="text-[#9B9B9B] text-xs tracking-[0.08em]"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            {formatDate(article.date)}
          </span>
          <span className="w-px h-3 bg-[#D4D4D0]" />
          <span
            className="text-[#9B9B9B] text-xs tracking-[0.08em]"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            {article.readTime} min
          </span>
        </div>
        <h2
          className="text-[#1A1A1A] text-xl font-semibold mb-2 group-hover:text-[#000] transition-colors"
          style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
        >
          {article.title}
        </h2>
        {article.subtitle && (
          <p
            className="text-[#6B6B6B] text-sm mb-2 italic"
            style={{ fontFamily: "'Lora', 'Noto Serif SC', serif" }}
          >
            {article.subtitle}
          </p>
        )}
        <p
          className="text-[#4A4A4A] text-sm leading-relaxed line-clamp-2"
          style={{ fontFamily: "'Noto Serif SC', serif" }}
        >
          {article.excerpt}
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          {article.tags.slice(0, 3).map(tag => (
            <span key={tag} className="tag-pill">{tag}</span>
          ))}
        </div>
      </article>
    </Link>
  );
}
