from pathlib import Path
p=Path('assets/admin.js')
s=p.read_text(encoding='utf-8')
old="""    if(input.type==='checkbox') input.checked=!!v;\n    else if(input.name==='home.chips') input.value=(v||[]).join(', ');\n    else input.value=v??'';"""
new="""    if(input.type==='checkbox') input.checked=!!v;\n    else if(input.name==='home.chips') input.value=Array.isArray(v)?v.join(', '):String(v??'');\n    else input.value=v??'';"""
if old not in s:
    raise SystemExit('未找到预期的 fillConfigForm 代码；请确认 admin.js 来自当前 main 分支。')
s=s.replace(old,new,1)
# readConfigForm already converts home.chips to an array; keep it, but allow newline-separated values too.
s=s.replace("String(v).split(/[,，]/).map(s=>s.trim()).filter(Boolean)","String(v).split(/[,，\\n]/).map(s=>s.trim()).filter(Boolean)")
p.write_text(s,encoding='utf-8')
print('assets/admin.js 已修复')
