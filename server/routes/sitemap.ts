/**
 * Sitemap 路由
 * 动态生成 sitemap.xml
 */

import { Router } from "express";
import * as db from "../db";

export const sitemapRouter = Router();

sitemapRouter.get("/sitemap.xml", async (_req, res) => {
  try {
    const articles = await db.getAllArticles({ status: "published" });
    const archives = await db.getAllArchives();

    const host = _req.get("host") || "localhost:3000";
    const protocol = _req.protocol || "https";
    const baseUrl = `${protocol}://${host}`;

    const latestContentDate = [...articles, ...archives]
      .map(item => new Date(item.updatedAt).toISOString().split("T")[0])
      .sort()
      .pop();

    const staticPages = [
      {
        url: "/",
        changefreq: "daily",
        priority: "1.0",
        lastmod: latestContentDate,
      },
      {
        url: "/blog",
        changefreq: "daily",
        priority: "0.9",
        lastmod: latestContentDate,
      },
      {
        url: "/archive",
        changefreq: "weekly",
        priority: "0.7",
        lastmod: latestContentDate,
      },
      {
        url: "/about",
        changefreq: "monthly",
        priority: "0.5",
        lastmod: undefined as string | undefined,
      },
    ];

    const articleUrls = articles.map(a => ({
      url: `/article/${a.slug}`,
      changefreq: "monthly",
      priority: "0.8",
      lastmod: new Date(a.updatedAt).toISOString().split("T")[0],
    }));

    const archiveUrls = archives.map(a => ({
      url: `/archive/${a.slug}`,
      changefreq: "monthly",
      priority: "0.6",
      lastmod: new Date(a.updatedAt).toISOString().split("T")[0],
    }));

    const allUrls = [...staticPages, ...articleUrls, ...archiveUrls];

    const urls = allUrls
      .map(
        entry => `  <url>
    <loc>${baseUrl}${entry.url}</loc>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>${entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : ""}
  </url>`
      )
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.send(xml);
  } catch (error) {
    console.error("[Sitemap] Error generating sitemap:", error);
    res.status(500).send("Error generating sitemap");
  }
});

sitemapRouter.get("/robots.txt", (req, res) => {
  const host = req.get("host") || "localhost:3000";
  const protocol = req.protocol || "https";
  const baseUrl = `${protocol}://${host}`;

  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /api/",
    "",
    `Sitemap: ${baseUrl}/sitemap.xml`,
    "",
  ].join("\n");

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.send(body);
});
