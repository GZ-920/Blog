(() => {
  "use strict";

  // ====== 配置仓库（与 article.html 保持一致） ======
  const BASE = "./posts/";
  // ==============================================

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const reduceTransparency = window.matchMedia("(prefers-reduced-transparency: reduce)").matches;

  /* ---------- 主题 ---------- */
  const root = document.documentElement;
  const THEME_KEY = "sp-theme";

  function applyTheme(t) {
    if (t === "light") root.setAttribute("data-theme", "light");
    else root.removeAttribute("data-theme");
  }

const stored = localStorage.getItem(THEME_KEY);

if (stored) {
    applyTheme(stored);
} else {
    applyTheme("light");
}

  const toggleBtn = document.querySelector("[data-theme-toggle]");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const isLight = root.getAttribute("data-theme") === "light";
      const next = isLight ? "dark" : "light";
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next);
      if (!reduceMotion) {
        toggleBtn.animate(
          [{ transform: "scale(0.85)" }, { transform: "scale(1)" }],
          { duration: 260, easing: "cubic-bezier(.34,1.4,.4,1)" }
        );
      }
    });
  }

  /* ---------- 导航毛玻璃 ---------- */
  const nav = document.querySelector(".site-nav");
  if (nav) {
    const onScroll = () => {
      nav.classList.toggle("is-scrolled", window.scrollY >= 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- 滚动揭示 ---------- */
  const revealTargets = document.querySelectorAll("[data-reveal]");
  if (revealTargets.length) {
    if (reduceMotion) {
      revealTargets.forEach((el) => el.classList.add("is-visible"));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
              const el = entry.target;
              const delay = Math.min(i * 40, 200);
              setTimeout(() => el.classList.add("is-visible"), delay);
              io.unobserve(el);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
      );
      revealTargets.forEach((el) => io.observe(el));
    }
  }

  /* ---------- 分段筛选（弹簧动画） ---------- */
  const segmented = document.querySelector("[data-segmented]");
  if (segmented) {
    const thumb = segmented.querySelector(".thumb");
    const buttons = Array.from(segmented.querySelectorAll("button"));
    const cards = Array.from(document.querySelectorAll(".post-card[data-cat]"));

    let current = { x: 0, w: 0 };
    let target = { x: 0, w: 0 };
    let velocity = { x: 0, w: 0 };
    let raf = null;

    function measure(btn) {
      const bRect = btn.getBoundingClientRect();
      const sRect = segmented.getBoundingClientRect();
      return { x: bRect.left - sRect.left - 4, w: bRect.width };
    }

    function placeInstant(btn) {
      const m = measure(btn);
      current = { ...m };
      target = { ...m };
      thumb.style.width = m.w + "px";
      thumb.style.transform = `translateX(${m.x}px)`;
    }

    function springStep() {
      const stiffness = 0.12;
      const damping = 0.62;
      let settled = true;
      ["x", "w"].forEach((key) => {
        const delta = target[key] - current[key];
        if (Math.abs(delta) > 0.15 || Math.abs(velocity[key]) > 0.15) settled = false;
        const acc = delta * stiffness;
        velocity[key] = velocity[key] * damping + acc;
        current[key] += velocity[key];
      });
      thumb.style.width = current.w + "px";
      thumb.style.transform = `translateX(${current.x}px)`;
      if (!settled) {
        raf = requestAnimationFrame(springStep);
      } else {
        current = { ...target };
        thumb.style.width = current.w + "px";
        thumb.style.transform = `translateX(${current.x}px)`;
        raf = null;
      }
    }

    function animateTo(btn) {
      target = measure(btn);
      if (reduceMotion) {
        placeInstant(btn);
        return;
      }
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(springStep);
    }

    function filterCards(cat) {
      cards.forEach((card) => {
        const match = cat === "all" || card.dataset.cat === cat;
        card.classList.toggle("is-filtered-out", !match);
      });
    }

    buttons.forEach((btn) => {
      btn.addEventListener("pointerdown", () => btn.classList.add("is-pressed"));
      btn.addEventListener("pointerup", () => btn.classList.remove("is-pressed"));
      btn.addEventListener("click", () => {
        buttons.forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        animateTo(btn);
        filterCards(btn.dataset.filter);
      });
    });

    const initial = segmented.querySelector("button.is-active") || buttons[0];
    if (initial) {
      requestAnimationFrame(() => placeInstant(initial));
      window.addEventListener("resize", () => {
        const active = segmented.querySelector("button.is-active") || buttons[0];
        placeInstant(active);
      });
    }
  }

  /* ---------- 加载远程文章列表 ---------- */
  async function loadRemotePosts() {
    const container = document.getElementById('post-container');
    if (!container) return;
    try {
      console.log('加载文章列表:', `${BASE}posts.json`);
const res = await fetch(`${BASE}posts.json`);
      if (!res.ok) throw new Error(`posts.json 加载失败 (HTTP ${res.status})`);
      const posts = await res.json();
      console.log('文章数据:', posts);

      container.innerHTML = posts.map(post => `
        <a class="post-card ${post.featured ? 'featured' : ''}" data-cat="${post.cat || 'essay'}" data-reveal href="article.html?post=${encodeURIComponent(post.file)}">
          ${post.cover ? `<img class="post-cover" src="${post.cover}" loading="lazy">` : ''}
          <div class="post-inner">
          <span class="cat"><span class="dot" style="background:var(--accent-${post.cat || 'essay'})"></span>${post.category || ''} · ${post.log || ''}</span>
          <h3>${post.title || '无标题'}</h3><p>${post.desc || ''}</p>
          <div class="foot"><span>${post.date || ''}</span><span>${post.time || ''}</span></div>
          </div>
        </a>
      `).join('');

      requestAnimationFrame(()=>document.querySelectorAll('[data-reveal]').forEach((el,i)=>setTimeout(()=>el.classList.add('is-visible'),i*60)));
      initPostFilter();
    } catch (e) {
      console.error('❌ 文章列表加载失败:');
      console.error('错误类型:', e.name);
      console.error('错误消息:', e.message);
      container.innerHTML = `<p>文章加载失败：${e.message || '未知错误'}</p>`;
    }
  }

  function initPostFilter() {
    const segmented = document.querySelector('[data-segmented]');
    if (!segmented) return;
    const buttons = [...segmented.querySelectorAll('button')];
    const cards = [...document.querySelectorAll('.post-card[data-cat]')];
    buttons.forEach(btn => {
      btn.onclick = () => {
        buttons.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        cards.forEach(card => card.classList.toggle('is-filtered-out', btn.dataset.filter !== 'all' && card.dataset.cat !== btn.dataset.filter));
      };
    });
  }

  loadRemotePosts();
})();