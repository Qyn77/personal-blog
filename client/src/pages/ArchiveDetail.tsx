/*
 * 归档详情页
 * 显示单个归档内容
 */

import { useParams, Link } from "wouter";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
}

export default function ArchiveDetail() {
  const params = useParams<{ slug: string }>();
  const [archive, setArchive] = useState<any | null>(null);
  const [readProgress, setReadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // 调用 tRPC API 获取单个归档
  const { data: archiveData } = trpc.archive.getArchive.useQuery({
    slug: params.slug || "",
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [params.slug]);

  // 当归档数据加载完成时
  useEffect(() => {
    if (archiveData && archiveData.success && archiveData.archive) {
      const item = archiveData.archive as any;
      // 如果 tags 是字符串，解析为数组
      if (typeof item.tags === 'string') {
        item.tags = JSON.parse(item.tags);
      }
      setArchive(item);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [archiveData]);

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

  if (!archive) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <p
            className="text-muted-foreground text-sm mb-4"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            404 · 归档不存在
          </p>
          <Link href="/archive">
            <button
              className="text-foreground hover:text-foreground/70 transition-colors"
              style={{ fontFamily: "'Noto Serif SC', serif" }}
            >
              返回归档列表
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
        className="fixed top-0 left-0 h-1 bg-foreground transition-all duration-300 z-[60]"
        style={{ width: `${readProgress}%` }}
      />

      <Navbar />

      <main className="pt-28 pb-20">
        <article className="max-w-4xl mx-auto px-6 lg:px-8">
          {/* 归档头部 */}
          <div className="mb-12 fade-in-up">
            <p
              className="text-muted-foreground text-xs tracking-[0.2em] uppercase mb-3"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {archive.category}
            </p>
            <h1
              className="text-foreground text-4xl md:text-5xl font-bold mb-4 leading-tight"
              style={{
                fontFamily: "'Playfair Display', 'Noto Serif SC', serif",
                letterSpacing: "-0.02em",
              }}
            >
              {archive.title}
            </h1>
            {archive.subtitle && (
              <p
                className="text-foreground/70 text-lg mb-6"
                style={{ fontFamily: "'Noto Serif SC', serif" }}
              >
                {archive.subtitle}
              </p>
            )}

            {/* 归档元数据 */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                {formatDate(archive.date)}
              </span>
              <span>·</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                {archive.readTime} min read
              </span>
              {archive.tags && archive.tags.length > 0 && (
                <>
                  <span>·</span>
                  <div className="flex gap-2">
                    {archive.tags.map((tag: string) => (
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

          {/* 归档内容 */}
          <div className="mb-16 fade-in-up fade-in-up-delay-1">
            <MarkdownRenderer content={archive.content} />
          </div>

          {/* 分割线 */}
          <div className="my-12 border-t border-border" />

          {/* 返回链接 */}
          <div className="text-center pt-8">
            <Link href="/archive">
              <button
                className="text-foreground hover:text-foreground/70 transition-colors"
                style={{ fontFamily: "'Noto Serif SC', serif" }}
              >
                ← 返回归档列表
              </button>
            </Link>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
