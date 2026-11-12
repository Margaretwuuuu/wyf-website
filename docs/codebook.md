# TaskFlow 之外的个人网站 · Code Book

> 本文档是 **margaret-website** 的完整代码手册：架构、设计系统、内容格式、模板机制、CMS 配置、部署流程与修改速查。任何改动前先读对应章节，改完跑 `npm run build` 验证。

- 站点名称：`margaret-wu-portfolio` v1.0.0
- 技术栈：**Eleventy 3.1.8**（静态站点生成器）+ Nunjucks 模板 + Markdown 内容 + Pages CMS / Decap CMS 双后台
- 唯一依赖：`@11ty/eleventy`（devDependencies，其余零依赖）

---

## 1. 整体架构

```
内容 (.md)  ──┐
              ├──→ Eleventy 构建 ──→ _site/ ──→ Netlify 发布
模板 (.njk) ──┘
     ↑
Pages CMS / Decap CMS（网页后台，改内容 = 提交 .md 到 GitHub）
```

核心思想：**内容和版式完全分离**。你写文章只碰 `.md` 文件；页面的样子由 `_includes/` 里的模板统一控制。改一处模板，所有文章页同步更新。

### 1.1 目录地图

```
margaret-website/
├── package.json              # 构建脚本：build / dev / clean
├── eleventy.config.js        # ★ 生成器核心：过滤器、集合、目录配置
├── netlify.toml              # 部署配置：构建命令、发布目录、缓存头
├── .pages.yml                # ★ Pages CMS 后台配置（推荐，免 OAuth）
├── .gitignore                # 忽略 node_modules / _site / images/uploads
├── images/                   # 图片目录（空，构建时原样拷贝进 _site）
│   └── uploads/              # CMS 上传的图片落在这里
├── admin/                    # （构建产物）Decap 后台入口
├── docs/
│   ├── cms-design.md         # CMS 选型的设计文档（为什么用 Pages CMS）
│   └── codebook.md           # ← 本文档
├── index.html / zh.html /    # 旧版手写 HTML，仅作备份，不参与构建
│   article-template.html /
│   linkedin-post.html
└── src/                      # ★ 生成器输入目录（真正生效的源码）
    ├── index.njk             # 英文首页
    ├── zh.njk                # 中文首页
    ├── _data/
    │   └── cats.js           # ★ 分类字典：名称、颜色、类型文案（中英）
    ├── _includes/
    │   ├── head.njk          # <head> 公共件：meta、favicon、字体、og 标签
    │   ├── header-en.njk     # 英文页头（logo + 导航）
    │   ├── header-zh.njk     # 中文页头
    │   ├── card.njk          # ★ 作品卡片组件（首页循环调用）
    │   ├── post-en.njk       # 英文文章页布局
    │   └── post-zh.njk       # 中文文章页布局
    ├── static/
    │   ├── static.json       # 让静态页按模板输出（绕过目录拷贝限制）
    │   ├── article-template.html  # 静态拷贝：文章模板参考页
    │   └── linkedin-post.html     # 静态拷贝：LinkedIn 单帖页
    ├── admin/
    │   ├── index.html        # Decap 后台页面（输出到 /admin/）
    │   ├── config.njk        # Decap 配置源码 → 输出 /admin/config.yml
    │   └── config.yml        # 同上的 yml 原件（备用）
    └── content/articles/     # ★ 所有文章（文件名 = 网址）
        ├── en/  en.json + *.md
        └── zh/  zh.json + *.md
```

> **注意**：根目录的 `index.html` / `zh.html` 是 2026-11-08 改造前的旧版备份，**不会被部署**。线上页面全部由 `src/` 生成。

### 1.2 构建输出（_site/）

```
_site/
├── index.html                      ← src/index.njk
├── zh/index.html                   ← src/zh.njk
├── posts/<slug>/index.html         ← 每篇英文文章
├── zh/posts/<slug>/index.html      ← 每篇中文文章
├── article-template.html / linkedin-post.html
├── admin/index.html + admin/config.yml
└── images/                         ← 原样拷贝
```

---

## 2. 设计系统（Design Tokens）

### 2.1 色板

