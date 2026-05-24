import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
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
import {
  Loader2,
  Trash2,
  Monitor,
  Smartphone,
  Tablet,
  ChevronLeft,
  ChevronRight,
  Eye,
  Users,
  CalendarDays,
  CalendarRange,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

const DEVICE_ICONS: Record<string, typeof Monitor> = {
  Desktop: Monitor,
  Mobile: Smartphone,
  Tablet: Tablet,
};

const PAGE_SIZE = 20;

export default function AdminVisitors() {
  const [page, setPage] = useState(1);
  const utils = trpc.useUtils();

  const { data: statsData, isLoading: statsLoading } =
    trpc.admin.getVisitorStats.useQuery();

  const { data: visitorsData, isLoading: visitorsLoading } =
    trpc.admin.listVisitors.useQuery({
      page,
      pageSize: PAGE_SIZE,
    });

  const cleanMutation = trpc.admin.cleanOldVisitors.useMutation({
    onSuccess: data => {
      toast.success(`已清理 ${data.deleted} 条过期记录`);
      utils.admin.getVisitorStats.invalidate();
      utils.admin.listVisitors.invalidate();
    },
    onError: () => toast.error("清理失败"),
  });

  const stats = statsData?.stats;
  const visitors = visitorsData?.items ?? [];
  const total = visitorsData?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statCards = stats
    ? [
        { label: "今日", value: stats.today, icon: Eye },
        { label: "昨日", value: stats.yesterday, icon: CalendarDays },
        { label: "本周", value: stats.thisWeek, icon: CalendarRange },
        { label: "本月", value: stats.thisMonth, icon: Calendar },
        { label: "总计", value: stats.total, icon: Users },
      ]
    : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
        >
          访客记录
        </h1>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Trash2 className="h-4 w-4 mr-1" />
              清理旧数据
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>清理旧访客记录</AlertDialogTitle>
              <AlertDialogDescription>
                将删除 90 天前的访客记录，此操作不可撤销。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => cleanMutation.mutate({ days: 90 })}
              >
                确认清理
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* 统计卡片 */}
      {statsLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground mb-6">
          <Loader2 className="h-4 w-4 animate-spin" />
          加载中...
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          {statCards.map(card => (
            <div
              key={card.label}
              className="border border-border rounded-lg p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <card.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {card.label}
                </span>
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* 访客列表 */}
      {visitorsLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          加载中...
        </div>
      ) : visitors.length === 0 ? (
        <p className="text-muted-foreground">暂无访客记录</p>
      ) : (
        <>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left text-sm font-medium px-4 py-3">
                    IP
                  </th>
                  <th className="text-left text-sm font-medium px-4 py-3">
                    位置
                  </th>
                  <th className="text-left text-sm font-medium px-4 py-3">
                    设备
                  </th>
                  <th className="text-left text-sm font-medium px-4 py-3">
                    浏览器 / 系统
                  </th>
                  <th className="text-left text-sm font-medium px-4 py-3">
                    访问路径
                  </th>
                  <th className="text-left text-sm font-medium px-4 py-3">
                    时间
                  </th>
                </tr>
              </thead>
              <tbody>
                {visitors.map(v => {
                  const DeviceIcon = DEVICE_ICONS[v.device || ""] || Monitor;
                  return (
                    <tr
                      key={v.id}
                      className="border-b border-border last:border-b-0 hover:bg-accent/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-mono">{v.ip}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {[v.city, v.country].filter(Boolean).join(", ") || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-sm">
                          <DeviceIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          {v.device || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {v.browser}
                        {v.os ? ` / ${v.os}` : ""}
                      </td>
                      <td className="px-4 py-3 text-sm max-w-[200px] truncate">
                        {v.path}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                        {formatTime(v.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-muted-foreground">
                共 {total} 条记录，第 {page}/{totalPages} 页
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
