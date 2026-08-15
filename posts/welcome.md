# 欢迎来到新版初源博文

这是一篇**示例文章**。确认页面、文章和评论区都正常以后，可以在 `admin.html` 中删除或改写。

## 这次视觉上改了什么

新版不再把 Material You 理解成毛玻璃和渐变，而是用动态颜色生成真正的 Material 3 色彩角色，再用这些角色组织页面的层级。

- 页面主体使用 Surface 系列颜色，而不是透明玻璃
- 搜索、筛选、按钮和卡片分别使用对应的容器角色
- 阴影只用于真正需要抬升的交互状态
- 背景图片主要负责个性化取色，只保留非常轻的环境感
- 排版按 Display、Headline、Title、Body、Label 分层

## 动态取色

默认仍使用 `images/cover01.jpeg`。主题引擎会从图片采样种子色，并优先使用 Material Color Utilities 生成浅色和深色配色；加载失败时会使用本地 fallback。

## 一段代码

```js
const blog = "初源博文";
console.log(`${blog} is ready.`);
```

## 下一步

可以打开 `admin.html` 改首页文案、背景、文章和 Giscus 配置。
