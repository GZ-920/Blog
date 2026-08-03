# 信号与像素 · Signal & Pixel

一个纯静态的个人博客，苹果风格设计：暗色玻璃质感导航栏（含 SVG 折射的「液态玻璃」增强）、临界阻尼弹簧驱动的分段筛选控件、EDR 风格光晕、SF Pro / PingFang SC 系统字体排版，并适配浅色模式、减弱动态（prefers-reduced-motion）与高对比度。

**关于液态玻璃效果**：[liquid-dom](https://github.com/AndrewPrifer/liquid-dom) 是基于 WebGPU 的方案，DOM 内容还需要手动打开 Chrome 的实验性 flag 才能渲染，不适合放在一个面向所有访客的静态博客上——大部分人打开会直接看不到效果甚至报错。这里改用纯 CSS/SVG 的近似方案（`feTurbulence` + `feDisplacementMap` 生成折射贴图，通过 `backdrop-filter: url(#filter)` 叠加在毛玻璃上），在 `assets/main.js` 里做了特性检测，支持的浏览器（Chrome / Edge / Firefox）会看到导航栏和筛选控件表面的轻微液态扭曲，不支持的浏览器会静默回退到普通的模糊 + 饱和度玻璃，不会报错或空白。

不依赖任何构建工具，纯 HTML + CSS + 原生 JS，可以直接部署。

## 目录结构

```
site/
├─ index.html          首页（Hero + 分类筛选 + 日志列表）
├─ about.html           关于页（设备清单 / 关注方向）
├─ posts/                文章页
│   ├─ liquid-glass-edr.html
│   ├─ xiaoai-deepseek.html
│   ├─ miku-terminal.html
│   └─ late-night-flashing.html
└─ assets/
    ├─ style.css         设计系统（token + 组件）
    ├─ main.js           导航模糊 / 主题切换 / 弹簧筛选控件 / 滚动揭示
    └─ favicon.svg
```

## 部署到 Cloudflare Pages

### 方式一：Dashboard 直接拖拽上传（最快，无需 Git）
1. 打开 [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **创建应用程序** → **Pages** → **上传资产**。
2. 项目名称随意填写，例如 `signal-and-pixel`。
3. 把本文件夹（`site/` 里的全部内容，注意是内容而不是外层文件夹本身）拖入上传框。
4. 构建命令留空、输出目录填 `/`（因为没有构建步骤）。
5. 点击部署，几十秒后会得到一个 `*.pages.dev` 的域名，之后也可以在 Pages 项目的「自定义域」里绑定自己的域名。

### 方式二：通过 Git 仓库自动部署（推荐，方便以后加文章）
1. 把 `site/` 文件夹推送到一个 GitHub / GitLab 仓库。
2. Cloudflare Dashboard → **Workers & Pages** → **创建应用程序** → **Pages** → **连接到 Git**，选择这个仓库。
3. 构建设置：
   - **框架预设**：`无 / None`
   - **构建命令**：留空
   - **构建输出目录**：`/`（如果 `index.html` 在仓库根目录）
4. 保存并部署。之后每次 `git push`，Cloudflare Pages 会自动重新部署。

### 方式三：命令行（Wrangler）
```bash
npm install -g wrangler
wrangler pages deploy site --project-name=signal-and-pixel
```

## 新增一篇文章

1. 复制 `posts/` 下任意一篇文章作为模板。
2. 修改 `<title>`、`.cat`（分类：`折腾` 用 `--accent-tech`，`音乐` 用 `--accent-music`，`随笔` 用 `--accent-essay`）、标题、`.article-meta` 里的日期，以及正文。
3. 回到 `index.html`，在 `.post-grid` 里新增一张 `.post-card`，并给它加上正确的 `data-cat`（`tech` / `music` / `essay`）——分段筛选控件会自动按这个属性过滤，不需要改 JS。

## 自定义

- 配色、字体、圆角、缓动曲线全部集中在 `assets/style.css` 顶部的 `:root` token 里，改这里即可整体换风格。
- 深色是默认主题，`assets/main.js` 里通过 `localStorage` 记住用户上次选择的浅色 / 深色。
- 分段筛选控件的动画是手写的一个轻量弹簧（临界阻尼），不依赖任何第三方动画库，逻辑都在 `main.js` 的 `springStep` 部分。
