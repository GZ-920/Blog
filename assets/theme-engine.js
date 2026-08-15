const MATERIAL_UTILS_URL = "https://cdn.jsdelivr.net/npm/@material/material-color-utilities@0.3.0/+esm";

function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }
function safeCssUrl(value) { return String(value || "").replace(/["\\\n\r]/g, (m) => `\\${m}`); }

function hexToRgb(hex) {
  const clean = String(hex || "#6750A4").replace("#", "").trim();
  const full = clean.length === 3 ? clean.split("").map(c => c + c).join("") : clean.padEnd(6, "0").slice(0, 6);
  const num = Number.parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}
function rgbToHex({r,g,b}) { return `#${[r,g,b].map(v => clamp(Math.round(v),0,255).toString(16).padStart(2,"0")).join("")}`.toUpperCase(); }
function rgbToHsl({r,g,b}) {
  r/=255; g/=255; b/=255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b), d=max-min;
  let h=0;
  if (d) {
    if (max===r) h=((g-b)/d)%6;
    else if (max===g) h=(b-r)/d+2;
    else h=(r-g)/d+4;
    h*=60; if (h<0) h+=360;
  }
  const l=(max+min)/2;
  const s=d===0?0:d/(1-Math.abs(2*l-1));
  return {h,s:s*100,l:l*100};
}
function hsl(h,s,l){ return `hsl(${Math.round(h)} ${clamp(s,0,100).toFixed(1)}% ${clamp(l,0,100).toFixed(1)}%)`; }

function fallbackScheme(seed, dark=false) {
  const {h,s} = rgbToHsl(hexToRgb(seed));
  const sat = clamp(Math.max(s, 42), 38, 78);
  const sh = (h + 28) % 360;
  const th = (h + 325) % 360;
  if (!dark) return {
    primary:hsl(h,sat,40), onPrimary:"#ffffff", primaryContainer:hsl(h,sat*.75,90), onPrimaryContainer:hsl(h,sat*.7,16),
    secondary:hsl(sh,clamp(sat*.42,24,44),40), onSecondary:"#ffffff", secondaryContainer:hsl(sh,clamp(sat*.35,18,38),90), onSecondaryContainer:hsl(sh,30,16),
    tertiary:hsl(th,clamp(sat*.5,28,52),40), onTertiary:"#ffffff", tertiaryContainer:hsl(th,clamp(sat*.45,24,48),90), onTertiaryContainer:hsl(th,35,16),
    surface:hsl(h,8,98), surfaceContainerLow:hsl(h,10,96), surfaceContainer:hsl(h,11,94), surfaceContainerHigh:hsl(h,12,92),
    onSurface:hsl(h,12,11), onSurfaceVariant:hsl(h,9,29), outline:hsl(h,8,48), outlineVariant:hsl(h,10,80), inverseSurface:hsl(h,10,20), inverseOnSurface:hsl(h,8,95), error:"#BA1A1A"
  };
  return {
    primary:hsl(h,clamp(sat*.72,42,65),80), onPrimary:hsl(h,sat*.65,20), primaryContainer:hsl(h,sat*.6,30), onPrimaryContainer:hsl(h,sat*.72,90),
    secondary:hsl(sh,clamp(sat*.36,20,36),80), onSecondary:hsl(sh,25,20), secondaryContainer:hsl(sh,25,30), onSecondaryContainer:hsl(sh,28,90),
    tertiary:hsl(th,clamp(sat*.4,24,42),80), onTertiary:hsl(th,28,20), tertiaryContainer:hsl(th,28,30), onTertiaryContainer:hsl(th,34,90),
    surface:hsl(h,7,10), surfaceContainerLow:hsl(h,8,12), surfaceContainer:hsl(h,8,14), surfaceContainerHigh:hsl(h,8,17),
    onSurface:hsl(h,9,90), onSurfaceVariant:hsl(h,8,78), outline:hsl(h,7,58), outlineVariant:hsl(h,8,30), inverseSurface:hsl(h,8,90), inverseOnSurface:hsl(h,8,20), error:"#FFB4AB"
  };
}

const tokenMap = {
  primary:"--md-primary", onPrimary:"--md-on-primary", primaryContainer:"--md-primary-container", onPrimaryContainer:"--md-on-primary-container",
  secondary:"--md-secondary", onSecondary:"--md-on-secondary", secondaryContainer:"--md-secondary-container", onSecondaryContainer:"--md-on-secondary-container",
  tertiary:"--md-tertiary", onTertiary:"--md-on-tertiary", tertiaryContainer:"--md-tertiary-container", onTertiaryContainer:"--md-on-tertiary-container",
  surface:"--md-surface", surfaceContainerLow:"--md-surface-container-low", surfaceContainer:"--md-surface-container", surfaceContainerHigh:"--md-surface-container-high",
  onSurface:"--md-on-surface", onSurfaceVariant:"--md-on-surface-variant", outline:"--md-outline", outlineVariant:"--md-outline-variant",
  inverseSurface:"--md-inverse-surface", inverseOnSurface:"--md-inverse-on-surface", error:"--md-error"
};

function schemeCss(selector, scheme) {
  const pairs = Object.entries(tokenMap).filter(([key]) => scheme[key] != null).map(([key, css]) => `${css}:${scheme[key]};`).join("");
  return `${selector}{${pairs}}`;
}

async function materialSchemes(seed) {
  try {
    const mod = await import(MATERIAL_UTILS_URL);
    if (!mod.themeFromSourceColor || !mod.argbFromHex || !mod.hexFromArgb) throw new Error("Material utilities API unavailable");
    const theme = mod.themeFromSourceColor(mod.argbFromHex(seed));
    const convert = (scheme) => {
      const json = scheme.toJSON ? scheme.toJSON() : scheme.props || {};
      const out = {};
      for (const [key, val] of Object.entries(json)) out[key] = typeof val === "number" ? mod.hexFromArgb(val) : val;
      return out;
    };
    return { light: convert(theme.schemes.light), dark: convert(theme.schemes.dark), engine: "material-color-utilities" };
  } catch (error) {
    console.info("Material Color Utilities unavailable, using local fallback palette.", error?.message || error);
    return { light: fallbackScheme(seed, false), dark: fallbackScheme(seed, true), engine: "fallback" };
  }
}

export async function extractSeedFromImage(src) {
  if (!src) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const timer = setTimeout(() => resolve(null), 5500);
    img.onload = () => {
      clearTimeout(timer);
      try {
        const canvas = document.createElement("canvas");
        const size = 32;
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently:true });
        ctx.drawImage(img,0,0,size,size);
        const data = ctx.getImageData(0,0,size,size).data;
        let rr=0,gg=0,bb=0,wSum=0;
        for(let i=0;i<data.length;i+=4){
          const a=data[i+3]/255; if(a<.25) continue;
          const rgb={r:data[i],g:data[i+1],b:data[i+2]};
          const {s,l}=rgbToHsl(rgb);
          if(l<8 || l>94) continue;
          const weight=a*(0.55+s/100*1.45);
          rr+=rgb.r*weight; gg+=rgb.g*weight; bb+=rgb.b*weight; wSum+=weight;
        }
        if(!wSum) return resolve(null);
        resolve(rgbToHex({r:rr/wSum,g:gg/wSum,b:bb/wSum}));
      } catch { resolve(null); }
    };
    img.onerror = () => { clearTimeout(timer); resolve(null); };
    img.src = src;
  });
}

