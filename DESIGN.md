# 墨迹界面约定

## 1. 氛围与身份

延续现有暖白纸面、深墨文字、衬线标题与留白。阅读者要尽快找到文章、读完长文；作者要随时知道内容是否保存和发布。

## 2. 色彩

使用 index.css 已有语义变量：background/foreground、muted/muted-foreground、border、primary、destructive。浅色背景 oklch(0.985 0.003 80)，深色背景 oklch(0.12 0.004 60)。新增界面不写独立颜色值；错误用 destructive，正常状态用 muted-foreground。

## 3. 字体

沿用 Noto Serif SC 中文正文、Playfair Display 标题、IBM Plex Mono 元信息。正文 1rem–1.0625rem、行高 1.75–1.85；小字 text-sm，标题 text-2xl–text-5xl。标题允许换行，正文保持舒适行宽。

## 4. 间距与布局

使用 Tailwind 4px 基础间距；页面横向 px-6/lg:px-8；阅读宽度 max-w-4xl，带目录的外层可扩展到 max-w-6xl。断点 md=768px、lg=1024px。页面由浏览器滚动，代码和表格可独立横向滚动。首页开场使用内容高度与 pt-28/md:pt-32，统计在手机分两列，精选区紧随其后。

## 5. 组件与状态

- Button/Input：复用 components/ui，保留 focus-visible、disabled 和 pending 状态。
- ContentStatus：居中状态区，加载使用 role=status，失败使用 role=alert，404 给返回入口；网络错误提供重试。
- ArticleCard：现有 default/featured/compact 变体，统一语义颜色与封面比例。
- 阅读目录：桌面 12rem sticky 侧栏、移动端 details 折叠，链接显示当前章节，长标题折行。
- 编辑操作栏：顶部 sticky，显示保存/发布状态；保存草稿与发布分开，失败不显示成功。
- 系列导航：文章底部系列入口、目录和前后篇；空系列不显示。

## 6. 动效

保留既有淡入和轻微图片反馈；新增动效仅 opacity/transform。尊重 prefers-reduced-motion；焦点反馈不依赖动画。

## 7. 层级与表面

阅读区域使用纸面与细分隔线，标题不依赖悬浮毛玻璃。后台保留现有控件与边框，操作栏通过背景和底边分隔。正文引用使用主题语义色。

## 8. 可访问性与验证边界

新交互须有可读名称、键盘焦点和错误反馈；375/768/1280 宽度验证换行与溢出，覆盖深色模式。复用现有 UI 组件作为状态样例。浏览器自动化验证代表桌面 Chrome 模拟视口，不代表真实手机或辅助阅读器验收；不声称未测量的 Lighthouse 分数。
