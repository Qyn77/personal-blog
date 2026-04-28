/*
 * 设计哲学：日式极简主义
 * 博客列表页：左侧分类筛选，右侧文章列表，大量留白
 * 动态从本地 Markdown 文件加载文章
 */

import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

interface BlogArticle {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  date: string;
  category: string;
  tags: string[];
  featured: boolean;
  readTime: number;
  content?: string;
}

export default function Blog() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialCategory = params.get("category") || "all";
  const initialTag = params.get("tag") || "";

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [activeTag, setActiveTag] = useState(initialTag);
  const [searchQuery, setSearchQuery] = useState("");
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 调用 tRPC API 加载所有文章
  const { data: articlesData, isLoading: isLoadingArticles } = trpc.blog.listArticles.useQuery();

  useEffect(() => {
    setActiveCategory(params.get("category") || "all");
    setActiveTag(params.get("tag") || "");
  }, [search]);

  // 当文章数据加载完成时，提取分类和标签
  useEffect(() => {
    if (articlesData && articlesData.success && Array.isArray(articlesData.articles)) {
      setArticles(articlesData.articles as BlogArticle[]);
      setIsLoading(false);

      // 提取所有唯一的分类
      const uniqueCategories = Array.from(
        new Set(articlesData.articles.map((a: any) => a.category))
      ).sort() as string[];
      setCategories(uniqueCategories);

      // 提取所有唯一的标签
      const uniqueTags = Array.from(
        new Set(articlesData.articles.flatMap((a: any) => a.tags))
      ).sort() as string[];
      setTags(uniqueTags);
    } else if (articlesData && !articlesData.success) {
      setIsLoading(false);
      console.error("Failed to load articles:", articlesData.error);
    }
  }, [articlesData]);

  useEffect(() => {
    setIsLoading(isLoadingArticles);
  }, [isLoadingArticles]);

  let filtered = articles;

  if (activeCategory !== "all") {
    filtered = filtered.filter((a) => a.category === activeCategory);
  }
  if (activeTag) {
    filtered = filtered.filter((a) => a.tags.includes(activeTag));
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  // Sort by date descending
  filtered = [...filtered].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

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

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-foreground/50" />
            </div>
          ) : (
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
                      onClick={() => setActiveCategory("all")}
                      className={`block text-left text-sm transition-colors ${
                        activeCategory === "all"
                          ? "text-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      style={{ fontFamily: "'Noto Serif SC', serif" }}
                    >
                      全部
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
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
                    {tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setActiveTag(activeTag === tag ? "" : tag)}
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
                <div className="mb-8">
                  <input
                    type="text"
                    placeholder="搜索文章..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 bg-card text-foreground border border-border rounded-lg placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-all"
                    style={{ fontFamily: "'Noto Serif SC', serif" }}
                  />
                </div>

                {/* Articles */}
                {filtered.length > 0 ? (
                  <div className="space-y-6">
                    {filtered.map((article) => {
                      // 转换为 ArticleCard 期望的类型
                      const cardArticle = {
                        ...article,
                        content: article.content || "",
                      };
                      return (
                        <ArticleCard key={article.id} article={cardArticle as any} />
                      );
                    })}
                  </div>
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
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
