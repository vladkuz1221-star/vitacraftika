// Главная: видео с дирижаблем, точки на его частях, плавный «наезд» камеры и меню поверх.
(() => {
  // x и y — проценты кадра видео (1920x1080). d — сторона подписи на компьютере, m — на телефоне.
  const HS = [
    { id: "about",  x: 27.5, y: 51.5, d: "l", m: "b", ru: "Мир",        en: "World" },        // нос
    { id: "map",    x: 36,   y: 47.5, d: "b", m: "b", ru: "Карта мира", en: "World map" },   // носовая часть корпуса
    { id: "tech",   x: 46.5, y: 43.5, d: "t", m: "t", ru: "Технологии", en: "Technology" },   // корпус
    { id: "rules",  x: 49,   y: 55.5, d: "b", m: "b", ru: "Правила",    en: "Rules" },        // гондола
    { id: "more",   x: 56,   y: 49,   d: "b", m: "b", ru: "Ещё",        en: "More" },         // кабина
    { id: "events", x: 65.5, y: 43.5, d: "t", m: "l", ru: "События",    en: "Events" },       // хвост
  ];
  // Тексты новой главной (русский берётся из разметки, английский — здесь)
  Object.assign(translations.en, {
    nav_more: "More", hero_lead: "Technical survival in Minecraft: machines, airships and events.", hero_cta: "How to join",
    copy_short: "Copy", more_title: "More on the site", nav_news: "News",
    m_join: "How to join", m_join_d: "Version, mods and server address", m_news_d: "What's new on the server",
    m_map: "World map", m_map_d: "Live server map", m_stats: "Stats", m_stats_d: "Top players by playtime",
    m_profile: "Profile", m_profile_d: "Check if you are online", m_faq: "FAQ", m_faq_d: "Answers before you start",
    m_support: "Support", m_support_d: "Voluntary, no in-game perks"
  });
  const $ = id => document.getElementById(id);
  const overlay = $("overlay"), sheet = $("sheet"), scene = $("scene"), cam = $("cam"), vid = $("vid"), box = $("hotspots");
  let current = null, timer;
  const FW = 1920, FH = 1080, SHIP = { cx: 47, w: 44.3, cy: 48 };
  let geo = { vw: innerWidth, vh: innerHeight, fit: false };

  box.innerHTML = HS.map(h => `<button class="hs" data-open="${h.id}"><i></i><span></span></button>`).join("");

  // Видео и точки считаются одной формулой, поэтому точки всегда стоят на тех же частях дирижабля.
  // Горизонтальный экран: видео на весь экран. Вертикальный (телефон): весь дирижабль по ширине экрана.
  function layout() {
    const vw = scene.clientWidth || innerWidth, vh = scene.clientHeight || innerHeight, fit = vw / vh < 1;
    let k, ox, oy;
    if (!fit) { k = Math.max(vw / FW, vh / FH); ox = (vw - FW * k) / 2; oy = (vh - FH * k) / 2; }
    else { k = vw * 0.94 / (FW * SHIP.w / 100); ox = vw / 2 - FW * k * SHIP.cx / 100; oy = Math.min(0, vh * 0.3 - FH * k * SHIP.cy / 100); }
    geo = { vw, vh, fit };
    scene.classList.toggle("fit", fit);
    vid.style.width = FW * k + "px"; vid.style.height = FH * k + "px"; vid.style.left = ox + "px"; vid.style.top = oy + "px";
    box.querySelectorAll(".hs").forEach((b, i) => {
      b.style.left = ox + HS[i].x / 100 * FW * k + "px"; b.style.top = oy + HS[i].y / 100 * FH * k + "px";
      b.dataset.dir = fit ? HS[i].m : HS[i].d;
    });
  }
  new ResizeObserver(layout).observe(scene);
  addEventListener("resize", layout);
  layout();

  const ipText = $("heroIpText"), CFGip = (window.VC && window.VC.ip) || "";
  ipText.textContent = CFGip || "—";
  $("heroIp").addEventListener("click", () => {
    const done = () => showToast(translations[currentLang].toast_copied + ": " + CFGip);
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(CFGip).then(done).catch(() => fallbackCopy(CFGip, done));
    else fallbackCopy(CFGip, done);
  });
  function labels() {
    const en = currentLang === "en";
    box.querySelectorAll(".hs").forEach((b, i) => { b.querySelector("span").textContent = en ? HS[i].en : HS[i].ru; b.setAttribute("aria-label", en ? HS[i].en : HS[i].ru); });
  }

  function show(id) {
    document.querySelectorAll(".panel").forEach(p => { p.hidden = p.id !== "panel-" + id; });
    sheet.scrollTop = 0;
  }
  // К какой части дирижабля летит камера: к нажатой точке; для остальных разделов — к корпусу
  function target(id, from) {
    const b = (from && from.closest && from.closest(".hs")) || box.querySelector(`.hs[data-open="${id}"]`) || box.querySelector('.hs[data-open="tech"]');
    return { x: parseFloat(b.style.left), y: parseFloat(b.style.top) };
  }
  function open(id, from) {
    if (!$("panel-" + id)) return;
    clearTimeout(timer);
    const first = overlay.hidden || !overlay.classList.contains("open");
    show(id); current = id;
    if (first) {
      const t = target(id, from);
      cam.style.transformOrigin = `${t.x}px ${t.y}px`;
      scene.style.setProperty("--tx", geo.vw / 2 - t.x + "px");
      scene.style.setProperty("--ty", geo.vh * 0.4 - t.y + "px");
      scene.style.setProperty("--z", geo.fit ? 2 : 2.5);
      scene.classList.add("zoom");
      overlay.hidden = false;
      // меню появляется поверх, когда камера уже заметно приблизилась
      timer = setTimeout(() => overlay.classList.add("open"), 700);
    }
    history.replaceState(null, "", "#" + id);
  }
  function close() {
    if (overlay.hidden) return;
    clearTimeout(timer);
    overlay.classList.remove("open"); scene.classList.remove("zoom"); current = null;
    history.replaceState(null, "", location.pathname + location.search);
    timer = setTimeout(() => { overlay.hidden = true; }, 900);
  }

  document.addEventListener("click", e => {
    const t = e.target.closest("[data-open]");
    if (t) { e.preventDefault(); document.getElementById("nav").classList.remove("open"); open(t.dataset.open, t); return; }
    if (e.target === overlay || e.target.closest("#closeBtn")) close();
  });
  addEventListener("keydown", e => { if (e.key === "Escape") close(); });
  addEventListener("hashchange", () => { const id = location.hash.slice(1); if (id && id !== current) open(id); });

  // Онлайн в плашке на картинке
  function hud() {
    const s = lastStatus, ok = s && s !== "err", on = ok && s.online, p = ok && s.players, en = currentLang === "en";
    $("hudN").textContent = on && p ? p.online + " / " + p.max : "—";
    $("hudL").textContent = on ? (en ? "online" : "онлайн") : s === null ? "…" : ok ? (en ? "offline" : "офлайн") : (en ? "no data" : "нет данных");
    $("hud").classList.toggle("on", !!on);
  }
  const _u = updateStatusText; updateStatusText = function () { _u(); hud(); };
  const _a = applyLang; applyLang = function (l) { _a(l); labels(); hud(); };

  applyLang(currentLang); labels(); hud(); layout();
  if (location.hash.length > 1) setTimeout(() => open(location.hash.slice(1)), 400);
})();
