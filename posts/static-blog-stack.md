# 纯静态博客也可以很完整

这个版本把功能分成**静态核心**和**可选动态扩展**。不配置数据库时，网站仍然可以完整浏览；需要共享状态时，再使用 Cloudflare Pages Functions。

## 静态核心

站点由 HTML、CSS、JavaScript、JSON 和 Markdown 组成，不需要 npm 构建步骤。

## 评论

评论使用 GitHub Discussions + Giscus，访客通过 GitHub 登录参与讨论。

## 点赞

默认 `auto` 模式会先尝试 `/api/likes`。如果 D1 没有配置，就自动退回浏览器本地计数，不影响文章阅读。

## 后台

`admin.html` 是编辑界面，不是传统服务端后台。真正的仓库写权限来自临时输入的 GitHub Fine-grained PAT。
