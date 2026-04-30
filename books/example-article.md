---
id: example-1
slug: example-article
title: 本地 Markdown 文件示例
subtitle: 这是一个从 books 文件夹加载的示例文章
excerpt: 这个文章演示了如何使用本地 Markdown 文件来编写博客内容
date: 2024-04-27
category: technology
tags: [markdown, 博客, 技术]
featured: true
coverImage: ./images/ai.svg
---

# 欢迎使用本地 Markdown 文件

这是一个从项目根目录的 `books` 文件夹加载的 Markdown 文件示例。您现在可以直接在本地编写 Markdown 文件，系统会自动加载并渲染它们。

## 功能特性

- ✅ **自动加载** - 系统自动从 `books` 文件夹读取所有 `.md` 文件
- ✅ **Frontmatter 支持** - 使用 YAML frontmatter 定义文章元数据
- ✅ **图片支持** - 支持本地图片，自动转换为存储 URL
- ✅ **Markdown 渲染** - 完整的 Markdown 语法支持
- ✅ **搜索功能** - 支持按标题、内容、标签搜索

## 文件结构

```
books/
├── example-article.md      # 这个文件
├── images/                 # 存放图片的文件夹
│   └── sample.png
└── another-article.md      # 其他文章
```

## 如何编写文章

### 1. 创建 Markdown 文件

在 `books` 文件夹中创建新的 `.md` 文件，例如 `my-article.md`。

### 2. 添加 Frontmatter

在文件开头添加 YAML 格式的元数据：

```yaml
---
id: my-article-1
slug: my-article
title: 我的文章标题
subtitle: 副标题（可选）
excerpt: 文章摘要
date: 2024-04-27
category: technology
tags: [标签1, 标签2]
featured: false
---
```

### 3. 编写内容

在 frontmatter 之后编写 Markdown 内容。

## 图片处理

如果您的 Markdown 中包含图片，系统会自动处理路径转换：

```markdown
![图片描述](./images/my-image.png)
```

会自动转换为存储 URL，您无需手动处理。

## 支持的 Markdown 语法

### 标题

```markdown
# H1 标题
## H2 标题
### H3 标题
```

### 列表

```markdown
- 无序列表项 1
- 无序列表项 2

1. 有序列表项 1
2. 有序列表项 2
```

### 代码块

```javascript
function hello() {
  console.log("Hello, World!");
}
```

### 引用

> 这是一个引用块
> 可以包含多行内容

### 表格

| 列 1 | 列 2 | 列 3 |
|------|------|------|
| 数据 1 | 数据 2 | 数据 3 |
| 数据 4 | 数据 5 | 数据 6 |

## 后续步骤

1. **创建您的文章** - 在 `books` 文件夹中创建新的 `.md` 文件
2. **添加图片** - 将图片放在 `books/images` 文件夹中
3. **刷新页面** - 系统会自动加载新文章
4. **浏览文章** - 在博客页面查看您的文章

祝您写作愉快！
