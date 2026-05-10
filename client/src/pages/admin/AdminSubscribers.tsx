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
import { Loader2, Trash2, Send } from "lucide-react";
import { toast } from "sonner";

export default function AdminSubscribers() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.listSubscribers.useQuery();

  const deleteMutation = trpc.admin.deleteSubscriber.useMutation({
    onSuccess: () => {
      toast.success("订阅者已删除");
      utils.admin.listSubscribers.invalidate();
    },
    onError: () => toast.error("删除失败"),
  });

  const subscribers = data?.subscribers ?? [];

  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
    pending: { label: "待验证", variant: "secondary", className: "bg-muted-foreground/20" },
    confirmed: { label: "已确认", variant: "default", className: "bg-green-600 hover:bg-green-700" },
    unsubscribed: { label: "已退订", variant: "outline", className: "border-red-300 text-red-500" },
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
        >
          订阅管理
        </h1>
        <span className="text-sm text-muted-foreground">
          共 {subscribers.length} 位订阅者
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          加载中...
        </div>
      ) : subscribers.length === 0 ? (
        <p className="text-muted-foreground">暂无订阅者</p>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left text-sm font-medium px-4 py-3">邮箱</th>
                <th className="text-left text-sm font-medium px-4 py-3">状态</th>
                <th className="text-left text-sm font-medium px-4 py-3">订阅时间</th>
                <th className="text-left text-sm font-medium px-4 py-3">验证时间</th>
                <th className="text-right text-sm font-medium px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map(sub => {
                const status = statusMap[sub.status] || statusMap.pending;
                return (
                  <tr
                    key={sub.id}
                    className="border-b border-border last:border-b-0 hover:bg-accent/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm">{sub.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={status.variant} className={`text-xs ${status.className}`}>
                        {status.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(sub.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {sub.confirmedAt ? formatDate(sub.confirmedAt) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
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
                              确定要删除订阅者「{sub.email}」吗？此操作不可撤销。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate({ id: sub.id })}
                            >
                              删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
