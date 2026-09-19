/**
 * 服务端 SEO meta 注入（仅生产环境使用）
 *
 * SPA 默认对所有路由返回同一份 index.html，导致不支持 JS 的爬虫
 * （如百度、社交平台预览）只能读到站点级标题。这里在返回 HTML 前，
 * 按路由把页面级 title / description / og / canonical 注入进去。
 */

const SITE_NAME = "墨迹";

export interface SeoMeta {
  title: string;
  description: string;
  url: string;
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function upsertMeta(
  html: string,
  attr: "name" | "property",
  key: string,
  content: string
): string {
  const tag = `<meta ${attr}="${key}" content="${escapeHtml(content)}" />`;
  const re = new RegExp(
    `<meta\\s+${attr}="${escapeRegExp(key)}"\\s+content="[^"]*"\\s*/?>`
  );
  if (re.test(html)) return html.replace(re, tag);
  return html.replace("</head>", `    ${tag}\n  </head>`);
}

export function injectSeoMeta(html: string, meta: SeoMeta): string {
  const fullTitle = meta.title.includes(SITE_NAME)
    ? meta.title
    : `${meta.title} · ${SITE_NAME}`;

  let out = html.replace(
    /<title>[\s\S]*?<\/title>/,
    `<title>${escapeHtml(fullTitle)}</title>`
  );

  out = upsertMeta(out, "name", "description", meta.description);
  out = upsertMeta(out, "property", "og:type", meta.type || "website");
  out = upsertMeta(out, "property", "og:title", fullTitle);
  out = upsertMeta(out, "property", "og:description", meta.description);
  out = upsertMeta(out, "property", "og:url", meta.url);
  out = upsertMeta(out, "name", "twitter:title", fullTitle);
  out = upsertMeta(out, "name", "twitter:description", meta.description);

  if (meta.image) {
    out = upsertMeta(out, "property", "og:image", meta.image);
    out = upsertMeta(out, "name", "twitter:image", meta.image);
  }

  if (meta.type === "article") {
    if (meta.publishedTime) {
      out = upsertMeta(
        out,
        "property",
        "article:published_time",
        meta.publishedTime
      );
    }
    if (meta.modifiedTime) {
      out = upsertMeta(
        out,
        "property",
        "article:modified_time",
        meta.modifiedTime
      );
    }
    if (meta.section) {
      out = upsertMeta(out, "property", "article:section", meta.section);
    }
  }

  const canonical = `<link rel="canonical" href="${escapeHtml(meta.url)}" />`;
  if (/<link rel="canonical"[^>]*>/.test(out)) {
    out = out.replace(/<link rel="canonical"[^>]*>/, canonical);
  } else {
    out = out.replace("</head>", `    ${canonical}\n  </head>`);
  }

  return out;
}
