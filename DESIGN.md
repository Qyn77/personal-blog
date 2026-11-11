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
- 后台布局：1024px 以下收起侧栏为菜单，编辑与预览在 1280px 以下纵向排列，保留完整输入宽度。
- 编辑操作栏：顶部 sticky，显示保存/发布状态；保存草稿与发布分开，失败不显示成功。
- 配置编辑：关于页面保存携带读取版本；冲突或写入失败显示错误，不覆盖其他客户端修改。AI 密钥只可重新输入，不回显，空值表示保留；开关保存后刷新状态。
- AI 接入客户端：原生下拉选择 Codex、Claude Code、OpenCode 2.x / 1.x，显示对应个人配置路径；新令牌展示只读配置文本供复制失败时手动复制。新增归档、关于页面、AI 权限默认关闭，说明公开生效与密钥写入边界。
- AI 接入：创建令牌表单、权限选择、一次性令牌展示与复制、撤销按钮、成功操作记录。读取权限固定，发布权限默认关闭；复制失败显示错误。沿用 Button/Input/Label，窄屏单列，长地址可换行。
- 私有预览：单列阅读，显著标注未发布/已发布与链接有效期；失效状态有明确提示，禁止追踪与索引。
- 系列导航：文章底部系列入口、目录和前后篇；空系列不显示。

## 6. 动效

保留既有淡入和轻微图片反馈；新增动效仅 opacity/transform。尊重 prefers-reduced-motion；焦点反馈不依赖动画。

## 7. 层级与表面

阅读区域使用纸面与细分隔线，标题不依赖悬浮毛玻璃。后台保留现有控件与边框，操作栏通过背景和底边分隔。正文引用使用主题语义色。

## 8. 可访问性与验证边界

新交互须有可读名称、键盘焦点和错误反馈；375/768/1280 宽度验证换行与溢出，覆盖深色模式。复用现有 UI 组件作为状态样例。浏览器自动化验证代表桌面 Chrome 模拟视口，不代表真实手机或辅助阅读器验收；不声称未测量的 Lighthouse 分数。

## 9. 网站助手与 Agent 连接（2026-11-11）

- 导航按任务命名：Agent 连接（本地客户端通过 MCP 管理网站）、网站 AI 助手（后台润色与元数据生成）。页首用一句话说明用途，并提供前往另一页的文字链接。
- 模型页采用主表单 + supporting-pane：宽屏 xl 主区自适应、辅助区 16rem；窄屏依次堆叠，AdminLayout 的 main 是唯一纵向滚动区。参考 [StyleGallery supporting-pane](https://github.com/changeroa/StyleGallery/blob/main/patterns/split-sidebar/supporting-pane.md)。
- 主区用一块带边框的编辑表面收纳服务商、地址、模型和密钥；服务商用原生 radio 组成两列选择区，文字说明 API 类型，选中使用 foreground 边框与 muted 背景，不使用彩色字母头像和渐变。
- 辅助区展示服务器当前状态、启用开关及可用功能。区分已保存状态与待保存修改，不能把已保存等同连接成功。底部保存栏保持可见，显示未保存/保存中/已保存；失败保留输入并显示可读错误。
- 表单为键盘和手机用户提供显式 label、原生单选组、至少 44px 的选择区域；加载时不呈现可编辑的假默认值，失败提供重试。密钥清除放在原生 details 中，必须明确勾选。
- 继续使用既有字体、语义色、4px 间距、Button/Input/Switch；主标题 text-3xl，分区标题 text-base，辅助文字 text-sm。新的布局不增加动效或依赖。
- 参考可用性：本机 frontend 包缺少 redesign-skill、visual-qa、review-work 文件，已检索；使用现有设计约定、布局参考和实际浏览器截图进行审阅，不声称运行不存在的技能。