| 用途 | 色值 | 出现位置 |
|---|---|---|
| 底色（奶油） | `#FFFBF2` | 全站背景、卡片背景 |
| 主墨色 | `#0F1020` | 文字、边框、按钮底、导航底 |
| 次级文字 | `#3B3F5C` | 摘要、正文段落 |
| 弱化文字 | `#4A4D63` | 日期、分类小字 |
| 导航悬停 | `#3B3F5C` | a:hover |
| Owners 主色 | `#D4FF3A` 荧光绿 | 分类色块、favicon 外圈、发送按钮 |
| Sponsors 主色 | `#FF8A65` 珊瑚橙 | 分类色块、favicon 中圈 |
| Fans 主色 | `#9BD3FF` 天蓝 | 分类色块 |
| ★ Her Game | `#E2B6FF` 淡紫 | 叠加标签、LinkedIn 入口按钮 |

**分类颜色由 `src/_data/cats.js` 单点管理**，改颜色只改这一个文件，首页卡片和文章页自动同步：

```js
owners:   { en: "Owners",   zh: "谁拥有", color: "#D4FF3A", type: { en: "Deal analysis",   zh: "交易分析" } },
sponsors: { en: "Sponsors", zh: "谁买单", color: "#FF8A65", type: { en: "Sponsorship case", zh: "赞助案例" } },
fans:     { en: "Fans",     zh: "谁在看", color: "#9BD3FF", type: { en: "Media & fans",    zh: "媒体与粉丝" } },
```

### 2.2 字体

| 语言 | 标题字体 | 正文字体 |
|---|---|---|
| 英文 | `Bricolage Grotesque` 700/800 | `Inter` 400–700 |
| 中文 | `Noto Sans SC` 900 | `Noto Sans SC` 400–700 |

字体通过 Google Fonts 一次性加载（`head.njk` 第 7 行），含 `display=swap`。

### 2.3 其他固定样式

- 卡片：`padding: 28px; border: 2px solid #0F1020; border-radius: 24px; background: #FFFBF2`
- 按钮/标签胶囊：`border-radius: 999px`
- 大标题字号：英文 `clamp(44px, 7vw, 88px)`，中文 `clamp(38px, 5.6vw, 72px)`；行高 1.6/1.7（为三个高亮色块留行距，**不要改回 1.4**，会叠压）
- 首页高亮词：`display: inline-block; margin: 8px 2px; padding: 2px 12px; border-radius: 14px`
- favicon：内联 SVG 靶心（绿外圈 + 橙中圈 + 绿圆心），无独立文件
- 全局：`html { scroll-behavior: smooth }`、`* { box-sizing: border-box }`、链接悬停变色

### 2.4 页面结构（双语一致）

| 区块 | 锚点 | 英文标题 | 中文标题 |
|---|---|---|---|
| 英雄区 | — | Hi, I'm Yifan… | 嗨，我是吴宜凡… |
| 顶部横幅 | — | Who am I? ✦ What I'm obsessed with? ✦ China × U.S. | 我是谁？✦ 我着迷什么？✦ 中国 × 美国 |
| 关注方向 | `#focus` | What I'm obsessed with | 我最着迷的事 |
| 作品 | `#work` | The Work | 作品 |
| 课堂延伸 | `#classroom` | Classroom Extension | 课堂延伸 |
| 关于 | `#about` | Who am I | 关于我 |
| 射箭 | `#archery` | Bullseye Bits | 射箭 |
| 联系 | `#contact` | Connect | 联系 |

---

## 3. 内容格式（最重要的一节）

### 3.1 文章文件规范

- 位置：`src/content/articles/en/`（英文）、`src/content/articles/zh/`（中文）
- 文件名：**小写英文短横线**，即 slug；中英两篇 slug 相同才会自动互链
  - 例：`wnba-valuation.md` → 英文 `/posts/wnba-valuation/`，中文 `/zh/posts/wnba-valuation/`
- 中英目录各有一个 `en.json` / `zh.json`（目录级默认 frontmatter，设定 `layout` 和 `permalink`），**新建文章不要覆盖它们**

### 3.2 Frontmatter 字段表（CMS 表单与之一一对应）

