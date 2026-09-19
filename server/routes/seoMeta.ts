/**
 * SEO meta 注入路由（生产环境，挂载在静态文件之前）
 */

import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import fs from "fs";
import path from "path";
import * as db from "../db";
import { injectSeoMeta, type SeoMeta } from "../lib/seoMeta";

const SITE_DESCRIPTION =
  "以文字对抗遗忘，以思考丈量世界。关于阅读、写作、生活与哲学的碎片。";
const DEFAULT_IMAGE = "/images/hero-bg.webp";

export function createSeoMetaRouter(rootDir: string): Router {
  const router = Router();
  const indexPath = path.resolve(rootDir, "public", "index.html");

  let cache: { html: string; mtimeMs: number } | null = null;
  function readIndexHtml(): string {
    const stat = fs.statSync(indexPath);
    if (!cache || cache.mtimeMs !== stat.mtimeMs) {
      cache = {
        html: fs.readFileSync(indexPath, "utf-8"),
        mtimeMs: stat.mtimeMs,
      };
    }
    return cache.html;
  }

  function baseUrl(req: Request): string {
    const host = req.get("host") || "localhost:3000";
    return `${req.protocol || "https"}://${host}`;
  }

  function toAbsolute(req: Request, image?: string | null): string {
    if (image && /^https?:\/\//i.test(image)) return image;
    const imagePath = image
      ? image.startsWith("/")
        ? image
        : `/${image}`
      : DEFAULT_IMAGE;
    return `${baseUrl(req)}${imagePath}`;
  }

  function render(req: Request, res: Response, meta: SeoMeta) {
    try {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      res.send(injectSeoMeta(readIndexHtml(), meta));
    } catch (error) {
      console.error("[SEO] Failed to inject meta:", error);
      res.sendFile(indexPath);
    }
  }

  router.get("/article/:slug", async (req, res, next: NextFunction) => {
    try {
      const article = await db.getArticleBySlug(req.params.slug);
      if (!article || article.status !== "published") return next();

      const publishedTime = new Date(article.date).toISOString();
      render(req, res, {
        title: article.title,
        description: article.excerpt || SITE_DESCRIPTION,
        url: `${baseUrl(req)}/article/${article.slug}`,
        image: toAbsolute(req, article.coverImage),
        type: "article",
        publishedTime,
        modifiedTime: article.updatedAt
          ? new Date(article.updatedAt).toISOString()
          : publishedTime,
        section: article.category,
      });
    } catch (error) {
      console.error("[SEO] article meta error:", error);
      next();
    }
  });

  router.get("/archive/:slug", async (req, res, next: NextFunction) => {
    try {
      const archive = await db.getArchiveBySlug(req.params.slug);
      if (!archive) return next();

      const publishedTime = new Date(archive.date).toISOString();
      render(req, res, {
        title: archive.title,
        description: archive.excerpt || SITE_DESCRIPTION,
        url: `${baseUrl(req)}/archive/${archive.slug}`,
        image: toAbsolute(req),
        type: "article",
        publishedTime,
        modifiedTime: archive.updatedAt
          ? new Date(archive.updatedAt).toISOString()
          : publishedTime,
        section: archive.category,
      });
    } catch (error) {
      console.error("[SEO] archive meta error:", error);
      next();
    }
  });

  const staticPages: {
    route: string;
    title: string;
    description: string;
  }[] = [
    { route: "/", title: "墨迹 · 个人博客", description: SITE_DESCRIPTION },
    {
      route: "/blog",
      title: "文章",
      description: "关于阅读、写作、生活与思考的碎片。",
    },
    {
      route: "/archive",
      title: "归档",
      description: "按年份分组的时间线归档。",
    },
    {
      route: "/about",
      title: "关于",
      description: "关于博主的故事、兴趣和喜欢的事物。",
    },
  ];

  staticPages.forEach(page => {
    router.get(page.route, (req, res) => {
      render(req, res, {
        title: page.title,
        description: page.description,
        url: `${baseUrl(req)}${page.route === "/" ? "" : page.route}`,
        image: toAbsolute(req),
        type: "website",
      });
    });
  });

  return router;
}
