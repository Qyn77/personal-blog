import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  FileText,
  Archive,
  Mail,
  Settings,
  User,
  ArrowLeft,
  LogOut,
  Sparkles,
  BarChart3,
  Menu,
  KeyRound,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { verify, logout } from "@/lib/auth";
import LoginPage from "./LoginPage";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/admin/articles", icon: FileText, label: "文章管理" },
  { href: "/admin/archives", icon: Archive, label: "归档管理" },
  { href: "/admin/subscribers", icon: Mail, label: "订阅管理" },
  { href: "/admin/visitors", icon: BarChart3, label: "访客记录" },
  { href: "/admin/mcp", icon: KeyRound, label: "Agent 连接" },
  { href: "/admin/ai", icon: Sparkles, label: "网站 AI 助手" },
  { href: "/admin/settings", icon: Settings, label: "系统设置" },
  { href: "/admin/about", icon: User, label: "关于页面" },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [location]);

  useEffect(() => {
    verify().then(setIsAuthed);
  }, []);

  const handleLogout = () => {
    logout();
    queryClient.clear();
    setIsAuthed(false);
  };

  // 加载中
  if (isAuthed === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-sm">验证中...</p>
      </div>
    );
  }

  // 未登录
  if (!isAuthed) {
    return <LoginPage onLoginSuccess={() => setIsAuthed(true)} />;
  }

  // 已登录
  return (
    <div className="h-dvh bg-background text-foreground flex flex-col lg:flex-row overflow-hidden">
      {/* 侧边栏 */}
      <aside className="w-full lg:w-56 max-h-[75dvh] lg:max-h-none border-b lg:border-b-0 lg:border-r border-border p-4 lg:p-6 flex flex-col shrink-0 overflow-y-auto">
        <div className="flex items-center justify-between gap-3">
          <Link href="/">
            <span
              className="text-foreground font-bold text-lg cursor-pointer"
              style={{
                fontFamily: "'Playfair Display', 'Noto Serif SC', serif",
              }}
            >
              墨迹 / Admin
            </span>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            aria-expanded={menuOpen}
            aria-controls="admin-navigation"
            onClick={() => setMenuOpen(open => !open)}
          >
            {menuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
            管理菜单
          </Button>
        </div>

        <div
          id="admin-navigation"
          className={cn("lg:flex lg:flex-1 lg:flex-col", !menuOpen && "hidden")}
        >
          <nav aria-label="后台管理" className="mt-4 lg:mt-8 space-y-1">
            {navItems.map(item => {
              const isActive = item.exact
                ? location === item.href
                : location.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                >
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer",
                      isActive
                        ? "bg-accent text-accent-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-4 border-t border-border space-y-2">
            <Link href="/">
              <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <ArrowLeft className="h-4 w-4" />
                返回博客
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors cursor-pointer w-full"
            >
              <LogOut className="h-4 w-4" />
              退出登录
            </button>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 min-h-0 min-w-0 p-4 lg:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
