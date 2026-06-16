import { useState, useMemo } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { parseTags } from "@/lib/utils";

export default function AdminArticles() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.listArticles.useQuery();
  const [search, setSearch] = useState("");

  const deleteMutation = trpc.admin.deleteArticle.useMutation({
    onSuccess: () => {
      toast.success("文章已删除");
      utils.admin.listArticles.invalidate();
      utils.blog.listArticles.invalidate();
    },
    onError: () => {
      toast.error("删除失败");
    },
  });

  const toggleStatusMutation = trpc.admin.toggleArticleStatus.useMutation({
    onSuccess: result => {
      if (result.success) {
        toast.success(
          result.status === "published" ? "文章已发布" : "文章已转为草稿"
        );
        utils.admin.listArticles.invalidate();
        utils.blog.listArticles.invalidate();
      }
    },
    onError: () => toast.error("状态切换失败"),
  });

  const articles = data?.articles ?? [];

  // 反序列化 tags
  const parsed = articles.map(a => ({
    ...a,
    tags: parseTags(a.tags),
  }));

  // 搜索过滤
  const filtered = useMemo(() => {
    if (!search.trim()) return parsed;
    const q = search.toLowerCase();
    return parsed.filter(
      a =>
        a.title.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.tags.some(t => t.toLowerCase().includes(q)) ||
        (a.excerpt && a.excerpt.toLowerCase().includes(q))
    );
  }, [parsed, search]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
        >
          文章管理
        </h1>
        <Link href="/admin/articles/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新建文章
          </Button>
        </Link>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜索文章标题、分类、标签..."
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          加载中...
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">
          {search.trim() ? "没有匹配的文章" : "暂无文章"}
        </p>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left text-sm font-medium px-4 py-3">
                  标题
                </th>
                <th className="text-left text-sm font-medium px-4 py-3">
                  状态
                </th>
                <th className="text-left text-sm font-medium px-4 py-3">
                  分类
                </th>
                <th className="text-left text-sm font-medium px-4 py-3">
                  日期
                </th>
                <th className="text-left text-sm font-medium px-4 py-3">
                  标签
                </th>
                <th className="text-right text-sm font-medium px-4 py-3">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(article => (
                <tr
                  key={article.id}
                  className="border-b border-border last:border-b-0 hover:bg-accent/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-sm">{article.title}</div>
                    {article.featured ? (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        置顶
                      </Badge>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() =>
                        toggleStatusMutation.mutate({ id: article.id })
                      }
                      className="cursor-pointer"
                      title={
                        article.status === "published"
                          ? "点击转为草稿"
                          : "点击发布"
                      }
                    >
                      <Badge
                        variant={
                          article.status === "published"
                            ? "default"
                            : "secondary"
                        }
                        className={`text-xs ${article.status === "published" ? "bg-green-600 hover:bg-green-700" : "bg-muted-foreground/20 hover:bg-muted-foreground/30"}`}
                      >
                        {article.status === "published" ? "已发布" : "草稿"}
                      </Badge>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {article.category}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {article.date}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(article.tags as string[]).slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/articles/${article.id}`}>
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除</AlertDialogTitle>
                            <AlertDialogDescription>
                              确定要删除文章「{article.title}
                              」吗？此操作不可撤销。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                deleteMutation.mutate({ id: article.id })
                              }
                            >
                              删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
