/*
 * 设计哲学：日式极简主义
 * 归档页：按年份分组，时间线布局，等宽字体日期
 */

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { parseTags } from "@/lib/utils";

function formatShortDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("zh-CN", { month: "long", day: "numeric" });
}

export default function Archive() {
  const [archive, setArchive] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  // 调用 tRPC API 获取归档数据
  const { data: archiveData, isLoading: isQueryLoading } = trpc.archive.getByYear.useQuery();

  useEffect(() => {
    if (!isQueryLoading) {
      if (archiveData?.success) {
        setArchive(archiveData.archive);
      }
      setIsLoading(false);
    }
  }, [archiveData, isQueryLoading]);

  const years = Object.keys(archive);
  const totalArchives = Object.values(archive).reduce((sum, arr) => sum + arr.length, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Navbar />
        <Loader2 className="w-8 h-8 animate-spin text-foreground/50" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="pt-28 pb-20 max-w-3xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16 fade-in-up">
          <p
            className="text-muted-foreground text-xs tracking-[0.2em] uppercase mb-3"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Archive
          </p>
          <h1
            className="text-foreground text-4xl md:text-5xl font-bold mb-4"
            style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif", letterSpacing: "-0.02em" }}
          >
            归档
          </h1>
          <p
            className="text-foreground/70 text-base"
            style={{ fontFamily: "'Noto Serif SC', serif" }}
          >
            {totalArchives} 篇归档，跨越 {years.length} 年的记录。
          </p>
        </div>

        {/* Timeline */}
        {years.length > 0 ? (
          <div className="space-y-16 fade-in-up fade-in-up-delay-1">
            {years.map(year => (
              <div key={year}>
                {/* Year Header */}
                <div className="flex items-baseline gap-4 mb-6">
                  <h2
                    className="text-foreground text-5xl font-bold opacity-10 select-none"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {year}
                  </h2>
                  <div className="flex-1 h-px bg-border mt-3" />
                  <span
                    className="text-muted-foreground text-xs"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {archive[year].length} 篇
                  </span>
                </div>

                {/* Archives */}
                <ul className="space-y-0">
                  {archive[year].map((item) => {
                    const tags = parseTags(item.tags);
                    return (
                      <li key={item.id}>
                        <Link href={`/archive/${item.slug}`}>
                          <div className="group flex items-baseline gap-6 py-4 border-b border-border hover:bg-card -mx-4 px-4 transition-colors duration-150 cursor-pointer">
                            <span
                              className="text-muted-foreground text-xs shrink-0 w-20"
                              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                            >
                              {formatShortDate(item.date)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <h3
                                className="text-foreground text-base font-medium group-hover:text-foreground transition-colors truncate"
                                style={{ fontFamily: "'Noto Serif SC', serif" }}
                              >
                                {item.title}
                              </h3>
                              {item.subtitle && (
                                <p
                                  className="text-muted-foreground text-xs mt-0.5 truncate"
                                  style={{ fontFamily: "'Noto Serif SC', serif" }}
                                >
                                  {item.subtitle}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {tags.slice(0, 1).map((tag: string) => (
                                <span
                                  key={tag}
                                  className="text-muted-foreground text-xs hidden sm:block"
                                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                                >
                                  #{tag}
                                </span>
                              ))}
                              <span
                                className="text-border text-xs"
                                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                              >
                                {item.readTime}m
                              </span>
                            </div>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p
              className="text-muted-foreground text-lg"
              style={{ fontFamily: "'Noto Serif SC', serif" }}
            >
              暂无归档内容
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
