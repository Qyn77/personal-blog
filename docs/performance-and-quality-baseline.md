# 性能与代码规范基线（持续治理）

## 1. 核心指标与验收标准

### Core Web Vitals / 首屏体验

- LCP（首页）：目标 ≤ 2.5s，预警阈值 > 3.0s
- INP（首页）：目标 ≤ 200ms，预警阈值 > 300ms
- CLS（首页）：目标 ≤ 0.1，预警阈值 > 0.15
- FCP（首页）：目标 ≤ 1.8s
- TTFB（首页）：目标 ≤ 800ms

### 构建产物体积（CI 强制）

- JS 总体积：默认预算 1300KB（可通过 `BUNDLE_BUDGET_JS_KB` 覆盖）
- CSS 总体积：默认预算 220KB（可通过 `BUNDLE_BUDGET_CSS_KB` 覆盖）
- assets 总体积：默认预算 1500KB（可通过 `BUNDLE_BUDGET_TOTAL_ASSETS_KB` 覆盖）

## 2. 测量范围

- 首页：`/`
- 文章页：`/article/:slug`
- 后台页：`/admin`

## 3. 当前落地的优化策略

- 前台与后台路由均采用懒加载，减少首屏 JS。
- 首页改为摘要接口，避免拉取正文内容。
- 统计脚本改为空闲时注入，避免阻塞关键渲染路径。
- 字体样式改为非阻塞加载。
- 公共列表接口增加短缓存与 `Cache-Control`。
- 生产静态资源区分缓存策略（assets 长缓存、index no-cache）。
- CI 增加构建体积预算门禁（`pnpm perf:bundle`）。

## 4. 阶段性执行清单

### 阶段 A（快速收益）

- [x] 首页数据瘦身
- [x] 前台路由懒加载
- [x] 非关键脚本延后加载
- [x] 首屏图片优先级优化
- [x] 字体非阻塞加载

### 阶段 B（中期收益）

- [x] API 列表短缓存与缓存头
- [x] 静态资源缓存策略
- [ ] 增加 gzip / br 压缩传输
- [ ] 进一步收敛渲染热点与滚动开销

### 阶段 C（长期治理）

- [x] 提交前类型检查门禁
- [x] CI 构建与体积门禁
- [ ] ESLint 规则集（复杂度 / 潜在 bug / import 顺序）
- [ ] 关键页面与核心接口回归测试

## 5. 执行方式

- 本地：`pnpm build && pnpm perf:bundle`
- CI：`Format Check -> Type Check -> Build -> Bundle Budget Check`
- 每次优化 PR 附带三类对比：
  1. Core Web Vitals 对比
  2. 构建体积对比
  3. 接口耗时与数据体积对比
