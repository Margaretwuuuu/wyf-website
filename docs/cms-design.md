# 方案 C 设计：给作品集接一个可视化后台

目标：在浏览器里写文章（填标题、选分类、传封面、写正文），点发布 → 网站自动更新。不装软件、不碰代码、不手动改 HTML。

---

## 一、为什么需要先改一次结构

现在的网站是「手写 HTML」：一篇文章 = 一个手工复制的 HTML 文件，标题、正文、样式全混在同一个文件里。
后台（CMS）只能编辑**结构化内容**（标题、日期、正文这些字段），它改不了一堆内联样式。所以要让后台工作，必须先把「内容」和「版式」拆开：

```
现在：  article-01.html  =  版式 + 内容（混在一起）
改造后：content/article.md = 内容（只有文字和字段）
        src/post.njk      = 版式（只写一次，所有文章共用）
        构建 → 输出 HTML
```

拆开之后，你只需要在后台上填内容，版式由模板统一生成。**这次改造只做一次，之后加文章全是纯内容工作。**

---

## 二、技术栈（2026 年 11 月现状核实）

| 环节 | 选择 | 理由 |
|---|---|---|
| 内容存储 | Markdown 文件 + Git（GitHub 仓库） | 纯文本、可回滚、不锁定在任何平台 |
| 编辑界面 | **Pages CMS**（首选）或 Decap CMS（备选） | 见下方对比 |
| 构建 | **Eleventy (11ty)** | 无框架、模板语法简单、Netlify 原生支持 |
| 托管 | **Netlify**（页面里已有 data-netlify 表单标记） | 免费额度足够，push 即部署 |
| 图片 | 仓库内 `images/uploads/` | CMS 上传自动落盘，无需图床 |

### ⚠️ 一个必须避开的坑
「Decap CMS + Netlify Identity + Git Gateway」是网上教程最常抄的组合，**Netlify 已弃用 Git Gateway，不再推荐新站使用**。因此：

- **C-1（推荐）Pages CMS**：托管在 `app.pagescms.org`，用 GitHub 账号授权登录，**零 OAuth 配置、免费**。代价：后台不在你的域名下（没有 `/admin` 页面），但你只是自己用，影响为零。
- **C-2 Decap CMS + Decap Turbo**：后台在 `你的域名/admin/`，字段和预览完全自定义。代价：需要 OAuth（Decap Turbo 免费档 1 站点 1 席位），配置步骤明显更多。

**结论：先用 C-1。** 内容格式和模板与 C-2 完全兼容，将来想换只是改一个配置文件。

---

## 三、改造后的目录结构

```
margaret-website/
├── content/
│   ├── articles/
│   │   ├── en/2026-11-08-who-owns-the-wnba.md
│   │   └── zh/2026-11-08-shui-yong-you-wnba.md
│   └── site.json              # 首页文案、hero、导航、页脚（也能在后台改）
├── src/
│   ├── _includes/
│   │   ├── head.njk           # <head>、字体、favicon
│   │   ├── header.njk         # 顶部导航（中英共用）
│   │   ├── footer.njk
│   │   ├── card.njk           # 一张作品卡片
│   │   └── article.njk        # 文章页版式
│   ├── index.njk              # 英文首页
│   ├── zh.njk                 # 中文首页
│   ├── post.njk               # 文章页（按 slug 批量生成）
│   └── assets/style.css       # 从内联样式抽出的公共样式（第二阶段）
├── images/uploads/            # CMS 上传的图片
├── .pages.yml                 # Pages CMS 的后台配置（字段定义）
├── eleventy.config.js
├── netlify.toml
└── package.json
```

输出（Netlify 自动生成，不用管）：`_site/`
- `/` 英文首页
- `/zh/` 中文首页
- `/posts/who-owns-the-wnba/` 英文文章
- `/zh/posts/shui-yong-you-wnba/` 中文文章

**为什么用 `/posts/名称/` 而不是 `article-01.html`**：给 LinkedIn 分享时，链接里带标题关键词更可信；每篇文章还能有自己的分享卡片（标题 + 封面图 + 摘要）。

---

## 四、一篇文章的数据结构

```yaml
---
title: "谁真正拥有 WNBA 的增长"
title_en: "Who actually owns the WNBA's growth"
slug: shui-yong-you-wnba
date: 2026-11-08
category: owners          # owners | sponsors | fans
her_game: true            # 是否打 ★ Her Game 标签
summary: "联盟收入四年翻了三倍，但估值涨幅里有 60% 来自转播合同重签，而不是观众增长。"
cover: /images/uploads/wnba-cover.jpg
lang: zh
translation: who-owns-the-wnba   # 对应英文版 slug，用于互跳；无则留空
sources:
  - "Sportico, 2026-10-30"
  - "WNBPA 年度报告, 2026"
---
正文用 Markdown 写：`## 小标题`、`**加粗**`、`> 引用`、`- 列表`，图片 `![说明](/images/uploads/x.jpg)`。
```

对应 `.pages.yml` 的字段（后台里就是一个表单：文本框、日期选择器、下拉菜单、开关、图片上传、列表）：

```yaml
media: images/uploads
content:
  - name: articles_zh
    label: 中文文章
    type: collection
    path: content/articles/zh
    view:
      fields: [title, date, category, draft]
    fields:
      - { name: title, label: 标题, type: string, required: true }
      - { name: slug, label: 链接名（英文小写短横线）, type: string, required: true }
      - { name: date, label: 日期, type: date, required: true }
      - { name: category, label: 分类, type: select, options: { values: [owners, sponsors, fans] } }
      - { name: her_game, label: "打 ★ Her Game 标签", type: boolean }
      - { name: summary, label: 两句话摘要, type: text }
      - { name: cover, label: 封面图, type: image }
      - { name: sources, label: 来源, type: string, list: true }
      - { name: body, label: 正文, type: rich-text }
  - name: articles_en
    label: English articles
    type: collection
    path: content/articles/en
    # 字段同上，只是 label 换成英文
