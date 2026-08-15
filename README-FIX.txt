后台重定向循环修复

覆盖仓库根目录中的以下文件：
_redirects
_headers
sw.js
assets/shared.js

部署完成后直接访问：
https://你的域名/admin

不要再在 _redirects 中添加：
/admin /admin.html 200

Cloudflare Pages 会自动把 admin.html 映射到 /admin。
