/**
 * SEO 工具函数
 * 动态更新页面 title、meta、canonical 与 JSON-LD 结构化数据
 */

export const SITE_NAME = "墨迹";
export const SITE_DESCRIPTION =
  "以文字对抗遗忘，以思考丈量世界。关于阅读、写作、生活与哲学的碎片。";
const DEFAULT_OG_IMAGE = "/images/hero-bg.webp";

export interface PageMetaOptions {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

function absoluteUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return window.location.origin + (url.startsWith("/") ? url : `/${url}`);
}

export function setPageMeta(options: PageMetaOptions = {}) {
  const {
    title,
    description = SITE_DESCRIPTION,
    keywords,
    ogImage,
    ogType = "website",
    publishedTime,
    modifiedTime,
    section,
    noindex = false,
    jsonLd,
  } = options;

  const fullTitle = title
    ? `${title} · ${SITE_NAME}`
    : `${SITE_NAME} · 个人博客`;
  document.title = fullTitle;

  // Canonical URL + og:url
  const canonical = window.location.origin + window.location.pathname;
  setLink("canonical", canonical);

  // 基础信息
  setMeta("description", description);
  if (keywords) setMeta("keywords", keywords);
  setMeta(
    "robots",
    noindex ? "noindex,nofollow" : "index,follow,max-image-preview:large"
  );

  // Open Graph
  setMeta("og:site_name", SITE_NAME, true);
  setMeta("og:locale", "zh_CN", true);
  setMeta("og:type", ogType, true);
  setMeta("og:title", fullTitle, true);
  setMeta("og:description", description, true);
  setMeta("og:url", canonical, true);

  const ogImageUrl = absoluteUrl(ogImage) || absoluteUrl(DEFAULT_OG_IMAGE);
  if (ogImageUrl) {
    setMeta("og:image", ogImageUrl, true);
    setMeta("og:image:alt", fullTitle, true);
  }

  if (ogType === "article") {
    if (publishedTime) setMeta("article:published_time", publishedTime, true);
    if (modifiedTime) setMeta("article:modified_time", modifiedTime, true);
    if (section) setMeta("article:section", section, true);
  }

  // Twitter Card
  setMeta("twitter:card", "summary_large_image");
  setMeta("twitter:title", fullTitle);
  setMeta("twitter:description", description);
  if (ogImageUrl) setMeta("twitter:image", ogImageUrl);

  setJsonLd(jsonLd);
}

export function buildArticleJsonLd(input: {
  title: string;
  description?: string;
  url: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  section?: string;
  tags?: string[];
  author?: string;
}): Record<string, unknown> {
  const image = absoluteUrl(input.image) || absoluteUrl(DEFAULT_OG_IMAGE);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.title,
    description: input.description,
    image: image ? [image] : undefined,
    datePublished: input.datePublished,
    dateModified: input.dateModified || input.datePublished,
    articleSection: input.section,
    keywords: input.tags?.join(","),
    author: {
      "@type": "Person",
      name: input.author || SITE_NAME,
      url: window.location.origin,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": input.url,
    },
  };
}

export function buildBreadcrumbJsonLd(
  items: { name: string; url: string }[]
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

function setMeta(name: string, content: string, isProperty = false) {
  const property =
    isProperty ||
    name.startsWith("og:") ||
    name.startsWith("twitter:") ||
    name.startsWith("article:");
  const attr = property ? "property" : "name";

  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(
    `link[rel="${rel}"]`
  ) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

const JSONLD_ID = "seo-jsonld";

function setJsonLd(data?: Record<string, unknown> | Record<string, unknown>[]) {
  const existing = document.getElementById(JSONLD_ID);
  if (!data) {
    existing?.remove();
    return;
  }

  let script = existing as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement("script");
    script.id = JSONLD_ID;
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}
