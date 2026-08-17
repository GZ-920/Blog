# 配置说明

## Cloudflare Pages

网站没有 npm 构建步骤，直接发布仓库根目录。

- Production branch：`main`
- Root directory：留空
- Build output directory：`.`

## 站点与首页

编辑 `assets/site.config.json`，或打开 `/admin.html`。

## 首页头图轮播

`assets/site.config.json` 的 `theme.heroCarousel`，或在后台「站点与外观 → 首页头图轮播」中编辑：

- `enabled`：是否启用卡牌轮播（不足 2 张图时自动隐藏）
- `autoplay`：是否自动切换
- `interval`：自动切换间隔（毫秒，最低 1000）
- `images`：轮播图片路径列表（每张会作为主题色种子，切换时主题色平滑过渡到对应图抽取的色调）

桌面端 hover 出现左右箭头按钮，点击切换；手机端可滑动切换；底部胶囊状指示器为 Material You 风格，当前激活项更长并应用 `--md-primary` 主题色。

## 首页横幅公告

`assets/site.config.json` 的 `banner` 字段，或在后台「站点与外观 → 首页横幅公告」中编辑：

- `enabled`：是否显示公告横幅
- `variant`：背景样式，`theme` 为主题色（secondary-container），`danger` 为红色（error-container）
- `showClose`：是否显示右上角关闭按钮
- `label`：角标文字（默认「公告」）
- `title`：横幅标题
- `message`：横幅正文
- `link` / `linkLabel`：可选跳转链接与按钮文案，留空则不显示按钮

公告固定在页面顶部（sticky），滚动时保持可见。访客点击关闭后仅本次刷新内隐藏，刷新后重新出现。

## 管理密码

`assets/site.config.json` 的 `admin.password`（默认空），或在后台「GitHub 同步 → 访问密码与边界」中设置。设置后进入 `/admin.html` 需先输入密码解锁。注意：静态站点为轻量保护，此密码保存在公开的配置文件中，并非强安全机制。

## 管理页 GitHub 与凭据

管理页支持记住 Fine-grained PAT：在「GitHub 同步」页签勾选「记住凭据」后，Owner / Repository / Branch / Token 会保存在本机 `localStorage`，下次进入 `/admin.html` 时自动填充并尝试连接 GitHub（状态徽标显示「已认证：用户名」）。令牌不会上传到任何服务器，仅在本机浏览器中保存；请勿在公共设备上勾选。

「文章管理」页签新增「删除文章」按钮：已连接 GitHub 时，会同时删除仓库中的 `posts/<slug>.md` 并从 `posts/posts.json` 索引移除；未连接时仅从本地会话移除。

## 评论

在 GitHub 开启 Discussions，去 giscus.app 获取 repoId / categoryId 后填入 `comments`。Giscus 卡片内的「保存 Giscus 配置」按钮可直接把评论配置提交到 GitHub。

## Material You 动态颜色

`theme.dynamicColor = true` 时，会从 `theme.background.image` 采样种子色，并生成浅色/深色 Material 色彩角色。

背景图片只是个性化输入。新版默认把图片透明度降到约 5%–7%，避免把 Material You 做成大面积毛玻璃背景。

## 评论

在 GitHub 开启 Discussions，去 giscus.app 获取 repoId / categoryId 后填入 `comments`。

## 点赞

默认 `likes.mode = auto`。没有 D1 时自动回退到 localStorage；绑定名为 `DB` 的 D1 后自动使用全站计数。

## Service Worker

本版缓存名为 `chuyuan-blog-m3-v3`，用于与旧版缓存区分。
