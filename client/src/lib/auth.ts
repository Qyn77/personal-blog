/**
 * 前端认证工具
 * 管理 JWT token 的存储和读取
 */

const TOKEN_KEY = "admin_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export async function login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();

  if (data.success && data.token) {
    setToken(data.token);
    return { success: true };
  }

  return { success: false, error: data.error || "登录失败" };
}

export async function verify(): Promise<boolean> {
  const token = getToken();
  if (!token) return false;

  try {
    const res = await fetch("/api/auth/verify", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!data.valid) {
      removeToken();
      return false;
    }
    return true;
  } catch {
    removeToken();
    return false;
  }
}

export function logout(): void {
  removeToken();
}
