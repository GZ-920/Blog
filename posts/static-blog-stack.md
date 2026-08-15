# 纯静态博客也可以很完整

这个版本把功能分成了两层：**静态核心**和**可选动态扩展**。这样即使你不配置任何服务器资源，网站也能完整显示；需要全站状态时，再利用 Cloudflare Pages Functions。

## 静态核心

站点本身只由 HTML、CSS、JavaScript、JSON 和 Markdown 组成，没有 npm 构建步骤，也没有框架锁定。Cloudflare Pages 直接发布仓库内容即可。

## 评论为什么适合用 Giscus

评论正文存放在 GitHub Discussions。访客通过 GitHub 登录评论，站长在 GitHub 中管理和审核，不需要自建数据库或管理评论账号系统。

## 点赞为什么有两种模式

完全静态网页无法安全维护一个所有用户共享且可写的计数器。因此默认的 `auto` 模式会先访问 `/api/likes`：

1. 如果 Cloudflare Pages Function + D1 已配置，就显示全站计数；
2. 如果接口不存在或 D1 未绑定，就自动回退到 `localStorage` 本地点赞。

这样不会因为“还没配置后端”而让页面报错。

## 后台为什么不是传统登录页

纯静态网页里的密码最终都会下发到浏览器，因此放一个 JavaScript 密码并不能真正保护管理权限。新版管理页采用另一种边界：编辑器公开，但只有拥有 GitHub 写权限的 Fine-grained PAT 才能把修改提交回仓库。

这对个人博客很实用，也避免把长期密钥写进源码。
