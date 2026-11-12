# Margaret Wu — 个人网站（含可视化后台）

一个无框架的静态站点：文章是 Markdown，Eleventy 构建成 HTML，后台用 Pages CMS（或 Decap）在浏览器里写。

## 目录结构

```
margaret-website/
├── src/
│   ├── _data/cats.js            # 三个分类的名字/颜色/类型文案
│   ├── _includes/
│   │   ├── head.njk             # <head>、字体、favicon、分享卡片 meta
│   │   ├── header-en.njk        # 英文导航
│   │   ├── header-zh.njk        # 中文导航
│   │   ├── card.njk             # 作品卡片（首页复用）
│   │   ├── post-en.njk          # 英文文章版式
│   │   └── post-zh.njk          # 中文文章版式
│   ├── content/articles/
│   │   ├── en/*.md              # 英文文章（文件名 = 网址）
│   │   └── zh/*.md              # 中文文章（同名文件 = 中英互链）
│   ├── static/                  # 文章模板页、LinkedIn 单帖页
│   ├── index.njk                # 英文首页
│   ├── zh.njk                   # 中文首页
│   └── admin/                   # Decap 后台（/admin/）
├── images/uploads/              # 后台上传的图片（构建时复制到 _site）
├── .pages.yml                   # Pages CMS 后台配置
├── eleventy.config.js
├── netlify.toml
└── package.json
```

构建产物在 `_site/`，**不要手动改 `_site` 里的文件**，它是生成出来的。

## 日常写作（推荐路径）

1. 打开 https://app.pagescms.org ，用 GitHub 账号登录，选择本仓库
2. 左侧「中文文章」→ 新建：填标题、链接名（英文小写，如 `wnba-valuation`）、日期、分类、摘要、正文
3. 点保存 → 自动提交到 GitHub → Netlify 构建 → 约一分钟后线上更新

**中英互链规则**：中文和英文两篇文章的**文件名（链接名）保持一致**，页面右上角会自动出现「中文版 / English」切换。只写一种语言也完全可以。

## 本地预览

```bash
cd margaret-website
npm install        # 第一次才需要
npm run dev        # 打开 http://localhost:8080
```

只构建不预览：`npm run build`，然后看 `_site/index.html`（本地直接双击会跳转异常，因为站内链接是根路径，建议用 `npm run dev`）。

## 首次上线（一次性）

1. 注册 GitHub，新建仓库 `margaret-website`（Public 或 Private 都行）
2. 在仓库目录执行：
   ```bash
   git init && git add -A && git commit -m "init"
   git branch -M main
   git remote add origin https://github.com/<你的用户名>/margaret-website.git
   git push -u origin main
   ```
3. Netlify → Add new site → Import from GitHub → 选仓库
   - Build command: `npm run build`
   - Publish directory: `_site`（`netlify.toml` 已写好，通常自动识别）
4. 部署完成后，联系表单会通过 Netlify Forms 生效（页面里已有 `data-netlify` 标记）
5. 若要用 `/admin/`（Decap）：把 `src/admin/config.njk` 里的 `repo:` 改成你的仓库，并配置 OAuth（Decap Turbo 免费档即可）

## 常见改动在哪

| 想改什么 | 改哪里 |
|---|---|
| 首页那句话 / 三个色块 | `src/index.njk` 和 `src/zh.njk` 的 `<h1>` |
| 导航文字 | `src/_includes/header-en.njk` / `header-zh.njk` |
| 分类颜色与文案 | `src/_data/cats.js` |
| 文章卡片长什么样 | `src/_includes/card.njk`（改一次，全站生效） |
| 页脚版权 | `src/index.njk` / `src/zh.njk` 底部 |
| 联系表单收件 | Netlify 后台 Forms 里设置通知邮箱 |

## 注意

- `_site/` 与 `node_modules/` 已在 `.gitignore` 里，不要提交
- 旧的根目录 `index.html` / `zh.html` / `linkedin-post.html` / `article-template.html` 是最初的手写版本，**已不再参与构建**，可留作备份，也可删除
- 页面里的 `[占位符]` 是待填内容：文章在 CMS 里改，照片替换 `images/uploads/` 里的文件并在文章里引用
