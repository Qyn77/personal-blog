/*
 * 设计哲学：日式极简主义
 * 博客列表页：左侧分类筛选，右侧文章列表，大量留白
 * 支持服务端分页、搜索、标签筛选
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearch } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import { trpc } from "@/lib/trpc";
import { Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { parseTags } from "@/lib/utils";
import { setPageMeta } from "@/lib/seo";

const PAGE_SIZE = 10;

export default function Blog() {
  const search = useSearch();
  const params = new URLSearchParams(search);

  // 筛选状态（从 URL 初始化）
  const [activeCategory, setActiveCategory] = useState(params.get("category") || "all");
  const [activeTag, setActiveTag] = useState(params.get("tag") || "");
  const [searchQuery, setSearchQuery] = useState(params.get("q") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(params.get("q") || "");
  const [page, setPage] = useState(parseInt(params.get("page") || "1", 10));

  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // 页面 meta
  useEffect(() => {
    setPageMeta({ title: "文章", description: "关于阅读、写作、生活与思考的碎片。" });
  }, []);

  // 同步 URL 参数
  useEffect(() => {
    setActiveCategory(params.get("category") || "all");
    setActiveTag(params.get("tag") || "");
    setSearchQuery(params.get("q") || "");
    setDebouncedSearch(params.get("q") || "");
    setPage(parseInt(params.get("page") || "1", 10));
  }, [search]);

  // 更新 URL 参数
  const updateUrl = useCallback((updates: Record<string, string>) => {
    const p = new URLSearchParams(window.location.search);
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "all" && value !== "1" && key !== "page" || (key === "page" && value !== "1")) {
        p.set(key, value);
      } else {
        p.delete(key);
      }
    });
    const qs = p.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, []);

  // 搜索防抖
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
      updateUrl({ q: value, page: "1" });
    }, 300);
  };

  // 分类切换
  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setPage(1);
    updateUrl({ category: cat, page: "1" });
  };

  // 标签切换
  const handleTagChange = (tag: string) => {
    const newTag = activeTag === tag ? "" : tag;
    setActiveTag(newTag);
    setPage(1);
    updateUrl({ tag: newTag, page: "1" });
  };

  // 翻页
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateUrl({ page: String(newPage) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 获取筛选选项
  const { data: filterData } = trpc.blog.getFilterOptions.useQuery();
  const categories = filterData?.categories ?? [];
  const tags = filterData?.tags ?? [];

  // 获取文章列表（服务端分页+筛选）
  const hasFilters = !!debouncedSearch || activeCategory !== "all" || !!activeTag || page > 1;
  const { data: articlesData, isLoading } = trpc.blog.listArticles.useQuery(
    hasFilters
      ? {
          page,
          pageSize: PAGE_SIZE,
          search: debouncedSearch || undefined,
          category: activeCategory !== "all" ? activeCategory : undefined,
          tag: activeTag || undefined,
        }
      : undefined
  );

  const articles = (articlesData?.articles ?? []).map((a: any) => ({
    ...a,
    tags: parseTags(a.tags),
    featured: typeof a.featured === "number" ? a.featured === 1 : a.featured,
  }));

  const total = articlesData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // 生成页码数组（最多显示 5 个页码）
  const getPageNumbers = () => {
    const pages: number[] = [];
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="pt-28 pb-20">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12 fade-in-up">
            <p
              className="text-muted-foreground text-xs tracking-[0.2em] uppercase mb-3"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Blog
            </p>
            <h1
              className="text-foreground text-4xl md:text-5xl font-bold mb-4"
              style={{
                fontFamily: "'Playfair Display', 'Noto Serif SC', serif",
                letterSpacing: "-0.02em",
              }}
            >
              文章
            </h1>
            <p
              className="text-foreground/70 text-lg"
              style={{ fontFamily: "'Noto Serif SC', serif" }}
            >
              关于阅读、写作、生活与思考的碎片。
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar - Categories & Tags */}
            <aside className="lg:col-span-1 fade-in-up fade-in-up-delay-1">
              {/* Categories */}
              <div className="mb-12">
                <h3
                  className="text-foreground text-sm font-semibold uppercase tracking-[0.1em] mb-4"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  分类
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => handleCategoryChange("all")}
                    className={`block text-left text-sm transition-colors ${
                      activeCategory === "all"
                        ? "text-foreground font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    style={{ fontFamily: "'Noto Serif SC', serif" }}
                  >
                    全部
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => handleCategoryChange(cat)}
                      className={`block text-left text-sm transition-colors ${
                        activeCategory === cat
                          ? "text-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      style={{ fontFamily: "'Noto Serif SC', serif" }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <h3
                  className="text-foreground text-sm font-semibold uppercase tracking-[0.1em] mb-4"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  标签
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleTagChange(tag)}
                      className={`px-3 py-1 text-xs rounded transition-colors ${
                        activeTag === tag
                          ? "bg-foreground text-background"
                          : "bg-card text-foreground hover:bg-foreground/10"
                      }`}
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-3 fade-in-up fade-in-up-delay-2">
              {/* Search */}
              <div className="mb-8 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="搜索文章..."
                  value={searchQuery}
                  onChange={e => handleSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-card text-foreground border border-border rounded-lg placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all"
                  style={{ fontFamily: "'Noto Serif SC', serif" }}
                />
              </div>

              {/* Active filters indicator */}
              {(activeCategory !== "all" || activeTag || debouncedSearch) && (
                <div className="mb-6 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                    筛选:
                  </span>
                  {activeCategory !== "all" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-accent rounded">
                      {activeCategory}
                      <button onClick={() => handleCategoryChange("all")} className="hover:text-destructive">&times;</button>
                    </span>
                  )}
                  {activeTag && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-accent rounded">
                      #{activeTag}
                      <button onClick={() => handleTagChange(activeTag)} className="hover:text-destructive">&times;</button>
                    </span>
                  )}
                  {debouncedSearch && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-accent rounded">
                      &quot;{debouncedSearch}&quot;
                      <button onClick={() => handleSearchChange("")} className="hover:text-destructive">&times;</button>
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground ml-1" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                    {total} 篇结果
                  </span>
                </div>
              )}

              {/* Articles */}
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-foreground/50" />
                </div>
              ) : articles.length > 0 ? (
                <>
                  <div className="space-y-6">
                    {articles.map(article => (
                      <ArticleCard key={article.id} article={article as any} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-12 flex items-center justify-center gap-2">
                      <button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page <= 1}
                        className="p-2 rounded-md border border-border text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-accent transition-colors"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      {getPageNumbers().map(p => (
                        <button
                          key={p}
                          onClick={() => handlePageChange(p)}
                          className={`w-9 h-9 rounded-md text-sm transition-colors ${
                            p === page
                              ? "bg-foreground text-background"
                              : "border border-border hover:bg-accent"
                          }`}
                          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page >= totalPages}
                        className="p-2 rounded-md border border-border text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-accent transition-colors"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <p
                    className="text-muted-foreground text-lg"
                    style={{ fontFamily: "'Noto Serif SC', serif" }}
                  >
                    未找到匹配的文章
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
