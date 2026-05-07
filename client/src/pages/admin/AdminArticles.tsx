import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
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
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminArticles() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.listArticles.useQuery();

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

  const articles = data?.articles ?? [];

  // 反序列化 tags
  const parsed = articles.map(a => ({
    ...a,
    tags: typeof a.tags === "string" ? JSON.parse(a.tags) : a.tags,
  }));

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

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          加载中...
        </div>
      ) : parsed.length === 0 ? (
        <p className="text-muted-foreground">暂无文章</p>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left text-sm font-medium px-4 py-3">标题</th>
                <th className="text-left text-sm font-medium px-4 py-3">分类</th>
                <th className="text-left text-sm font-medium px-4 py-3">日期</th>
                <th className="text-left text-sm font-medium px-4 py-3">标签</th>
                <th className="text-right text-sm font-medium px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {parsed.map(article => (
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
                              确定要删除文章「{article.title}」吗？此操作不可撤销。
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
