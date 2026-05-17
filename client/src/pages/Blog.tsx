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
import { Loader2, Search } from "lucide-react";
import { parseTags } from "@/lib/utils";
import { setPageMeta } from "@/lib/seo";

const PAGE_SIZE = 10;

export default function Blog() {
  const search = useSearch();
  const params = new URLSearchParams(search);

  // 筛选状态（从 URL 初始化）
  const [activeCategory, setActiveCategory] = useState(
    params.get("category") || "all"
  );
  const [activeTag, setActiveTag] = useState(params.get("tag") || "");
  const [searchQuery, setSearchQuery] = useState(params.get("q") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(params.get("q") || "");

  // 无限滚动状态
  const [allArticles, setAllArticles] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // 用 ref 追踪最新状态，避免 IntersectionObserver 闭包过时
  const stateRef = useRef({
    hasMore: true,
    isLoading: false,
    isLoadingMore: false,
  });

  // 页面 meta
  useEffect(() => {
    setPageMeta({
      title: "文章",
      description: "关于阅读、写作、生活与思考的碎片。",
    });
  }, []);

  // 同步 URL 参数（筛选条件变化时重置列表）
  useEffect(() => {
    const newCategory = params.get("category") || "all";
    const newTag = params.get("tag") || "";
    const newQ = params.get("q") || "";
    setActiveCategory(newCategory);
    setActiveTag(newTag);
    setSearchQuery(newQ);
    setDebouncedSearch(newQ);
    // 筛选条件变化，重置分页
    setAllArticles([]);
    setPage(1);
    setHasMore(true);
  }, [search]);

  // 更新 URL 参数
  const updateUrl = useCallback((updates: Record<string, string>) => {
    const p = new URLSearchParams(window.location.search);
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "all" && key !== "page") {
        p.set(key, value);
      } else {
        p.delete(key);
      }
    });
    // 筛选变化时清除 page 参数
    p.delete("page");
    const qs = p.toString();
    window.history.replaceState(
      null,
      "",
      qs ? `?${qs}` : window.location.pathname
    );
  }, []);

  // 搜索防抖
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(value);
      setAllArticles([]);
      setPage(1);
      setHasMore(true);
      updateUrl({ q: value });
    }, 300);
  };

  // 分类切换
  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setAllArticles([]);
    setPage(1);
    setHasMore(true);
    updateUrl({ category: cat });
  };

  // 标签切换
  const handleTagChange = (tag: string) => {
    const newTag = activeTag === tag ? "" : tag;
    setActiveTag(newTag);
    setAllArticles([]);
    setPage(1);
    setHasMore(true);
    updateUrl({ tag: newTag });
  };

  // 获取筛选选项
  const { data: filterData } = trpc.blog.getFilterOptions.useQuery();
  const categories = filterData?.categories ?? [];
  const tags = filterData?.tags ?? [];

  // 获取文章列表（每次请求一页）
  const { data: articlesData, isLoading } = trpc.blog.listArticles.useQuery({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch || undefined,
    category: activeCategory !== "all" ? activeCategory : undefined,
    tag: activeTag || undefined,
  });

  // 同步最新状态到 ref，供 IntersectionObserver 回调读取
  stateRef.current = { hasMore, isLoading, isLoadingMore };

  // 将新数据追加到已有列表
  useEffect(() => {
    if (!articlesData?.articles) return;

    const newArticles = articlesData.articles.map((a: any) => ({
      ...a,
      tags: parseTags(a.tags),
      featured: typeof a.featured === "number" ? a.featured === 1 : a.featured,
    }));

    if (page === 1) {
      setAllArticles(newArticles);
    } else {
      setAllArticles(prev => [...prev, ...newArticles]);
    }

    const total = articlesData.total ?? 0;
    setHasMore(page * PAGE_SIZE < total);
    setIsLoadingMore(false);
  }, [articlesData, page]);

  // callback ref：哨兵元素挂载到 DOM 时自动创建并挂载 observer
  const sentinelCallbackRef = useCallback((node: HTMLDivElement | null) => {
    // 清理旧 observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (!node) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          const { hasMore, isLoading, isLoadingMore } = stateRef.current;
          if (hasMore && !isLoading && !isLoadingMore) {
            setIsLoadingMore(true);
            setPage(prev => prev + 1);
          }
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(node);
    observerRef.current = observer;
  }, []);

  // 组件卸载时清理 observer
  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

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
                  <span
                    className="text-xs text-muted-foreground"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    筛选:
                  </span>
                  {activeCategory !== "all" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-accent rounded">
                      {activeCategory}
                      <button
                        onClick={() => handleCategoryChange("all")}
                        className="hover:text-destructive"
                      >
                        &times;
                      </button>
                    </span>
                  )}
                  {activeTag && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-accent rounded">
                      #{activeTag}
                      <button
                        onClick={() => handleTagChange(activeTag)}
                        className="hover:text-destructive"
                      >
                        &times;
                      </button>
                    </span>
                  )}
                  {debouncedSearch && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-accent rounded">
                      &quot;{debouncedSearch}&quot;
                      <button
                        onClick={() => handleSearchChange("")}
                        className="hover:text-destructive"
                      >
                        &times;
                      </button>
                    </span>
                  )}
                  <span
                    className="text-xs text-muted-foreground ml-1"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {articlesData?.total ?? 0} 篇结果
                  </span>
                </div>
              )}

              {/* Articles */}
              {isLoading && page === 1 ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-foreground/50" />
                </div>
              ) : allArticles.length > 0 ? (
                <>
                  <div className="space-y-6">
                    {allArticles.map(article => (
                      <ArticleCard key={article.id} article={article as any} />
                    ))}
                  </div>

                  {/* 加载更多指示器 */}
                  {isLoadingMore && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-foreground/50" />
                    </div>
                  )}

                  {/* 哨兵元素：滚动到此处时触发加载 */}
                  {hasMore && <div ref={sentinelCallbackRef} className="h-4" />}

                  {/* 全部加载完毕 */}
                  {!hasMore && (
                    <p
                      className="text-center text-muted-foreground text-sm py-8"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      — 已展示全部 {allArticles.length} 篇文章 —
                    </p>
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