| 字段 | 必填 | 类型 | 说明 |
|---|---|---|---|
| `title` | ✅ | string | 文章标题，卡片和文章页共用 |
| `slug` | ✅ | string | 网址名，小写短横线；中英一致 → 自动互链 |
| `date` | ✅ | date | `YYYY-MM-DD`，控制排序（新→旧）和卡片日期显示 |
| `category` | ✅ | select | `owners` / `sponsors` / `fans`，决定色块与筛选归属 |
| `her_game` | — | boolean | `true` 时叠加 `★ Her Game` 淡紫标签，参与筛选 |
| `summary` | ✅ | text | 两句话摘要，建议带一个关键数字 |
| `cover` | — | image | 封面图（上传到 `images/uploads/`） |
| `sources` | — | list | 来源列表，渲染为文末 Sources 区 |

完整示例（取自 `who-owns-the-wnba.md`）：

```yaml
---
layout: post-en.njk
title: "[Article title: the deal and the question it raises]"
summary: "[Two sentences: what happened, your main finding and one key number.]"
date: 2026-11-01
category: owners
her_game: true
permalink: "/posts/{{ page.fileSlug }}/index.html"
sources:
  - "[Source title, publisher, date]"
---
```

### 3.3 正文 Markdown 约定

- 小节用 `##`（渲染为 `<h2>`）
- 金句用 `> ` 引用（渲染为带边距的 blockquote）
- 列表用 `- `，每条带数字更符合站内文风
- 图片：`![说明](/images/uploads/xxx.jpg)`
- 行内约定：短段落（≤3 句）、用数字代替形容词

### 3.4 新增分类的步骤（目前只有 3 类）

1. `src/_data/cats.js` 加一项（名称/颜色/type）
2. `.pages.yml` 和 `src/admin/config.njk` 里 `category` 的 options 各加一个同名值
3. `src/index.njk` 和 `src/zh.njk` 里筛选按钮区加一个新按钮（含计数）
4. 文章 frontmatter 里即可使用新值

---

## 4. 模板机制

### 4.1 Eleventy 配置（eleventy.config.js）

| 配置项 | 值 | 作用 |
|---|---|---|
| `dir.input` | `src` | 源码目录 |
| `dir.output` | `_site` | 产物目录 |
| `templateFormats` | njk, md, html | 处理的文件类型 |

**自定义过滤器（Nunjucks 里用 `|` 调用）：**

| 过滤器 | 签名 | 作用 |
|---|---|---|
| `fmtDate` | `date \| fmtDate(lang)` | 英文 `Nov 2026`；中文 `2026 年 11 月` |
| `countCat` | `list \| countCat(key)` | 统计某分类文章数（首页筛选按钮数字） |
| `countHer` | `list \| countHer` | 统计 ★ Her Game 文章数 |
| `findTwin` | `list \| findTwin(slug)` | 在另一语言集合里找同 slug 文章（双语互链） |
| `readingTime` | `html \| readingTime` | 阅读时长：英文 220 词/分钟 + 中文 400 字/分钟，最少 1 分钟 |

**自定义集合：**

| 集合 | 来源 | 排序 |
|---|---|---|
| `collections.articlesEn` | `src/content/articles/en/*.md` | 日期倒序 |
| `collections.articlesZh` | `src/content/articles/zh/*.md` | 日期倒序 |

### 4.2 组件关系

```
index.njk ─┬─ include head.njk        （<head>）
           ├─ include header-en.njk   （导航）
           ├─ 三处高亮词色块（hero）
           └─ for article in collections.articlesEn
                 ├─ include card.njk   （作品卡片，传 pLang="en"）
                 └─ 文章计数自动写入筛选按钮（All (n)）
文章 .md ─→ layout: post-en.njk / post-zh.njk
           ├─ head.njk（og: 分享标签由 title/summary/cover 生成）
           ├─ 页首：分类色块 + ★ Her Game + 日期 + 阅读时长
           ├─ findTwin 渲染「中文版 / English」互链按钮
           ├─ {{ content }}（Markdown 正文）
           └─ 文末：Sources 列表 + 返回链接
```

### 4.3 双语互链原理

文章页先查自己所在的集合，再用 `findTwin(slug)` 到另一语言集合里找同名文件；找到就渲染切换按钮，找不到则不渲染。**这就是"中英 slug 必须一致"的原因。**

---

