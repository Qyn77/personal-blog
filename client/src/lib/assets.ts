/**
 * 静态资源 CDN 辅助函数
 *
 * 仅用于图片、字体、媒体等静态资源的地址拼接；
 * 切勿用于接口地址（/api/** 必须保持同源直连）。
 */

/** CDN 基础地址（结尾无斜杠），未配置时为空字符串 */
export const CDN_URL = (import.meta.env.VITE_CDN_URL || "").replace(/\/+$/, "");

/**
 * 将站内静态资源路径转换为 CDN 绝对地址。
 *
 * - 已带协议（http/https）、协议相对（//）、data:/blob: 的地址原样返回；
 * - 未配置 VITE_CDN_URL 时返回原路径（本地开发保持同源）；
 * - 其余相对/根路径统一拼成 `${VITE_CDN_URL}/path`。
 */
export function assetUrl(path?: string | null): string {
  if (!path) return "";
  if (
    /^(https?:)?\/\//i.test(path) ||
    path.startsWith("data:") ||
    path.startsWith("blob:")
  ) {
    return path;
  }
  if (!CDN_URL) return path;
  return `${CDN_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}
