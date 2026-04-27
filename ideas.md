# 个人博客设计方案

## 方案一：瑞士国际主义排版风格
<response>
<text>
**Design Movement**: 瑞士国际主义排版（Swiss International Typographic Style）

**Core Principles**:
- 严格的网格系统，所有元素对齐于隐形网格
- 文字即设计，排版本身构成视觉层次
- 极度克制的装饰，功能决定形式
- 大量留白创造呼吸感

**Color Philosophy**:
- 纯白 #FFFFFF 背景，纯黑 #000000 文字
- 唯一点缀：细红线 #E63946 用于分隔符与强调
- 灰阶梯度：#F5F5F5 / #E0E0E0 / #9E9E9E 用于层次

**Layout Paradigm**:
- 非对称三栏布局：左侧窄栏为导航/标签，中间宽栏为内容，右侧为元信息
- 首页采用报纸式版面：大标题文章占据上半屏，下方为文章网格

**Signature Elements**:
- 粗黑体大号数字作为文章编号装饰
- 水平细线分割内容区块
- 等宽字体用于代码与日期

**Interaction Philosophy**:
- 悬停时文字下划线从左向右展开
- 页面切换时内容块向上滑入

**Animation**:
- 极简过渡，duration 200ms，ease-out
- 无多余动效，仅必要的状态反馈

**Typography System**:
- 标题：Space Grotesk Bold
- 正文：Source Serif 4，16px，行高 1.75
- 标签/元信息：JetBrains Mono
</text>
<probability>0.08</probability>
</response>

## 方案二：日式极简主义（已选择）
<response>
<text>
**Design Movement**: 日式极简主义（Japanese Minimalism / Ma 间）

**Core Principles**:
- 「間」（Ma）哲学：以空白为核心，留白即内容
- 不对称美学：避免完全居中，营造自然张力
- 文字密度克制，每个词都有分量
- 黑白对比强烈，但过渡柔和

**Color Philosophy**:
- 主背景：暖白 #FAFAF8（略带米色温度）
- 主文字：深墨 #1A1A1A
- 辅助灰：#6B6B6B / #D4D4D0
- 强调色：墨黑 #000000，仅用于最重要元素

**Layout Paradigm**:
- 左对齐为主，故意打破居中惯例
- 首页：全屏大字标题 + 右下角文章列表
- 文章页：宽边距，内容列居中但不满屏

**Signature Elements**:
- 细竖线作为章节分隔（日式卷轴感）
- 文章卡片无边框，仅靠间距区分
- 日期以小号等宽字体标注

**Interaction Philosophy**:
- 悬停时背景微微变深，文字保持不动
- 滚动时导航栏渐隐/渐现

**Animation**:
- 页面加载：内容从下方 20px 淡入，duration 400ms
- 悬停：背景色 transition 150ms ease
- 无弹跳，无旋转，一切克制

**Typography System**:
- 标题：Playfair Display（衬线，优雅）
- 正文：Noto Serif SC（中文衬线）+ Lora（英文）
- 元信息：IBM Plex Mono
</text>
<probability>0.09</probability>
</response>

## 方案三：包豪斯构成主义
<response>
<text>
**Design Movement**: 包豪斯构成主义（Bauhaus Constructivism）

**Core Principles**:
- 几何形状作为基础构成单元
- 功能性与美学的统一
- 强烈的视觉对比与节奏感
- 模块化布局系统

**Color Philosophy**:
- 纯黑 #000000 + 纯白 #FFFFFF 为主
- 单一强调色：深红 #CC0000 或深蓝 #003366
- 大面积色块作为背景分区

**Layout Paradigm**:
- 全屏色块分区：黑色导航区 + 白色内容区
- 文章列表采用交错砖墙布局
- 大号几何装饰元素

**Signature Elements**:
- 粗边框矩形框住重要内容
- 对角线装饰元素
- 超大号字母作为背景纹理

**Interaction Philosophy**:
- 点击时色块反转（黑变白/白变黑）
- 悬停时边框颜色变化

**Animation**:
- 几何形状的旋转与缩放
- 色块滑入滑出
- 较强的视觉冲击感

**Typography System**:
- 标题：Bebas Neue（全大写，极粗）
- 正文：DM Sans
- 装饰：Oswald
</text>
<probability>0.07</probability>
</response>

---

## 已选方案：日式极简主义（方案二）

选择理由：最契合"黑白为主题的简洁风格"要求，同时具备独特的美学气质，不落入普通博客的俗套。「間」的哲学让留白成为设计语言，衬线字体赋予内容以文学质感。
