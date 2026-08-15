# 初源博文详细配置手册

这份说明按“先能用，再逐步增强”的顺序写。你不需要一次把所有功能都配置完。

---

## 1. Cloudflare Pages 基础部署

你的仓库已经由 Cloudflare Pages 托管，因此最简单的方式仍然是 **GitHub → Cloudflare Pages 自动部署**。

这个版本没有 npm 依赖，也没有构建产物目录：HTML、CSS、JavaScript 和 Markdown 都直接位于仓库中。

### 建议

- Framework preset：`None`
- Build command：保持为空 / 不执行构建
- 发布内容：仓库根目录
- Production branch：`main`

如果你现有 Pages 项目已经能正常发布原仓库，不要为了这个版本重新建项目；直接 push 新代码即可。

### Pages Functions 注意

只有“全站点赞”使用 `functions/api/likes.js`。Cloudflare 官方当前说明 Pages Functions 可以随 Git provider 项目部署，并可绑定 D1；Dashboard 的 Direct Upload 不支持 Functions。因此如果要用全站点赞，继续保持 GitHub 连接部署最省事。

---

## 2. 主配置文件

主要配置都在：

```text
assets/site.config.json
```

也可以打开：

```text
/admin.html
```

通过可视化表单修改并导出，或连接 GitHub 后直接提交。

### 2.1 站点信息

```json
"site": {
  "name": "初源博文",
  "shortName": "初源",
  "tagline": "SEEKING THE TRUTH",
  "author": "瓜子920",
  "description": "...",
  "language": "zh-CN",
  "copyright": "© 2026 瓜子920 · 初源博文",
  "email": "..."
}
```

### 2.2 首页文案

```json
"home": {
  "eyebrow": "个人博客",
  "title": "初韵绘明熙，\n求真映本源。",
  "intro": "...",
  "chips": ["高精度中字嵌字", "美术生", "Alight Motion"]
}
```

`title` 中 `\n` 会在首页显示为换行。

---

## 3. Material You 动态取色

核心配置：

```json
"theme": {
  "defaultMode": "system",
  "dynamicColor": true,
  "seedColor": "#6750A4",
  "source": "background"
}
```

### `defaultMode`

可选：

- `system`：跟随系统
- `light`：默认浅色
- `dark`：默认深色

访客点击顶部主题按钮后，会在浏览器本地记住自己的选择。

### `dynamicColor`

为 `true` 时，如果 `source` 是 `background`，主题引擎会：

1. 加载背景图；
2. 缩小采样；
3. 对更有颜色信息的像素加权；
4. 得到种子色；
5. 尝试使用 Material Color Utilities 生成浅色 / 深色 scheme；
6. 如果外部模块加载失败，改用本地 fallback scheme。

页面根节点会显示两个调试属性：

```text
data-seed-color
data-color-engine
```

其中 `data-color-engine` 正常情况下是 `material-color-utilities`，回退时为 `fallback`。

> 如果你使用第三方远程背景图片，对方服务器必须允许 CORS 才能被 Canvas 读取颜色。最稳妥的方法是把背景图放在本仓库 `images/` 内，这样既没有跨域问题，也更快。

---

## 4. 自定义背景图

配置：

```json
"background": {
  "enabled": true,
  "image": "images/cover01.jpeg",
  "position": "center center",
  "size": "cover",
  "blur": 10,
  "opacityLight": 0.16,
  "opacityDark": 0.19,
  "overlayLight": 0.78,
  "overlayDark": 0.76
}
```

### 参数解释

- `image`：仓库相对路径或支持 CORS 的 URL
- `position`：CSS `background-position`
- `size`：通常保持 `cover`
- `blur`：背景模糊像素
- `opacityLight / opacityDark`：背景层整体可见度
- `overlayLight / overlayDark`：浅 / 深色下覆盖层强度

### 推荐做法

打开 `/admin.html` → “站点与外观” → 选择背景图片。

- 未连接 GitHub：只做本地即时预览和动态取色；
- 已连接 GitHub：可直接上传为 `images/background.xxx` 并自动更新配置。

---

## 5. 评论：GitHub Discussions + Giscus

Giscus 很适合静态博客，因为评论内容保存在 GitHub Discussions，不需要自建评论数据库。

### 5.1 在 GitHub 开启 Discussions

进入：

```text
GitHub 仓库 → Settings → General → Features → Discussions
```

启用 Discussions。

### 5.2 配置 Giscus

打开：

```text
https://giscus.app/zh-CN
```

按页面检查仓库资格并安装 Giscus App，然后选择：

- Repository：`GZ-920/Blog`
- Discussion mapping：可以使用任意方式生成配置；本项目运行时固定用 `specific`
- Discussion category：建议新建 `Blog comments` 或使用 `Announcements`
- Reaction：可开启

生成配置后重点复制：

- `data-repo-id`
- `data-category`
- `data-category-id`

填进 `assets/site.config.json`：

