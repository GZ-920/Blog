# 欢迎来到新版初源博文

这是一篇**示例文章**。它的目的不是替你写博客内容，而是让部署后的首页立刻有可测试的文章卡片。确认一切正常后，你可以在 `admin.html` 中删除或改写它。

## 现在已经有什么

- Material You 风格界面与浅色 / 深色 / 跟随系统主题
- 从背景图片提取种子色并生成动态配色
- 首页搜索、分类筛选与响应式文章卡片
- Markdown 文章、自动目录、阅读进度、代码复制与分享
- 点赞：纯静态模式自动回退到浏览器本地；接入 Cloudflare D1 后变成全站计数
- 评论：使用 GitHub Discussions + Giscus
- 管理工作台：编辑站点配置、文章和背景，并可直接提交回 GitHub
- PWA / Service Worker 基础离线缓存

## 动态取色

默认背景使用仓库里原有的 `images/cover01.jpeg`。主题引擎会尝试从图片采样主色，再调用 Material Color Utilities 生成 Material 3 色彩角色；如果 CDN 不可用，则会自动使用内置配色算法作为回退。

> 想换背景，只需要打开 `admin.html`，选择图片并预览。连接 GitHub 后还可以直接把图片上传到仓库。

## 一段代码示例

```js
const hello = "初源博文";
console.log(`${hello} is ready.`);
```

## 下一步

先打开根目录的 `CONFIGURATION.md`。如果你只想维持完全纯静态，什么额外服务都不需要；如果想让所有访客看到统一点赞数，再按文档创建一个 Cloudflare D1 数据库即可。
