import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

/**
 * 访客追踪 Hook
 * 在路由变化时自动发送页面访问记录到后端
 */
export function useVisitorTracker() {
  const [location] = useLocation();
  const lastTracked = useRef<string>("");

  useEffect(() => {
    // 避免重复追踪同一路径
    if (location === lastTracked.current) return;
    lastTracked.current = location;

    // 不追踪 admin 页面
    if (location.startsWith("/admin")) return;

    fetch("/api/visitor/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: location,
        referer: document.referrer || undefined,
      }),
      // 使用 keepalive 确保页面关闭前请求能完成
      keepalive: true,
    }).catch(() => {
      // 静默失败，不影响用户体验
    });
  }, [location]);
}
