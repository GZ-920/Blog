# 稳定恢复包说明

本包以此前保存的 `GZ-920-Blog-MaterialYou-Enhanced.zip` 稳定完整版本为基线重新生成，**没有使用当前 GitHub 仓库中的源码或配置作为基线**。

已合并修复：

1. Cloudflare Pages `/admin` 重定向循环：移除 `/admin /admin.html 200` 自定义重写。
2. Service Worker：升级缓存版本，后台不缓存，重定向响应不写入缓存。
3. `home.chips`：前台兼容数组/逗号字符串/换行字符串；后台始终写回 JSON 数组。
4. 文章 `tags`：同样加入字符串/数组兼容，避免 `.map is not a function`。
5. GitHub 后台：PAT 测试改为验证已认证用户；写入 403/401 等错误显示 GitHub message 和 Request ID。
6. `/admin` 增加 noindex，并将首页后台入口改为 `/admin`。

部署建议：

- 建议将当前 GitHub 仓库内容完整备份后，删除/覆盖旧文件，再上传本包 `Blog/` 目录中的全部内容。
- Cloudflare Pages 部署后后台使用 `https://你的域名/admin`。
- 第一次部署后建议浏览器强制刷新一次；新 Service Worker 激活时会清理旧缓存。
- PAT 不要写入 `site.config.json`，只在 admin 页面临时填写。
