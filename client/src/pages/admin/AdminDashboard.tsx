import { FileText, Archive, Upload } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const { data: articlesData } = trpc.admin.listArticles.useQuery();
  const { data: archivesData } = trpc.admin.listArchives.useQuery();

  const stats = [
    {
      label: "博客文章",
      count: articlesData?.total ?? 0,
      icon: FileText,
      href: "/admin/articles",
    },
    {
      label: "归档内容",
      count: archivesData?.total ?? 0,
      icon: Archive,
      href: "/admin/archives",
    },
  ];

  return (
    <div>
      <h1
        className="text-2xl font-bold mb-8"
        style={{ fontFamily: "'Playfair Display', 'Noto Serif SC', serif" }}
      >
        Dashboard
      </h1>

      {/* 快捷操作 */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">快捷操作</h2>
        <div className="flex gap-3">
          <Link href="/admin/articles/new">
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              上传文章
            </Button>
          </Link>
          <Link href="/admin/archives/new">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              上传归档
            </Button>
          </Link>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl">
        {stats.map(stat => (
          <Link key={stat.label} href={stat.href}>
            <div className="border border-border rounded-lg p-6 hover:bg-accent/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <stat.icon className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-3xl font-bold">{stat.count}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
