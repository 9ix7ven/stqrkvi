/* ===== CONFIG: add real URLs/IDs here. Empty values are simply not shown. ===== */
const CONFIG = {
  projects: {
    questify:  { demo: "", source: "" },
    ltcvault:  { demo: "", source: "" },
    portfolio: { demo: "", source: "" },
    tools:     { demo: "", source: "" }
  },
  people: {
    stqrkvi: { discord: "", instagram: "", github: "" },
    zero:    { discord: "", instagram: "", github: "" }
  },
  contact: {
    discord:   { url: "", id: "" },   // id = username or user ID to copy
    instagram: { url: "" },
    github:    { url: "" },
    email:     { address: "" }
  }
};
/* ========================================================================= */
(function () {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isUrl = v => /^https?:\/\//i.test(v || "");

  function link(label, href) {
    const a = document.createElement("a");
    a.className = "btn sm"; a.textContent = label; a.href = href;
    if (/^https?:/.test(href)) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
    return a;
  }

  const toast = $("#toast"); let tt;
  function say(msg, err) {
    toast.textContent = msg; toast.classList.toggle("err", !!err);
    toast.classList.add("show"); clearTimeout(tt);
    tt = setTimeout(() => toast.classList.remove("show"), 2400);
  }
  async function copy(text, label) {
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
      else {
        const t = document.createElement("textarea"); t.value = text; t.style.position = "fixed"; t.style.opacity = "0";
        document.body.appendChild(t); t.select();
        const ok = document.execCommand("copy"); t.remove(); if (!ok) throw new Error("copy failed");
      }
      say(label + " copied");
    } catch (e) { say("Couldn't copy. Select the text and copy it manually.", true); }
  }

  $$("[data-project]").forEach(card => {
    const c = CONFIG.projects[card.dataset.project] || {}, box = $(".links", card);
    if (isUrl(c.demo)) box.appendChild(link("Live Demo", c.demo));
    if (isUrl(c.source)) box.appendChild(link("Source Code", c.source));
  });
  $$("[data-person]").forEach(card => {
    const c = CONFIG.people[card.dataset.person] || {}, box = $(".links", card);
    [["Discord", "discord"], ["Instagram", "instagram"], ["GitHub", "github"]].forEach(([n, k]) => { if (isUrl(c[k])) box.appendChild(link(n, c[k])); });
  });

  const list = $("#contactList"), C = CONFIG.contact;
  function row(title, sub, actions) {
    const r = document.createElement("div"); r.className = "crow";
    r.innerHTML = "<div><strong></strong><small></small></div><div class='acts'></div>";
    $("strong", r).textContent = title; $("small", r).textContent = sub || "";
    actions.forEach(a => $(".acts", r).appendChild(a)); list.appendChild(r);
  }
  function copyBtn(text, label) {
    const b = document.createElement("button"); b.type = "button"; b.className = "btn sm"; b.textContent = "Copy " + label;
    b.addEventListener("click", () => copy(text, label)); return b;
  }
  if (isUrl(C.discord.url) || C.discord.id) {
    const a = []; if (isUrl(C.discord.url)) a.push(link("Open Discord", C.discord.url));
    if (C.discord.id) a.push(copyBtn(C.discord.id, "Discord ID")); row("Discord", C.discord.id, a);
  }
  if (isUrl(C.instagram.url)) row("Instagram", "", [link("Open Instagram", C.instagram.url)]);
  if (isUrl(C.github.url)) row("GitHub", "", [link("Open GitHub", C.github.url)]);
  if (C.email.address) row("Email", C.email.address, [link("Send email", "mailto:" + C.email.address), copyBtn(C.email.address, "email")]);
  if (!list.children.length) {
    const p = document.createElement("p"); p.className = "empty";
    p.textContent = "Contact links aren't published yet. Add them in the CONFIG block at the top of js/main.js.";
    list.appendChild(p);
  }

  const D = "https://cdn.jsdelivr.net/gh/devicons/devicon@v2.15.1/icons/";
  const stack = [["HTML", "html5/html5-original"], ["CSS", "css3/css3-original"], ["JavaScript", "javascript/javascript-original"], ["Node.js", "nodejs/nodejs-original"], ["Discord.js", "discordjs/discordjs-original"], ["Python", "python/python-original"], ["GitHub", "github/github-original"], ["APIs", ""], ["Railway", ""]];
  const grid = $("#stackGrid");
  stack.forEach(([name, path]) => {
    const li = document.createElement("li"); li.className = "reveal";
    const mono = () => { const m = document.createElement("span"); m.className = "mono"; m.setAttribute("aria-hidden", "true"); m.textContent = name === "APIs" ? "{ }" : name.slice(0, 2); return m; };
    if (path) {
      const img = new Image(); img.alt = ""; img.width = img.height = 40; img.loading = "lazy"; img.src = D + path + ".svg";
      if (name === "GitHub") img.style.filter = "invert(1)";
      img.onerror = () => img.replaceWith(mono()); li.appendChild(img);
    } else li.appendChild(mono());
    li.appendChild(document.createTextNode(name)); grid.appendChild(li);
  });

  $$(".avatar").forEach(av => {
    const img = $("img", av), ok = () => av.classList.add("ok");
    img.addEventListener("load", () => img.naturalWidth ? ok() : img.remove());
    img.addEventListener("error", () => img.remove());
    if (img.complete && img.naturalWidth) ok();
  });

  const nav = $("#nav"), burger = $("#burger"), menu = $("#menu"), bar = $("#progress");
  function setMenu(o) { menu.classList.toggle("open", o); nav.classList.toggle("menu-open", o); burger.setAttribute("aria-expanded", String(o)); burger.setAttribute("aria-label", o ? "Close menu" : "Open menu"); }
  burger.addEventListener("click", () => setMenu(!menu.classList.contains("open")));
  $$("a", menu).forEach(a => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });
  let tick = false;
  function onScroll() {
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = "scaleX(" + (h > 0 ? scrollY / h : 0) + ")";
    nav.classList.toggle("stuck", scrollY > 20); tick = false;
  }
  addEventListener("scroll", () => { if (!tick) { tick = true; requestAnimationFrame(onScroll); } }, { passive: true }); onScroll();

  const links = $$("a", menu);
  if ("IntersectionObserver" in window) {
    const so = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) links.forEach(a => a.classList.toggle("on", a.hash === "#" + e.target.id)); }), { rootMargin: "-45% 0px -50% 0px" });
    $$("main section[id]").forEach(s => so.observe(s));
    const ro = new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); o.unobserve(e.target); } }), { threshold: .12 });
    $$(".reveal").forEach(el => ro.observe(el));
  } else $$(".reveal").forEach(el => el.classList.add("in"));
  $("#yr").textContent = new Date().getFullYear();

  const cv = $("#bg"); if (!cv || reduce) return;
  const ctx = cv.getContext("2d"); let W, H, P = [], raf = 0, vis = true;
  function size() {
    const d = Math.min(devicePixelRatio || 1, 2); W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    P = Array.from({ length: Math.round(Math.min(70, W / 16)) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.6 + .4, v: Math.random() * .25 + .08, a: Math.random() * .5 + .2 }));
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const p of P) {
      p.y -= p.v; if (p.y < -4) { p.y = H + 4; p.x = Math.random() * W; }
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fillStyle = "rgba(255,43,61," + p.a + ")";
      ctx.shadowColor = "#ff2b3d"; ctx.shadowBlur = 8; ctx.fill();
    }
    raf = vis ? requestAnimationFrame(draw) : 0;
  }
  size(); draw();
  addEventListener("resize", () => { clearTimeout(size.t); size.t = setTimeout(size, 150); });
  new IntersectionObserver(e => { vis = e[0].isIntersecting; if (vis && !raf) draw(); }).observe(cv);
})();
