/*
 * 设计哲学：日式极简主义
 * 归档页：按年份分组，时间线布局，等宽字体日期
 */

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getArchiveByYear } from "@/lib/blogData";
import { Link } from "wouter";

function formatShortDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("zh-CN", { month: "long", day: "numeric" });
}

export default function Archive() {
  const archive = getArchiveByYear();
  const years = Object.keys(archive);
  const totalArticles = Object.values(archive).reduce((sum, arr) => sum + arr.length, 0);

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
            {totalArticles} 篇文章，跨越 {years.length} 年的写作记录。
          </p>
        </div>

        {/* Timeline */}
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

              {/* Articles */}
              <ul className="space-y-0">
                {archive[year].map((article, idx) => (
                  <li key={article.id}>
                    <Link href={`/article/${article.slug}`}>
                      <div className="group flex items-baseline gap-6 py-4 border-b border-border hover:bg-card -mx-4 px-4 transition-colors duration-150 cursor-pointer">
                        <span
                          className="text-muted-foreground text-xs shrink-0 w-20"
                          style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                        >
                          {formatShortDate(article.date)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3
                            className="text-foreground text-base font-medium group-hover:text-foreground transition-colors truncate"
                            style={{ fontFamily: "'Noto Serif SC', serif" }}
                          >
                            {article.title}
                          </h3>
                          {article.subtitle && (
                            <p
                              className="text-muted-foreground text-xs mt-0.5 truncate"
                              style={{ fontFamily: "'Noto Serif SC', serif" }}
                            >
                              {article.subtitle}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {article.tags.slice(0, 1).map(tag => (
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
                            {article.readTime}m
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
