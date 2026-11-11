import { useEffect, useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { Button } from "@/components/ui/button";
import { setPageMeta } from "@/lib/seo";

type Preview = {
  title: string;
  content: string;
  subtitle: string | null;
  date: string;
  status: string;
};
function subscribeHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}
const readHash = () => window.location.hash.slice(1);
export default function ArticlePreview() {
  const token = useSyncExternalStore(subscribeHash, readHash, () => "");
  useEffect(() => {
    setPageMeta({
      title: "私有预览",
      description: "文章私有预览",
      noindex: true,
    });
  }, []);
  const query = useQuery({
    queryKey: ["private-preview", token],
    gcTime: 0,
    staleTime: 0,
    retry: false,
    refetchInterval: 60000,
    queryFn: async ({ signal }): Promise<Preview> => {
      const response = await fetch("/api/mcp-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
        signal,
        cache: "no-store",
        referrerPolicy: "no-referrer",
      });
      if (!response.ok)
        throw new Error(
          response.status === 404
            ? "链接已失效，请让 AI 重新生成预览链接。"
            : "暂时无法加载预览，请重试。"
        );
      return (await response.json()).article;
    },
  });
  return (
    <main className="max-w-4xl mx-auto px-6 lg:px-8 py-12 min-h-screen">
      <div className="border-b border-border pb-6 mb-8 space-y-3">
        <p className="text-sm font-semibold">墨迹 · 私有预览</p>
        <p className="text-sm text-muted-foreground">
          链接一小时有效，显示文章最新内容。重新生成链接或撤销对应令牌后失效。
        </p>
      </div>
      {query.isLoading ? (
        <p role="status">正在加载文章…</p>
      ) : query.isError ? (
        <div role="alert" className="space-y-4">
          <p>{query.error.message}</p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            重试
          </Button>
        </div>
      ) : (
        query.data && (
          <article>
            <p className="text-sm text-muted-foreground mb-4">
              {query.data.status === "draft"
                ? "草稿 · 尚未公开"
                : "已发布文章的预览"}{" "}
              · {query.data.date}
            </p>
            <h1 className="text-3xl md:text-5xl font-bold break-words mb-6">
              {query.data.title}
            </h1>
            {query.data.subtitle && (
              <p className="text-lg text-muted-foreground mb-8">
                {query.data.subtitle}
              </p>
            )}
            <MarkdownRenderer content={query.data.content} />
          </article>
        )
      )}
    </main>
  );
}