```json
"comments": {
  "enabled": true,
  "provider": "giscus",
  "repo": "GZ-920/Blog",
  "repoId": "R_kgDOxxxxxxxx",
  "category": "Blog comments",
  "categoryId": "DIC_kwDOxxxxxxxx",
  "mapping": "specific",
  "reactionsEnabled": "1",
  "emitMetadata": "0",
  "inputPosition": "top",
  "lang": "zh-CN",
  "loading": "lazy"
}
```

### 为什么使用 `specific`

文章 URL 是：

```text
article.html?post=welcome
```

为了以后即使改域名、改路由也尽量不丢评论，本项目给每篇文章生成稳定 term：

```text
post:welcome
```

这样评论与文章 slug 绑定，而不是与完整 URL 绑定。

### 评论管理

直接去 GitHub Discussions 管理即可。Giscus 官方也支持访客通过 GitHub OAuth 评论，并由仓库所有者在 GitHub 管理讨论。

---

## 6. 点赞模式

配置：

```json
"likes": {
  "enabled": true,
  "mode": "auto",
  "endpoint": "/api/likes"
}
```

### `mode = local`

完全静态。

- 点赞状态保存在访客自己的 `localStorage`
- 不同设备之间不共享
- 不需要任何 Cloudflare 数据库

### `mode = auto`（推荐）

先尝试 `/api/likes`：

- D1 正常 → 全站统一点赞数
- API 不存在 / D1 未绑定 → 自动回退到本地点赞

因此即使你暂时不配置 D1，网站也不会报错。

### `mode = global`

只允许全站 API。接口失败时不回退。

---

## 7. 配置 Cloudflare D1 全站点赞

项目已经包含：

```text
functions/api/likes.js
schema.sql
```

Pages Function 使用的 D1 binding 名称固定为：

```text
DB
```

### 7.1 创建 D1 数据库

可以在 Cloudflare Dashboard 创建，例如命名：

```text
blog-data
```

也可以用 Wrangler：

```bash
npx wrangler d1 create blog-data
```

### 7.2 初始化数据库

最简单的方法是在 D1 控制台执行 `schema.sql`：

```sql
CREATE TABLE IF NOT EXISTS likes (
  post TEXT NOT NULL,
  client_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (post, client_id)
);
CREATE INDEX IF NOT EXISTS idx_likes_post ON likes(post);
```

也可以用 Wrangler：

```bash
npx wrangler d1 execute blog-data --remote --file=schema.sql
```

### 7.3 给 Pages 项目绑定 D1

Cloudflare 官方 Dashboard 路径目前是：

```text
Workers & Pages
→ 你的 Pages 项目
→ Settings
→ Bindings
→ Add
→ D1 database bindings
```

设置：

```text
Variable name: DB
D1 database: blog-data
```

保存后 **重新部署** Pages 项目，binding 才会生效。

### 7.4 验证

打开：

```text
/admin.html → 部署检查
```

如果显示：

```text
全站点赞 API ✓ Pages Function + D1 已响应
```

说明成功。

也可以访问类似：

```text
/api/likes?post=welcome&client=00000000-0000-4000-8000-000000000000
```

应返回 JSON。

### 7.5 Wrangler 配置（可选）

Cloudflare 目前支持 `wrangler.jsonc` / `wrangler.toml` 配置 Pages binding；官方建议已有 Pages 项目优先从 Dashboard 下载现有配置再修改，而不是盲目覆盖。

仓库附带：

```text
wrangler.jsonc.example
```

复制后务必替换项目名和 D1 ID。**如果你已经在 Dashboard 配好了 Pages，不必为了点赞强行加入 wrangler 文件。**

---

## 8. 管理工作台

打开：

```text
/admin.html
```

包含四部分：

### 8.1 站点与外观

可以修改：

- 站点名称
- 英文副标题
- 首页大标题
- 首页简介
- 首页标签
- 默认主题
- Material You 动态取色
- 备用种子色
- 背景图
- 背景模糊
- Giscus 参数

### 8.2 文章管理

支持：

- 新建文章
- 编辑文章元数据
- 编辑 Markdown
- 实时预览
- 下载 Markdown
- 下载 `posts.json`
- 连接 GitHub 后直接 commit

### 8.3 GitHub 同步

填写：

- Owner：`GZ-920`
- Repository：`Blog`
- Branch：`main`
- Fine-grained PAT

然后点“测试连接”。

#### 推荐的 Fine-grained PAT 权限

在 GitHub 创建 Fine-grained personal access token：

- Repository access：只选择 `GZ-920/Blog`
- Repository permissions：
  - Contents: `Read and write`
  - Metadata: GitHub 默认需要的读取权限即可

不需要 Issues、Actions、Administration 等高权限。

令牌不会被保存到：

- `localStorage`
- `sessionStorage`
- `site.config.json`
- Git 仓库

刷新页面后需要重新输入。

### 8.4 部署检查

会检查：

