import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

export default function SeriesNavigation({
  name,
  slug,
}: {
  name: string;
  slug: string;
}) {
  const { data } = trpc.blog.seriesArticles.useQuery({ name });
  const index = data?.findIndex(article => article.slug === slug) ?? -1;
  if (!data || index < 0) return null;
  const previous = data[index - 1];
  const next = data[index + 1];
  return (
    <nav aria-label="系列阅读" className="my-12 border-y border-border py-6">
      <Link
        href={`/series/${encodeURIComponent(name)}`}
        className="font-semibold hover:underline break-words"
      >
        系列 · {name} →
      </Link>
      <p className="text-sm text-muted-foreground mt-2">
        第 {index + 1} 篇，共 {data.length} 篇
      </p>
      <div className="grid gap-6 md:grid-cols-2 mt-6">
        <div>
          {previous && (
            <Link
              href={`/article/${previous.slug}`}
              className="block hover:underline break-words"
            >
              <span className="block text-sm text-muted-foreground mb-2">
                ← 上一篇
              </span>
              {previous.title}
            </Link>
          )}
        </div>
        <div className="md:text-right">
          {next && (
            <Link
              href={`/article/${next.slug}`}
              className="block hover:underline break-words"
            >
              <span className="block text-sm text-muted-foreground mb-2">
                下一篇 →
              </span>
              {next.title}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
