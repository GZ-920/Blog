# 配置说明

## Cloudflare Pages

网站没有 npm 构建步骤，直接发布仓库根目录。

- Production branch：`main`
- Root directory：留空
- Build output directory：`.`

## 站点与首页

编辑 `assets/site.config.json`，或打开 `/admin.html`。

## Material You 动态颜色

`theme.dynamicColor = true` 时，会从 `theme.background.image` 采样种子色，并生成浅色/深色 Material 色彩角色。

背景图片只是个性化输入。新版默认把图片透明度降到约 5%–7%，避免把 Material You 做成大面积毛玻璃背景。

## 评论

在 GitHub 开启 Discussions，去 giscus.app 获取 repoId / categoryId 后填入 `comments`。

## 点赞

默认 `likes.mode = auto`。没有 D1 时自动回退到 localStorage；绑定名为 `DB` 的 D1 后自动使用全站计数。

## Service Worker

本版缓存名为 `chuyuan-blog-m3-v3`，用于与旧版缓存区分。