- `site.config.json`
- `posts/posts.json`
- 背景图
- Giscus 配置完整度
- `/api/likes`
- 当前动态主题引擎

---

## 9. 手工添加文章

每篇文章由两部分组成。

### 9.1 Markdown

例如：

```text
posts/my-post.md
```

### 9.2 posts.json 元数据

在数组中加入：

```json
{
  "file": "my-post",
  "cat": "tech",
  "category": "折腾一些小东西",
  "log": "DEVLOG",
  "title": "文章标题",
  "desc": "文章摘要",
  "date": "2026-08-15",
  "time": "5 min",
  "cover": "images/cover01.jpeg",
  "featured": false,
  "tags": ["标签1", "标签2"]
}
```

`file` 不要带 `.md`。

### 分类

目前首页会根据文章数据自动生成分类按钮，不再要求你手工改 `index.html`。

`cat` 只是内部代码，可以继续使用：

- `music`
- `essay`
- `tech`

也可以新增其它代码，例如 `art`。只要 `category` 写上显示名称即可。

---

## 10. Markdown 支持

为了避免依赖在线 Markdown CDN，本项目带了一个轻量本地渲染器。

支持：

- H1-H4 标题
- 段落
- 粗体 / 斜体 / 删除线
- 行内代码
- 代码块
- 引用
- 有序 / 无序列表
- 链接
- 图片
- 分隔线

如果以后需要完整 GFM 表格、脚注、数学公式等，可以再换成 `marked` / `markdown-it` / `KaTeX`，但那会增加第三方依赖。

---

## 11. 自定义 Material 3 外观

主要 CSS 在：

```text
assets/style.css
```

常用变量：

```css
--radius-s
--radius-m
--radius-l
--radius-xl
--max
--edge
--glass
--shadow-1
--shadow-2
```

动态主题会生成：

```css
--md-primary
--md-on-primary
--md-primary-container
--md-secondary
--md-tertiary
--md-surface
--md-on-surface
--md-outline
...
```

因此如果你自己新增组件，尽量使用这些 `--md-*` 色彩角色，不要直接写死紫色、蓝色等，这样换背景时新组件也能自动跟着取色。

---

## 12. PWA 与缓存

`sw.js` 会缓存：

- 首页
- 关于页
- 文章页壳
- 样式 / JS
- 配置
- 文章索引

对于 `posts/` 和 `site.config.json` 使用网络优先策略，因此更新文章后不会长期卡在旧缓存。

如果你大改了缓存逻辑，可以修改：

```js
const CACHE='chuyuan-blog-v2';
```

例如改成 `v3`，浏览器会在 Service Worker 激活时清理旧缓存。

---

## 13. 常见问题

### Q1：为什么评论没有出现？

检查：

1. GitHub Discussions 是否开启；
2. 是否安装 Giscus App；
3. `comments.enabled` 是否为 `true`；
4. `repoId` 和 `categoryId` 是否填写；
5. 仓库是否公开，或 Giscus 是否对目标仓库有权限。

### Q2：为什么点赞只在我自己的浏览器变化？

说明 `/api/likes` 没有启用，`auto` 自动回退到了本地模式。去 Cloudflare 建 D1 并绑定变量 `DB`。

### Q3：背景显示了，但没有从图片取色？

如果是第三方 URL，通常是 CORS 导致 Canvas 无法读取像素。把图片放到本仓库 `images/` 下最稳。

### Q4：为什么 admin.html 没有密码？

因为静态网页里的密码不能构成安全边界。真正的写权限由 GitHub PAT 控制。

### Q5：管理页提交后为什么网站没有立刻变化？

管理页是先 commit 到 GitHub，然后由 Cloudflare Pages Git 集成触发重新部署。等待 Pages deployment 完成即可。

### Q6：怎样彻底保持“纯静态”？

保持：

```json
"likes": { "mode": "local" }
```

评论可以开 Giscus，因为它是客户端嵌入的第三方服务，不需要你的 Cloudflare 项目运行后端。

`functions/` 和 `schema.sql` 可以保留不用，也可以删除。

---

## 14. 推荐上线顺序

1. 先直接部署新版，确认首页 / 文章 / 关于页正常；
2. 在 `admin.html` 换背景与主题；
3. 删除或改写两篇示例文章；
4. 配置 Giscus；
5. 如果需要统一点赞数，再配置 D1；
6. 最后再考虑自定义域名、Cloudflare Web Analytics、Access 等附加功能。

---

## 15. 参考资料

- Cloudflare Pages Functions  
  https://developers.cloudflare.com/pages/functions/
- Pages Functions Bindings  
  https://developers.cloudflare.com/pages/functions/bindings/
- Pages Wrangler Configuration  
  https://developers.cloudflare.com/pages/functions/wrangler-configuration/
- Cloudflare D1  
  https://developers.cloudflare.com/d1/
- Giscus  
  https://giscus.app/zh-CN
- Material Color Utilities  
  https://github.com/material-foundation/material-color-utilities
