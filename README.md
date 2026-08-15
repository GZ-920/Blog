# 初源博文 · Material 3 重设计版

这是针对 `GZ-920/Blog` 的纯静态 Material 3 / Material You 重设计版本。

这次重点不是增加更多视觉特效，而是把 UI 从“玻璃拟态模板”调整为更接近 Material 3 的结构：

- 使用 Primary / Secondary / Tertiary / Surface 等语义色角色
- 使用 Surface Container 层级表达容器关系，基本取消毛玻璃
- 阴影只在需要抬升的交互状态出现
- 首页改为内容主导的双栏 Hero，不再展示“Material You 功能介绍卡”
- 搜索栏、筛选 Chip、按钮、文章卡按 Material 3 的组件逻辑重做
- 排版按 Display / Headline / Title / Body / Label 建立层级
- 保留背景图动态取色，但背景图片本身只以极低透明度出现
- 动效使用短、克制的 Material 风格缓动，并支持 reduced motion
- 文章页、关于页和管理页统一使用相同 Surface/Shape 体系

## 部署

Cloudflare Pages 继续发布仓库根目录即可：

- Framework preset：None
- Root directory：留空
- Build output directory：`.`
- Production branch：`main`

如你的 Pages 项目已经能正常发布，不需要重建项目。

## 主要配置

`assets/site.config.json`

## 管理页

`/admin.html`

## 动态取色

默认从 `images/cover01.jpeg` 采样种子色。优先加载 `@material/material-color-utilities`，失败时自动使用本地调色算法。
