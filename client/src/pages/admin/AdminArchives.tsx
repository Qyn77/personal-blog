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
import { parseTags } from "@/lib/utils";

export default function AdminArchives() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.listArchives.useQuery();

  const deleteMutation = trpc.admin.deleteArchive.useMutation({
    onSuccess: () => {
      toast.success("归档已删除");
      utils.admin.listArchives.invalidate();
      utils.archive.listArchives.invalidate();
      utils.archive.getByYear.invalidate();
    },
    onError: () => {
      toast.error("删除失败");
    },
  });

  const archives = data?.archives ?? [];

  const parsed = archives.map(a => ({
    ...a,
    tags: parseTags(a.tags),
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
        >
          归档管理
        </h1>
        <Link href="/admin/archives/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新建归档
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          加载中...
        </div>
      ) : parsed.length === 0 ? (
        <p className="text-muted-foreground">暂无归档内容</p>
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
              {parsed.map(archive => (
                <tr
                  key={archive.id}
                  className="border-b border-border last:border-b-0 hover:bg-accent/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-sm">{archive.title}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {archive.category}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {archive.date}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(archive.tags as string[]).slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/archives/${archive.id}`}>
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
                              确定要删除归档「{archive.title}」吗？此操作不可撤销。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                deleteMutation.mutate({ id: archive.id })
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
