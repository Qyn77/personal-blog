import { useEffect } from "react";
import { Link, useParams } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContentStatus from "@/components/ContentStatus";
import { trpc } from "@/lib/trpc";
import { setPageMeta } from "@/lib/seo";

export default function Series() {
  const { name } = useParams<{ name?: string }>();
  const list = trpc.blog.seriesList.useQuery(undefined, { enabled: !name });
  const chapters = trpc.blog.seriesArticles.useQuery(
    { name: name || "_" },
    { enabled: !!name }
  );
  const query = name ? chapters : list;
  useEffect(() => {
    setPageMeta({
      title: name ? `系列 · ${name}` : "专题系列",
      description: "沿着一条线索，连续阅读一个主题。",
    });
  }, [name]);
  if (query.isLoading || query.isError)
    return (
      <ContentStatus
        loading={query.isLoading}
        error={query.isError}
        kind="系列"
        back="/series"
        retry={() => void query.refetch()}
      />
    );
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 lg:px-8 pt-28 pb-20">
        {name && (
          <Link
            href="/series"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← 所有系列
          </Link>
        )}
        <h1 className="text-4xl font-semibold mt-6 mb-4 break-words">
          {name || "专题系列"}
        </h1>
        <p className="text-muted-foreground mb-12">
          {name
            ? `${chapters.data?.length ?? 0} 篇文章 · 按章节顺序阅读`
            : "沿着一条线索，连续阅读一个主题。"}
        </p>
        {name ? (
          <ol className="divide-y divide-border">
            {chapters.data?.map((chapter, index) => (
              <li key={chapter.id}>
                <Link
                  href={`/article/${chapter.slug}`}
                  className="block py-6 group"
                >
                  <span className="text-sm text-muted-foreground">
                    {String(index + 1).padStart(2, "0")} · {chapter.date}
                  </span>
                  <h2 className="text-2xl mt-2 mb-3 group-hover:underline break-words">
                    {chapter.title}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {chapter.excerpt}
                  </p>
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <ul className="divide-y divide-border">
            {list.data?.map(series => (
              <li key={series.name}>
                <Link
                  href={`/series/${encodeURIComponent(series.name!)}`}
                  className="flex justify-between gap-6 py-8 group"
                >
                  <h2 className="text-2xl group-hover:underline break-words">
                    {series.name}
                  </h2>
                  <span className="text-sm text-muted-foreground shrink-0">
                    {series.count} 篇 →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {(name ? !chapters.data?.length : !list.data?.length) && (
          <p className="py-12 text-muted-foreground">
            {name ? "该系列暂无公开文章。" : "新的系列正在整理中。"}
          </p>
        )}
      </main>
      <Footer />
    </div>
  );
}
