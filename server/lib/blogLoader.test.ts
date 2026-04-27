import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadAllArticles, getArticleBySlug } from "./blogLoader";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_BOOKS_DIR = path.join(__dirname, "..", "..", "books");

describe("BlogLoader", () => {
  beforeAll(() => {
    // 确保 books 目录存在
    if (!fs.existsSync(TEST_BOOKS_DIR)) {
      fs.mkdirSync(TEST_BOOKS_DIR, { recursive: true });
    }
  });

  afterAll(() => {
    // 清理测试文件
    const testFile = path.join(TEST_BOOKS_DIR, "test-article.md");
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
  });

  it("should load articles from books folder", () => {
    const articles = loadAllArticles();
    expect(Array.isArray(articles)).toBe(true);
    expect(articles.length).toBeGreaterThanOrEqual(0);
  });

  it("should parse frontmatter correctly", () => {
    // 创建测试文件
    const testContent = `---
id: test-1
slug: test-article
title: Test Article
subtitle: Test Subtitle
excerpt: Test excerpt
date: 2024-04-27
category: test
tags: [test, markdown]
featured: true
---

# Test Content

This is a test article.`;

    const testFile = path.join(TEST_BOOKS_DIR, "test-article.md");
    fs.writeFileSync(testFile, testContent);

    const article = getArticleBySlug("test-article");

    expect(article).not.toBeNull();
    if (article) {
      expect(article.title).toBe("Test Article");
      expect(article.slug).toBe("test-article");
      expect(article.subtitle).toBe("Test Subtitle");
      expect(article.category).toBe("test");
      expect(article.tags).toContain("test");
      expect(article.featured).toBe(true);
    }
  });

  it("should calculate read time correctly", () => {
    const articles = loadAllArticles();
    articles.forEach(article => {
      expect(article.readTime).toBeGreaterThan(0);
      expect(typeof article.readTime).toBe("number");
    });
  });

  it("should process image paths in markdown", () => {
    const testContent = `---
id: test-2
slug: test-images
title: Test Images
date: 2024-04-27
category: test
tags: []
---

![Test Image](./images/test.png)
![Another Image](images/another.png)`;

    const testFile = path.join(TEST_BOOKS_DIR, "test-images.md");
    fs.writeFileSync(testFile, testContent);

    const article = getArticleBySlug("test-images");

    expect(article).not.toBeNull();
    if (article) {
      // 检查图片路径是否被转换
      expect(article.content).toContain("/manus-storage/blog-images/test.png");
      expect(article.content).toContain("/manus-storage/blog-images/another.png");
    }

    // 清理
    fs.unlinkSync(testFile);
  });

  it("should return null for non-existent article", () => {
    const article = getArticleBySlug("non-existent-article");
    expect(article).toBeNull();
  });

  it("should sort articles by date descending", () => {
    const articles = loadAllArticles();
    if (articles.length > 1) {
      for (let i = 0; i < articles.length - 1; i++) {
        const current = new Date(articles[i].date).getTime();
        const next = new Date(articles[i + 1].date).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    }
  });
});
