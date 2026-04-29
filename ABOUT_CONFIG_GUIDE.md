# 关于页面配置指南

## 概述

关于页面现在使用 JSON 配置文件进行内容管理，只需修改配置文件即可更新页面内容。

## 配置文件位置

```
client/public/about-config.json
```

## 配置文件结构

```json
{
  "hero": {
    "image": "图片 URL",
    "title": "页面标题",
    "paragraphs": [
      "第一段文字",
      "第二段文字",
      "第三段文字"
    ],
    "quote": "引用文字"
  },
  "interests": [
    {
      "label": "兴趣标题",
      "description": "兴趣描述"
    }
  ],
  "favorites": [
    {
      "category": "分类名称",
      "items": [
        "项目1",
        "项目2"
      ]
    }
  ]
}
```

## 配置说明

### 1. Hero 区域 (hero)

顶部的主要介绍区域。

**字段说明**:
- `image`: 个人照片或插图的 URL
- `title`: 页面标题（如"关于我"）
- `paragraphs`: 介绍文字段落数组，可以有多个段落
- `quote`: 引用文字，显示在介绍下方

**示例**:
```json
{
  "hero": {
    "image": "https://example.com/photo.jpg",
    "title": "关于我",
    "paragraphs": [
      "你好，我是博客作者...",
      "这个博客叫做「墨迹」...",
      "我写作的主题包括..."
    ],
    "quote": "写作是一种与沉默的对话。"
  }
}
```

### 2. 关注的事 (interests)

展示你关注或擅长的领域。

**字段说明**:
- `label`: 兴趣/技能的名称
- `description`: 详细描述

**示例**:
```json
{
  "interests": [
    {
      "label": "阅读",
      "description": "每年约 40-50 本书，偏爱哲学、文学与自然写作"
    },
    {
      "label": "写作",
      "description": "坚持写日记 10 年，博客写作 2 年"
    }
  ]
}
```

**建议**: 保持 2-4 个兴趣项，页面会自动适配布局。

### 3. 喜欢的事物 (favorites)

展示你喜欢的书籍、概念、习惯等。

**字段说明**:
- `category`: 分类名称（如"书"、"概念"、"习惯"）
- `items`: 该分类下的具体项目列表

**示例**:
```json
{
  "favorites": [
    {
      "category": "书",
      "items": [
        "《瓦尔登湖》梭罗",
        "《局外人》加缪",
        "《禅与摩托车维修艺术》波西格"
      ]
    },
    {
      "category": "概念",
      "items": [
        "物の哀れ（物哀）",
        "侘寂（Wabi-sabi）",
        "間（Ma）"
      ]
    }
  ]
}
```

**建议**: 保持 3 个分类，每个分类 3-5 个项目。

## 修改步骤

### 1. 编辑配置文件

打开 `client/public/about-config.json` 文件，修改相应内容。

### 2. 保存文件

保存后，刷新浏览器页面即可看到更新。

**注意**: 
- 确保 JSON 格式正确（可以使用 JSON 验证工具）
- 字符串中的引号需要转义（如果包含引号）
- 数组最后一项后面不要加逗号

### 3. 验证 JSON 格式

可以使用在线工具验证 JSON 格式：
- [JSONLint](https://jsonlint.com/)
- [JSON Formatter](https://jsonformatter.org/)

## 动态内容

### 最近写了

"最近写了"模块会自动从数据库加载最新的 3 篇文章，无需手动配置。

每次添加新文章并运行 `npm run db:init` 后，该模块会自动更新。

## 常见问题

### Q: 修改配置后页面没有更新？

A: 尝试以下步骤：
1. 清除浏览器缓存
2. 硬刷新页面（Ctrl+Shift+R 或 Cmd+Shift+R）
3. 检查浏览器控制台是否有错误

### Q: 如何更换个人照片？

A: 修改 `hero.image` 字段的 URL，可以使用：
- 外部图片链接
- 本地图片（放在 `client/public` 文件夹，然后使用 `/image.jpg` 格式）

### Q: 可以添加更多段落吗？

A: 可以，在 `hero.paragraphs` 数组中添加更多字符串即可。

### Q: 可以添加更多兴趣项吗？

A: 可以，但建议保持 2-4 个，以保持页面美观。

### Q: 如何添加 Markdown 格式？

A: 当前配置文件不支持 Markdown，只支持纯文本。如果需要富文本，可以使用 HTML 标签（需要修改代码）。

## 示例配置

### 极简风格

```json
{
  "hero": {
    "image": "https://example.com/photo.jpg",
    "title": "关于",
    "paragraphs": [
      "一个写字的人。"
    ],
    "quote": "少即是多。"
  },
  "interests": [
    {
      "label": "写作",
      "description": "记录生活"
    },
    {
      "label": "阅读",
      "description": "探索世界"
    }
  ],
  "favorites": [
    {
      "category": "书",
      "items": ["《瓦尔登湖》", "《局外人》"]
    }
  ]
}
```

### 详细风格

```json
{
  "hero": {
    "image": "https://example.com/photo.jpg",
    "title": "关于我",
    "paragraphs": [
      "你好，我是一名全栈开发者，同时也是一个热爱写作的人。",
      "我相信技术和人文可以完美结合，代码也可以是一种艺术。",
      "这个博客记录了我的技术探索、读书笔记和生活感悟。",
      "欢迎你的到来，希望这里的文字能给你带来一些启发。"
    ],
    "quote": "代码是诗，算法是韵。"
  },
  "interests": [
    {
      "label": "编程",
      "description": "全栈开发，热爱 TypeScript 和 React"
    },
    {
      "label": "写作",
      "description": "技术博客和生活随笔"
    },
    {
      "label": "阅读",
      "description": "技术书籍、哲学和文学"
    },
    {
      "label": "摄影",
      "description": "用镜头记录生活"
    }
  ],
  "favorites": [
    {
      "category": "技术",
      "items": [
        "TypeScript",
        "React",
        "Node.js",
        "PostgreSQL"
      ]
    },
    {
      "category": "书籍",
      "items": [
        "《代码大全》",
        "《重构》",
        "《设计模式》",
        "《黑客与画家》"
      ]
    },
    {
      "category": "工具",
      "items": [
        "VS Code",
        "Git",
        "Docker",
        "Notion"
      ]
    }
  ]
}
```

## 总结

- ✅ 配置文件位于 `client/public/about-config.json`
- ✅ 修改配置文件后刷新页面即可看到更新
- ✅ "最近写了"模块自动从数据库加载
- ✅ 支持自定义图片、文字、兴趣和喜好
- ✅ JSON 格式简单易懂，易于维护

---

**最后更新**: 2024-04-29