## 5. CMS 后台

两套后台读写**同一批 Markdown 文件**，字段完全一致，可并存：

| | Pages CMS（推荐） | Decap CMS |
|---|---|---|
| 配置文件 | `.pages.yml`（仓库根） | `src/admin/config.njk` → `/admin/config.yml` |
| 入口 | https://app.pagescms.org | `你的域名/admin/` |
| 登录 | GitHub，零配置 | 需配 GitHub OAuth（Decap Turbo 免费档 1 站 1 席） |
| 图片上传 | `images/uploads/` | 同左 |

**改后台表单字段时，两个配置文件都要改**（`.pages.yml` 和 `src/admin/config.njk`，注意后者被 `{% raw %}…{% endraw %}` 包裹）。

> 部署细节：`netlify.toml` 给 `/admin/*` 加了 `X-Robots-Tag: noindex`，后台不会被搜索引擎收录。

---

## 6. 部署与命令

### 6.1 常用命令

```bash
npm run dev      # 本地开发：http://localhost:8080，改动实时刷新
npm run build    # 一次性构建到 _site/
npm run clean    # 删除 _site/
```

### 6.2 上线流程（Netlify + GitHub）

```
git push → Netlify 自动构建（npm run build）→ 发布 _site/ → 线上更新（约 1 分钟）
```

`netlify.toml` 已配置：

| 配置 | 值 |
|---|---|
| build command | `npm run build` |
| publish 目录 | `_site` |
| Node 版本 | 22 |
| `/images/*` 缓存 | `max-age=31536000, immutable`（图片一年缓存） |
| `/admin/*` | noindex |

**发文章 = CMS 里点保存**（提交到 GitHub），其余全自动；不需要手动跑构建。

### 6.3 Netlify 表单

联系表单带 `data-netlify` 属性；部署到 Netlify 后留言自动生效，后台 Forms 页可查。

---

## 7. 修改速查表

| 想改什么 | 改哪里 |
|---|---|
| 分类名称/颜色/类型文案 | `src/_data/cats.js` |
| 导航栏文字 | `src/_includes/header-en.njk` / `header-zh.njk` |
| 首页任何文案（hero、横幅、about、archery、contact） | `src/index.njk` / `src/zh.njk` |
| 字体 | `src/_includes/head.njk` 第 7 行 + 各模板 font-family |
| favicon | `src/_includes/head.njk` 第 5 行（内联 SVG） |
| 卡片样式 | `src/_includes/card.njk` |
| 文章页样式 | `src/_includes/post-en.njk` / `post-zh.njk` |
| SEO / 分享卡片 | 文章 frontmatter（title/summary/cover）+ `head.njk` og 区 |
| CMS 表单字段 | `.pages.yml` + `src/admin/config.njk`（两处都改） |
| 部署行为 | `netlify.toml` |
| 新文章 | `src/content/articles/{en,zh}/<slug>.md` 或走 CMS |

## 8. 已知事项与坑

1. **旧 HTML 未删除**：根目录 `index.html` / `zh.html` / `article-template.html` / `linkedin-post.html` 是改造前备份，**不在构建范围**，不会上线。确认新版稳定后可删。
2. **slug 一致性**：中英文章 slug 不一致就不会互链，也不会在对方首页出现"读中文版"按钮。
3. **分类只有 3 类**：卡片筛选和 `data-cats` 都基于 `cats.js` 的 key，新增分类务必走 §3.4 的四步。
4. **行高别回调**：hero 标题行高 1.6/1.7 是为高亮色块防叠压专门调过的（2026-11-08 修改）。
5. **本机沙箱曾拦截 Eleventy 的目录拷贝删除操作**——因此静态页（article-template、linkedin-post）和 admin 配置都用"模板输出"方式生成（`src/static/static.json` + `src/admin/config.njk`），而不是 `addPassthroughCopy` 目录映射。Netlify 干净环境无此限制，但保持现做法可让 `npm run dev` 在任何机器稳定运行。
6. **Her Game 是叠加标签**：`her_game: true` 的文章同时属于原分类和 `her` 筛选组，计数由 `countHer` 单独统计。

---

*文档生成于 2026-11-12，与当时的代码状态一一核对过。大改版后请同步更新本文档。*
