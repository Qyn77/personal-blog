/*
 * 设计哲学：日式极简主义
 * 博客列表页：左侧分类筛选，右侧文章列表，大量留白
 */

import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import { ARTICLES, CATEGORIES, ALL_TAGS, getArticlesByCategory, getArticlesByTag } from "@/lib/blogData";

export default function Blog() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialCategory = params.get("category") || "all";
  const initialTag = params.get("tag") || "";

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [activeTag, setActiveTag] = useState(initialTag);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setActiveCategory(params.get("category") || "all");
    setActiveTag(params.get("tag") || "");
  }, [search]);

  let filtered = ARTICLES;

  if (activeCategory !== "all") {
    filtered = filtered.filter(a => a.category === activeCategory);
  }
  if (activeTag) {
    filtered = filtered.filter(a => a.tags.includes(activeTag));
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      a =>
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  // Sort by date descending
  filtered = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <Navbar />

      <main className="pt-28 pb-20 max-w-5xl mx-auto px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-16 fade-in-up">
          <p
            className="text-[#9B9B9B] text-xs tracking-[0.2em] uppercase mb-3"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            All Articles
          </p>
          <h1
            className="text-[#1A1A1A] text-4xl md:text-5xl font-bold mb-4"
            style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif", letterSpacing: "-0.02em" }}
          >
            文章
          </h1>
          <p
            className="text-[#6B6B6B] text-base"
            style={{ fontFamily: "'Noto Serif SC', serif" }}
          >
            共 {ARTICLES.length} 篇文章，关于思考、阅读、写作与生活。
          </p>
        </div>

        {/* Search */}
        <div className="mb-10">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="搜索文章..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-b border-[#1A1A1A]/20 py-2 pr-8 text-sm text-[#1A1A1A] placeholder-[#C4C4C0] focus:outline-none focus:border-[#1A1A1A] transition-colors"
              style={{ fontFamily: "'Noto Serif SC', serif" }}
            />
            <svg
              className="absolute right-2 top-2.5 w-4 h-4 text-[#9B9B9B]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-16">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-1">
            {/* Categories */}
            <div className="mb-10">
              <h3
                className="text-[#1A1A1A] text-xs font-semibold tracking-[0.15em] uppercase mb-4"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                分类
              </h3>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => { setActiveCategory("all"); setActiveTag(""); }}
                    className={`text-sm transition-colors w-full text-left py-1 ${
                      activeCategory === "all" && !activeTag
                        ? "text-[#1A1A1A] font-medium"
                        : "text-[#6B6B6B] hover:text-[#1A1A1A]"
                    }`}
                    style={{ fontFamily: "'Noto Serif SC', serif" }}
                  >
                    全部 ({ARTICLES.length})
                  </button>
                </li>
                {CATEGORIES.map(cat => (
                  <li key={cat.id}>
                    <button
                      onClick={() => { setActiveCategory(cat.id); setActiveTag(""); }}
                      className={`text-sm transition-colors w-full text-left py-1 ${
                        activeCategory === cat.id
                          ? "text-[#1A1A1A] font-medium"
                          : "text-[#6B6B6B] hover:text-[#1A1A1A]"
                      }`}
                      style={{ fontFamily: "'Noto Serif SC', serif" }}
                    >
                      {cat.name} ({cat.count})
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tags */}
            <div>
              <h3
                className="text-[#1A1A1A] text-xs font-semibold tracking-[0.15em] uppercase mb-4"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                标签
              </h3>
              <div className="flex flex-wrap gap-2">
                {ALL_TAGS.map(tag => (
                  <button
                    key={tag}
                    onClick={() => {
                      setActiveTag(activeTag === tag ? "" : tag);
                      setActiveCategory("all");
                    }}
                    className={`tag-pill transition-all ${
                      activeTag === tag
                        ? "bg-[#1A1A1A] text-[#FAFAF8] border-[#1A1A1A]"
                        : ""
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Article List */}
          <div className="lg:col-span-3">
            {filtered.length === 0 ? (
              <div className="py-20 text-center">
                <p
                  className="text-[#9B9B9B] text-sm"
                  style={{ fontFamily: "'Noto Serif SC', serif" }}
                >
                  没有找到相关文章
                </p>
              </div>
            ) : (
              <div>
                <p
                  className="text-[#9B9B9B] text-xs tracking-[0.08em] mb-6"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {filtered.length} 篇文章
                </p>
                {filtered.map((article) => (
                  <ArticleCard key={article.id} article={article} variant="default" />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