```

首页文案（hero 那句话、页脚版权）放进 `content/site.json`，后台里是一个「站点设置」表单，改文案不用碰代码。

---

## 五、发布一篇文章会发生什么

1. 你在 `app.pagescms.org` 里点「新建文章」，填表单、传封面
2. 它把内容存成 Markdown，**直接提交到你的 GitHub 仓库**（每次发布 = 一次 Git 提交，可一键回滚）
3. Netlify 检测到提交，自动跑 `npx @11ty/eleventy` 构建
4. 静态 HTML 上线，文章出现在作品区，筛选计数自动更新（模板里算，不用手改 `All (4)`）

**你全程看到的就是一个表单和「Save」按钮。** 写错了退回历史版本即可，不会像手改 HTML 那样一改坏就全站乱。

---

## 六、分五步落地（每步独立可回滚）

| 步骤 | 做什么 | 结果 |
|---|---|---|
| 0 | 注册 GitHub，把 `margaret-website` 推成仓库；在 Netlify 里连上仓库 | 网站先原样上线，拿到可访问链接 |
| 1 | 加 `package.json` / `eleventy.config.js` / `netlify.toml`，把现有 HTML 搬进 `src/` 做模板 | 构建产物与你现在看到的像素级一致 |
| 2 | 首页作品区改为「循环渲染卡片」，计数自动 | 加文章不再需要改 index |
| 3 | 建 `content/articles/`，把 4 张占位卡片替换成 1 篇真实的示例文章 | 打通端到端流程 |
| 4 | 接 Pages CMS（`.pages.yml`），试发一篇 | 后台可用 |
| 5 | （可选）抽出公共 CSS、加 RSS、加分享卡片图 | 长期维护更省力 |

第 1、2 步是关键改造，由我来做；第 0 步需要你自己操作 GitHub / Netlify（我可以逐步指导）。

---

## 七、取舍与你需要提前决定的事

**双语怎么处理？**
1. **每篇都写两版**（推荐）：中英各一个文件，用 `translation` 字段互链。质量最高，但每篇写两遍。
2. **中文为主 + 英文摘要**：英文页只显示标题和两句话，点进去是中文全文。省力，但英文访客体验打折。
3. **只维护中文**，英文站冻结为静态首页。最省力。

**已知代价**
- 构建依赖 Netlify：构建失败就不更新（可在 Deploys 里回滚；我会加个构建检查避免常见错误）
- 本地预览需要 Node（装一次 `npx @11ty/eleventy --serve`），但你日常用后台，不需要本地构建
- Pages CMS 的后台在第三方域名下（`app.pagescms.org`），不在你网站目录里

**成本**：GitHub 免费 · Netlify 免费（100GB 流量 / 300 分钟构建每月）· Pages CMS 免费 · 自定义域名约 ¥70/年（可选）

---

## 八、需要你确认的三件事

1. 后台选 **Pages CMS（零配置，推荐）** 还是 **Decap CMS（`/admin/` 自有入口）**？
2. 双语策略选 **1 / 2 / 3** 哪一种？
3. 是否现在就开始第 1 步（模板化改造，视觉不变）？

---

## 九、实施记录（2026-11-08 已落地）

已确认：**Pages CMS + Decap 两套配置并存**、**中英各写一版**。

实际结构相对本设计的两处调整：

1. **内容目录放在 `src/content/articles/`**，而不是根目录 `content/`。因为 Eleventy 只处理 `src/` 内的文件，放外面就读不到。
2. **每篇文章自己就是一个页面**（不再用分页模板批量生成）。好处：网址、`og:` 分享卡片、双语互链都能按篇独立控制。`src/content/articles/en/en.json` 与 `zh/zh.json` 作为目录默认值，提供 `layout` 和 `permalink`，所以后台保存时即使丢掉这两个字段也不会破坏构建。
3. Decap 配置以 `src/admin/config.njk` 形式提供（渲染成 `/admin/config.yml`），因为本站的构建把 `src/` 之外的文件排除了。

已验证：`npm run build` 产出 14 个页面，首页计数（All (4) / 全部（4））由集合长度自动计算，文章页正确渲染分类标签、★ Her Game、双语切换、Markdown 标题/引用/列表、阅读时长与来源列表。

