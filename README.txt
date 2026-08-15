初源博文 home.chips 修复

推荐方式：
1. 用压缩包中的 assets/main.js 覆盖仓库 assets/main.js。
2. 在仓库根目录运行：python patch-admin.py
   它只修改 assets/admin.js 中 home.chips 的兼容逻辑，不会覆盖你后续做的 GitHub 403 等其它改动。
3. 确认 assets/site.config.json 的 home.chips 是 JSON 数组，例如：
   "chips": ["高精度中字嵌字", "美术生", "Alight Motion", "刷机", "解锁", "C++"]
4. 提交到 main，等待 Cloudflare Pages 部署。
5. 部署后强制刷新（Ctrl+F5）。

修复内容：
- main.js：home.chips 支持数组、逗号字符串、中文逗号字符串和换行字符串。
- main.js：文章 tags 同样增加兼容，防止类似 .map / spread 错误。
- admin.js：fillConfigForm 遇到字符串 chips 不再调用 .join()。
- admin.js：保存时继续强制将 chips 写回数组，并增加换行分隔支持。