export function applyBackground(config, imageOverride=null) {
  const bg = config?.theme?.background || {};
  const root = document.documentElement;
  const src = imageOverride || bg.image || "";
  if (bg.enabled === false || !src) root.style.setProperty("--background-image", "none");
  else root.style.setProperty("--background-image", `url("${safeCssUrl(src)}")`);
  root.style.setProperty("--background-position", bg.position || "center center");
  root.style.setProperty("--background-size", bg.size || "cover");
  root.style.setProperty("--background-blur", `${clamp(Number(bg.blur ?? 10),0,50)}px`);
}

export function syncBackgroundForMode(config, dark) {
  const bg = config?.theme?.background || {};
  document.documentElement.style.setProperty("--background-opacity", String(dark ? (bg.opacityDark ?? .19) : (bg.opacityLight ?? .16)));
  document.documentElement.style.setProperty("--background-overlay", String(dark ? (bg.overlayDark ?? .76) : (bg.overlayLight ?? .78)));
}

export async function applyDynamicTheme(config, imageOverride=null) {
  applyBackground(config, imageOverride);
  let seed = config?.theme?.seedColor || "#6750A4";
  const sourceImage = imageOverride || config?.theme?.background?.image;
  if (config?.theme?.dynamicColor !== false && config?.theme?.source === "background" && sourceImage) {
    seed = await extractSeedFromImage(sourceImage) || seed;
  }
  const schemes = await materialSchemes(seed);
  let style = document.getElementById("dynamic-material-theme");
  if (!style) { style = document.createElement("style"); style.id="dynamic-material-theme"; document.head.appendChild(style); }
  style.textContent = schemeCss(":root, :root[data-theme='light']", schemes.light) + schemeCss(":root[data-theme='dark']", schemes.dark);
  document.documentElement.dataset.seedColor = seed;
  document.documentElement.dataset.colorEngine = schemes.engine;
  return { seed, ...schemes };
}
