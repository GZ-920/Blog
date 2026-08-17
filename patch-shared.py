from pathlib import Path
p=Path('assets/shared.js')
s=p.read_text(encoding='utf-8')
old='''export async function loadConfig(cacheBust=false) {
  const url = cacheBust ? `${CONFIG_URL}?t=${Date.now()}` : CONFIG_URL;
  const res = await fetch(url, { cache: cacheBust ? "no-store" : "default" });
  if (!res.ok) throw new Error(`site.config.json 加载失败 (HTTP ${res.status})`);
  return res.json();
}'''
new='''export async function loadConfig(cacheBust=false) {
  const url = cacheBust ? `${CONFIG_URL}?t=${Date.now()}` : CONFIG_URL;
  const res = await fetch(url, { cache: cacheBust ? "no-store" : "default" });
  if (!res.ok) throw new Error(`site.config.json 加载失败 (HTTP ${res.status})`);
  const text = await res.text();
  try {
    const config = JSON.parse(text);
    if (!config || typeof config !== "object" || Array.isArray(config)) throw new Error("根节点必须是对象");
    return config;
  } catch (error) {
    throw new Error(`site.config.json JSON 格式错误：${error?.message || error}`);
  }
}'''
if old not in s:
    raise SystemExit('未找到预期的 loadConfig 代码；shared.js 可能已被修改。仅覆盖 site.config.json 也可修复当前故障。')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print('assets/shared.js 已增加 JSON 错误诊断。')
