# Personal Blog 项目 TODO

## 核心功能需求

### 已完成的功能
- [x] 创建个人博客网站，内容丰富，UI 为黑白为主题的简洁风格
- [x] 日式极简主义设计（Ma 間 哲学）
- [x] 暖白底色（#FAFAF8）配合深墨文字（#1A1A1A）
- [x] Playfair Display + Noto Serif SC 衬线字体组合
- [x] 为导航栏添加深色模式切换按钮（月亮/太阳图标）
- [x] 实现全局光暗模式切换（所有页面和组件支持主题变化）
- [x] 系统主题检测（根据操作系统深色模式偏好自动设置初始主题）
- [x] 主题偏好持久化（将用户主题选择保存到 localStorage）
- [x] 集成 Markdown 渲染器（支持 GFM、数学公式、代码高亮）
- [x] 创建本地 books 文件夹用于存储 Markdown 博客文件
- [x] 后端文件加载模块（blogLoader.ts）支持从 books 文件夹读取 Markdown
- [x] 处理 Markdown 中的图片路径转换
- [x] 创建 tRPC 博客 API 路由
- [x] 创建博客图片管理 API
- [x] 编写单元测试（7 个测试全部通过）
- [x] 升级项目到全栈模式（web-db-user）

### 未完成的功能
- [x] 前端页面调用 tRPC API 动态加载本地 Markdown 文件（而不是使用硬编码数据）
- [x] 主题切换时的过渡动画（平滑淡入淡出）

### 可选改进功能
- [ ] 评论系统（Disqus 或自建）
- [ ] 搜索功能优化（全文搜索 + 中文分词）
- [ ] 社交分享按钮（微博、微信、Twitter）
- [ ] 文章导入工具（从本地 Markdown 文件批量导入）
- [ ] 目录生成（文章详情页左侧自动生成 TOC）
- [ ] 自定义配色方案
- [ ] 阅读进度保存

## 页面结构
- [x] 首页（Home）- 英雄区 + 精选文章 + 最新文章列表
- [x] 文章列表（Blog）- 按分类/标签筛选、搜索功能
- [x] 文章详情（Article）- Markdown 渲染、相关文章推荐
- [x] 归档（Archive）- 按年份时间线展示
- [x] 关于（About）- 个人介绍、兴趣爱好
- [x] 404 页面

## 技术栈
- [x] React 19 + TypeScript
- [x] Tailwind CSS 4
- [x] Express + tRPC
- [x] Drizzle ORM + MySQL
- [x] react-markdown + remark-gfm + rehype-highlight
- [x] 日式极简主义设计系统

## 部署和版本控制
- [x] 创建 GitHub 私有仓库
- [x] 创建项目说明文档（README.md）
- [x] 创建项目结构说明文档（ARCHITECTURE.md）
