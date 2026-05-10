---
id: tech-stack-2023
slug: 2023-tech-stack
title: 我的技术栈 2023
subtitle: 常用的开发工具和技术
excerpt: 整理了 2023 年常用的技术栈和工具
date: 2023-06-20
category: technology
tags: [技术栈, 工具, 开发]
---

# 我的技术栈 2023

记录一下目前使用的技术栈和开发工具。

## 编程语言

### 主力语言

- **TypeScript** - 前端和 Node.js 后端
- **Python** - 数据处理和脚本
- **Go** - 微服务和高性能应用

### 学习中

- **Rust** - 系统编程
- **Kotlin** - Android 开发

## 前端技术

### 框架和库

```json
{
  "framework": "React",
  "version": "18.x",
  "stateManagement": "Zustand",
  "styling": "Tailwind CSS",
  "routing": "React Router",
  "forms": "React Hook Form",
  "dataFetching": "TanStack Query"
}
```

### 构建工具

- **Vite** - 快速的开发服务器
- **esbuild** - 超快的打包工具
- **pnpm** - 高效的包管理器

### UI 组件库

1. **shadcn/ui** - 可定制的组件
2. **Radix UI** - 无样式的基础组件
3. **Lucide Icons** - 图标库

## 后端技术

### Node.js 生态

```typescript
// 常用的后端框架
const stack = {
  framework: "Express",
  orm: "Drizzle ORM",
  validation: "Zod",
  api: "tRPC",
  auth: "JWT",
};
```

### 数据库

- **PostgreSQL** - 主数据库
- **Redis** - 缓存和会话
- **MongoDB** - 文档存储
- **SQLite** - 轻量级应用

## DevOps

### 容器化

```dockerfile
# 典型的 Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

### CI/CD

- **GitHub Actions** - 自动化工作流
- **Docker** - 容器化部署
- **Nginx** - 反向代理

## 开发工具

### 编辑器

- **VS Code** - 主力编辑器
  - 插件：ESLint, Prettier, GitLens
  - 主题：One Dark Pro
  - 字体：JetBrains Mono

### 终端

```bash
# 我的 shell 配置
export EDITOR=vim
export LANG=en_US.UTF-8

# 常用别名
alias ll='ls -la'
alias gs='git status'
alias gp='git push'
alias gc='git commit'
```

### 其他工具

| 工具      | 用途       |
| --------- | ---------- |
| Postman   | API 测试   |
| TablePlus | 数据库管理 |
| Figma     | UI 设计    |
| Notion    | 笔记和文档 |

## 学习资源

### 在线课程

- [Frontend Masters](https://frontendmasters.com)
- [Egghead.io](https://egghead.io)
- [Udemy](https://udemy.com)

### 技术博客

1. **Dan Abramov** - React 核心开发者
2. **Kent C. Dodds** - 测试和教学
3. **Josh W. Comeau** - CSS 和动画

### 书籍推荐

- 《JavaScript 高级程序设计》
- 《你不知道的 JavaScript》
- 《深入浅出 Node.js》

## 工作流程

### 开发流程

1. 需求分析
2. 技术选型
3. 原型设计
4. 编码实现
5. 测试验证
6. 代码审查
7. 部署上线

### 代码规范

```javascript
// ESLint 配置
module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "prettier",
  ],
  rules: {
    "no-console": "warn",
    "prefer-const": "error",
  },
};
```

## 未来计划

### 想学习的技术

- [ ] WebAssembly
- [ ] GraphQL
- [ ] Serverless
- [ ] Machine Learning

### 想尝试的工具

- [ ] Bun - 新的 JavaScript 运行时
- [ ] Astro - 静态站点生成器
- [ ] Tauri - 桌面应用框架

## 总结

技术栈不是一成不变的，要根据项目需求和个人兴趣不断调整。重要的是：

1. **选择合适的工具** - 不要盲目追新
2. **深入理解原理** - 知其然知其所以然
3. **持续学习** - 技术更新很快
4. **实践出真知** - 多写代码多做项目

---

**最后更新**: 2023-06-20
