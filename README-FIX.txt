GZ-920 / Blog：主页头图自然比例 + 横幅通知

覆盖仓库同路径文件即可：
- index.html
- admin.html
- sw.js
- assets/main.js
- assets/admin.js
- assets/style.css
- assets/site.config.json

本次修改：
1. 主页文章头图/封面取消固定 16:9 / 16:7 比例，按原图比例完整显示，不再裁切。
2. 新增主页横幅通知，可在 /admin → 站点与外观 中配置：
   - 启用/关闭
   - 通知内容
   - 可选链接文字
   - 可选链接 URL
   - 是否允许访客关闭
3. 横幅默认关闭，不会覆盖后立刻显示。
4. 保留 home.chips 数组/字符串兼容修复。
5. Service Worker 缓存升级为 v3，避免旧 CSS/JS 残留。
