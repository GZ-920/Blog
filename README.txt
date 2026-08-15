初源博文配置加载修复

当前故障根因：
GitHub main 分支的 assets/site.config.json 中 home.chips 数组缺少逗号，文件不是合法 JSON。

必须做：
1. 用本包 assets/site.config.json 覆盖仓库中的 assets/site.config.json。
2. 提交到 main，等待 Cloudflare Pages 部署。
3. 部署后 Ctrl+F5 强制刷新。

可选增强：
在仓库根目录运行：python patch-shared.py
它只修改 assets/shared.js 的 loadConfig，让未来 JSON 损坏时显示明确的 JSON 格式错误。

本次保留的首页标签：
高精度中字嵌字、美术生、Alight Motion、AI、刷机、解锁、C++
