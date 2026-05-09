/**
 * RSS Feed 路由
 * 生成 RSS 2.0 格式的 feed
 */

import { Router } from "express";
import * as db from "../db";

const SITE_NAME = "墨迹";
const SITE_DESCRIPTION = "以文字对抗遗忘，以思考丈量世界。";

export const rssRouter = Router();

rssRouter.get("/rss.xml", async (_req, res) => {
  try {
    const articles = await db.getAllArticles({ status: "published" });
    const latest = articles.slice(0, 20);

    const host = _req.get("host") || "localhost:3000";
    const protocol = _req.protocol || "https";
    const baseUrl = `${protocol}://${host}`;

    const items = latest
      .map(article => {
        const link = `${baseUrl}/blog/${article.slug}`;
        const pubDate = new Date(article.date).toUTCString();
        return `    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description><![CDATA[${article.excerpt}]]></description>
      <pubDate>${pubDate}</pubDate>
      <category>${article.category}</category>
    </item>`;
      })
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_NAME}</title>
    <link>${baseUrl}</link>
    <description>${SITE_DESCRIPTION}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

    res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
    res.send(xml);
  } catch (error) {
    console.error("[RSS] Error generating feed:", error);
    res.status(500).send("Error generating RSS feed");
  }
});
