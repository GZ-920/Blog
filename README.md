# 初源博文 · Material You 静态博客增强版

这是针对 `GZ-920/Blog` 重构的无构建静态博客版本，目标是在继续使用 **Cloudflare Pages + GitHub 仓库** 的前提下，把纯静态网站能做的功能尽量做完整，同时把真正需要共享写入状态的功能做成可选的 Cloudflare 扩展。

## 已实现

- Material 3 / Material You 风格 UI
- 背景图片动态取色
  - 尝试调用官方 `@material/material-color-utilities`
  - 从背景图采样种子色
  - 自动生成浅色 / 深色配色
  - CDN 不可用时自动使用内置调色算法
- 自定义背景图、位置、模糊度、透明度
- 浅色 / 深色 / 跟随系统三态主题
- 首页文章搜索与分类筛选
- Markdown 文章系统
- 自动目录、阅读进度、文章字数、代码复制、分享
- Giscus / GitHub Discussions 评论
- 点赞双模式
  - 纯静态：`localStorage` 本地点赞
  - 可选：Cloudflare Pages Functions + D1 全站点赞
- `admin.html` 管理工作台
  - 修改站点信息和主题
  - 上传背景并动态预览取色
  - 新建、编辑 Markdown 文章
  - 导出 `site.config.json`、Markdown、`posts.json`
  - 输入 GitHub Fine-grained PAT 后直接提交回仓库
  - PAT 只保存在当前页面内存，不写入源码或 localStorage
- PWA / Service Worker 基础离线缓存
- Cloudflare Pages `_headers` 与 `_redirects`
- 移动端响应式
- 无 npm、无打包器、无构建步骤

## 目录

```text
.
├── index.html                 首页
├── article.html               文章页
├── about.html                 关于页
├── admin.html                 管理工具
├── 404.html
├── assets/
│   ├── style.css              完整 UI / Material 3 样式
│   ├── main.js                首页和通用交互
│   ├── article.js             文章、点赞、Giscus、目录
│   ├── admin.js               管理工作台与 GitHub Contents API
│   ├── shared.js              共用逻辑
│   ├── theme-engine.js        背景取色与 Material You 主题
│   ├── markdown.js            内置 Markdown 渲染器
│   └── site.config.json       主要配置文件
├── posts/
│   ├── posts.json             文章索引
│   └── *.md                   Markdown 文章
├── images/                    背景和文章图片
├── functions/api/likes.js     可选 Cloudflare 全站点赞 API
├── schema.sql                 D1 点赞表结构
├── manifest.webmanifest
├── sw.js
├── _headers
├── _redirects
└── CONFIGURATION.md           详细配置手册
```

## 最快部署

1. 备份你原来的仓库。
2. 把本项目文件覆盖到仓库根目录并 push 到 `main`。
3. 保持现有 Cloudflare Pages Git 连接。
4. 不配置任何额外服务也可以运行：评论默认关闭，点赞自动回退到浏览器本地模式。
5. 打开 `https://你的域名/admin` 进入管理工具。

> 仓库原版首页会请求 `posts/posts.json`，但当前 `main` 分支的 `posts/` 只有 `.gitkeep`。本版已经补齐 `posts.json` 和两篇可删除的示例文章，因此不会再因为文章索引缺失而直接报错。

## 重要说明：所谓“纯静态后台”

纯静态网页没有可信服务器会话，因此不能把 JavaScript 中的“后台密码”当成安全措施：代码和哈希都会被下载到访客浏览器。

本项目采用更合适的方式：

- `admin.html` 是编辑器，不是安全边界；
- 真正的写入权限来自 GitHub Fine-grained PAT；
- PAT 只在当前页面内存中存在；
- 推荐只给 `GZ-920/Blog` 单仓库 `Contents: Read and write` 权限；
- 用完刷新或关闭页面即可清掉令牌。

如果未来需要真正的多人账号后台，可以再加 Cloudflare Access 或自定义 Pages Functions 身份认证。

## 详细配置

请直接阅读 [CONFIGURATION.md](./CONFIGURATION.md)。里面包含：

- Cloudflare Pages 部署
- Material You 动态取色
- 背景图配置
- Giscus 评论
- D1 全站点赞
- GitHub 管理页写回
- 新文章格式
- 自定义外观
- 常见问题与排障

## 外部服务

这个项目默认只会在需要时访问：

- Material Color Utilities ESM：`cdn.jsdelivr.net`
- Giscus 评论：`giscus.app`
- 管理页提交代码：`api.github.com`

即使 Material Color Utilities CDN 不可用，主题仍会使用本地算法生成；即使 D1 未配置，点赞也会回退到本地模式。

## 官方资料

- Cloudflare Pages Functions: https://developers.cloudflare.com/pages/functions/
- Pages Functions bindings / D1: https://developers.cloudflare.com/pages/functions/bindings/
- Cloudflare D1: https://developers.cloudflare.com/d1/
- Giscus: https://giscus.app/zh-CN
- Material Color Utilities: https://github.com/material-foundation/material-color-utilities
