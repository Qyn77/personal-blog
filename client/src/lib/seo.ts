/**
 * SEO 工具函数
 * 动态更新页面 title 和 meta 标签
 */

const SITE_NAME = "墨迹";

export function setPageMeta(options: {
  title?: string;
  description?: string;
  ogImage?: string;
  ogType?: string;
}) {
  const { title, description, ogImage, ogType = "website" } = options;

  // Title
  document.title = title ? `${title} · ${SITE_NAME}` : SITE_NAME;

  // Description
  if (description) {
    setMeta("description", description);
    setMeta("og:description", description);
    setMeta("twitter:description", description);
  }

  // OG Title
  if (title) {
    setMeta("og:title", title);
    setMeta("twitter:title", title);
  }

  // OG Image
  if (ogImage) {
    setMeta("og:image", ogImage);
    setMeta("twitter:image", ogImage);
  }

  // OG Type
  setMeta("og:type", ogType);
}

function setMeta(name: string, content: string) {
  const isProperty = name.startsWith("og:") || name.startsWith("twitter:");
  const attr = isProperty ? "property" : "name";

  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}
