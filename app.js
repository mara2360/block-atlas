/* Block Atlas — shared interactions. Prices here are SIMULATED for design purposes only. */
(function () {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- Mobile menu ---------- */
  const menuBtn = $("#menuBtn"), panel = $("#mobilePanel");
  if (menuBtn && panel) {
    menuBtn.addEventListener("click", () => {
      const open = panel.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", open);
    });
  }

  /* ---------- Starfield ---------- */
  const stars = $("#stars");
  if (stars) {
    const ctx = stars.getContext("2d");
    let w, h, pts = [];
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = stars.width = innerWidth * dpr; h = stars.height = innerHeight * dpr;
      stars.style.width = innerWidth + "px"; stars.style.height = innerHeight + "px";
      pts = Array.from({ length: Math.round((innerWidth * innerHeight) / 5200) }, () => ({
        x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.3 * dpr + 0.2,
        a: Math.random(), s: 0.004 + Math.random() * 0.01, v: 0.02 + Math.random() * 0.08
      }));
    };
    size(); addEventListener("resize", size);
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.a += p.s; const tw = 0.35 + Math.abs(Math.sin(p.a)) * 0.65;
        if (!reduce) { p.y += p.v; if (p.y > h) p.y = 0; }
        ctx.globalAlpha = tw; ctx.fillStyle = "#cfe4ff";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      if (!reduce) requestAnimationFrame(draw);
    };
    draw();
  }

  /* ---------- Hero node network ---------- */
  const net = $("#network");
  if (net) {
    const ctx = net.getContext("2d");
    let w, h, dpr, nodes = [], mouse = { x: -999, y: -999 };
    const size = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = net.getBoundingClientRect();
      w = net.width = r.width * dpr; h = net.height = r.height * dpr;
      const n = Math.min(90, Math.round((r.width * r.height) / 14000));
      nodes = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35 * dpr, vy: (Math.random() - 0.5) * 0.35 * dpr,
        c: Math.random() < 0.15 ? "#ff4fd8" : Math.random() < 0.5 ? "#2ee6ff" : "#8b5cff"
      }));
    };
    size(); addEventListener("resize", size);
    net.parentElement.addEventListener("pointermove", (e) => {
      const r = net.getBoundingClientRect(); mouse.x = (e.clientX - r.left) * dpr; mouse.y = (e.clientY - r.top) * dpr;
    });
    net.parentElement.addEventListener("pointerleave", () => { mouse.x = mouse.y = -999; });
    const link = 150;
    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      for (const a of nodes) {
        if (!reduce) {
          a.x += a.vx; a.y += a.vy;
          if (a.x < 0 || a.x > w) a.vx *= -1;
          if (a.y < 0 || a.y > h) a.vy *= -1;
          const dx = mouse.x - a.x, dy = mouse.y - a.y, d = Math.hypot(dx, dy);
          if (d < 180 * dpr) { a.x += dx * 0.004; a.y += dy * 0.004; }
        }
      }
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < link * dpr) {
            ctx.globalAlpha = (1 - d / (link * dpr)) * 0.55;
            ctx.strokeStyle = "#5fa8ff"; ctx.lineWidth = dpr * 0.8;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (const a of nodes) {
        ctx.globalAlpha = 1; ctx.fillStyle = a.c; ctx.shadowColor = a.c; ctx.shadowBlur = 12 * dpr;
        ctx.beginPath(); ctx.arc(a.x, a.y, 1.8 * dpr, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      }
      if (!reduce) requestAnimationFrame(frame);
    };
    frame();
  }

  /* ---------- Simulated market ---------- */
  const market = {
    BTC: { px: 68420.55, open: 67210, hist: [] },
    ETH: { px: 3584.12, open: 3610, hist: [] },
    SOL: { px: 162.38, open: 157.9, hist: [] }
  };
  const vol = { BTC: 0.0016, ETH: 0.0022, SOL: 0.0032 };
  // Build a believable 24h history that walks backwards from today's price,
  // so the series ends exactly at the current price (no jump on the chart).
  for (const k in market) {
    const m = market[k], target = m.open, steps = 47; let p = m.px; const back = [p];
    for (let i = 1; i <= steps; i++) {
      const pull = (target - p) / (steps - i + 1);           // drift toward the 24h open
      p = p + pull + p * (Math.random() - 0.5) * vol[k] * 2.2; // plus noise
      back.push(p);
    }
    back[back.length - 1] = target;
    m.hist = back.reverse();
  }
  const fmt = (n) => n >= 1000 ? n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 })
    : n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pct = (m) => ((m.px - m.open) / m.open) * 100;
  function sparkPath(arr, W = 96, H = 36) {
    const min = Math.min(...arr), max = Math.max(...arr), r = max - min || 1;
    return arr.map((v, i) => `${i ? "L" : "M"}${(i / (arr.length - 1)) * W},${H - 3 - ((v - min) / r) * (H - 6)}`).join(" ");
  }
  function paint(first) {
    for (const k in market) {
      const m = market[k], p = pct(m), cls = p >= 0 ? "up" : "down";
      $$(`[data-px="${k}"]`).forEach((el) => {
        const prev = parseFloat(el.dataset.v || 0);
        el.textContent = fmt(m.px); el.dataset.v = m.px;
        if (!first && !reduce) { el.classList.remove("flash-up", "flash-down"); void el.offsetWidth; el.classList.add(m.px >= prev ? "flash-up" : "flash-down"); }
      });
      $$(`[data-ch="${k}"]`).forEach((el) => { el.textContent = `${p >= 0 ? "▲" : "▼"} ${Math.abs(p).toFixed(2)}%`; el.className = el.className.replace(/\b(up|down)\b/g, "").trim() + " " + cls; });
      $$(`[data-spark="${k}"]`).forEach((svg) => {
        const path = svg.querySelector("path");
        path.setAttribute("d", sparkPath(m.hist.slice(-30)));
        path.setAttribute("stroke", p >= 0 ? "var(--up)" : "var(--down)");
      });
    }
  }
  paint(true);
  if (!reduce) setInterval(() => {
    for (const k in market) {
      const m = market[k];
      m.px = Math.max(m.px * (1 + (Math.random() - 0.495) * vol[k]), 0.01);
      m.hist.push(m.px); if (m.hist.length > 60) m.hist.shift();
    }
    paint(false);
    document.dispatchEvent(new CustomEvent("market"));
  }, 2200);

  // Simulated network counters
  const blockEl = $$("[data-block]"), tpsEl = $$("[data-tps]");
  let block = 912384 + Math.floor(Math.random() * 400);
  const setCounters = () => {
    blockEl.forEach((e) => (e.textContent = "#" + block.toLocaleString("en-US")));
    tpsEl.forEach((e) => (e.textContent = (3200 + Math.round(Math.random() * 900)).toLocaleString("en-US")));
  };
  setCounters();
  if (!reduce) setInterval(() => { block++; setCounters(); }, 6000);

  /* ---------- Price chart (network pages) ---------- */
  $$("[data-chart]").forEach((wrap) => {
    const k = wrap.dataset.chart, m = market[k], svg = $(".chart", wrap);
    const pxEl = $(".chart-px", wrap), chEl = $(".chart-ch", wrap), foot = $(".chart-foot", wrap);
    const W = 600, H = 220;
    let range = "1D";
    const seeded = (seed) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const series = (r) => {
      if (r === "1D") return m.hist.slice(-48);
      const n = { "1W": 56, "1M": 60, "1Y": 72 }[r], v = { "1W": 0.012, "1M": 0.025, "1Y": 0.06 }[r];
      const rnd = seeded({ BTC: 7, ETH: 13, SOL: 29 }[k] * ({ "1W": 3, "1M": 5, "1Y": 11 }[r]));
      const out = []; let p = m.px;
      for (let i = 0; i < n; i++) { out.unshift(p); p = p / (1 + (rnd() - 0.47) * v); }
      out[out.length - 1] = m.px; return out;
    };
    const labels = { "1D": ["24h ago", "12h", "Now"], "1W": ["7d ago", "3.5d", "Now"], "1M": ["30d ago", "15d", "Now"], "1Y": ["1y ago", "6m", "Now"] };
    function draw(animate) {
      const s = series(range), min = Math.min(...s), max = Math.max(...s), pad = (max - min) * 0.12 || 1;
      const lo = min - pad, hi = max + pad;
      const pts = s.map((v, i) => [(i / (s.length - 1)) * W, H - ((v - lo) / (hi - lo)) * H]);
      const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
      const up = s[s.length - 1] >= s[0], col = up ? "#3dffa8" : "#ff5c7a";
      const change = ((s[s.length - 1] - s[0]) / s[0]) * 100;
      svg.innerHTML = `
        <defs><linearGradient id="fill-${k}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="${col}" stop-opacity=".35"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs>
        ${[0.25, 0.5, 0.75].map((f) => `<line class="gridline" x1="0" x2="${W}" y1="${H * f}" y2="${H * f}"/>`).join("")}
        <path d="${d} L${W},${H} L0,${H} Z" fill="url(#fill-${k})"/>
        <path class="line" d="${d}" fill="none" stroke="${col}" stroke-width="2.4" stroke-linejoin="round" style="filter:drop-shadow(0 0 6px ${col})"/>
        <line class="cross" x1="0" x2="0" y1="0" y2="${H}" stroke="rgba(255,255,255,.35)" stroke-dasharray="3 4" opacity="0"/>
        <circle class="dot" r="5" fill="${col}" stroke="#04050c" stroke-width="2" cx="${pts[pts.length - 1][0]}" cy="${pts[pts.length - 1][1]}"/>`;
      if (animate && !reduce) {
        const line = $(".line", svg), len = line.getTotalLength();
        line.style.strokeDasharray = len; line.style.strokeDashoffset = len;
        line.getBoundingClientRect(); line.style.transition = "stroke-dashoffset 1.2s cubic-bezier(.16,1,.3,1)"; line.style.strokeDashoffset = 0;
      }
      pxEl.textContent = fmt(s[s.length - 1]);
      chEl.textContent = `${up ? "▲" : "▼"} ${Math.abs(change).toFixed(2)}% · ${range}`;
      chEl.className = "chart-ch " + (up ? "up" : "down");
      foot.innerHTML = labels[range].map((t) => `<span>${t}</span>`).join("");
      svg._pts = pts; svg._s = s;
    }
    $$(".tabs button", wrap).forEach((b) => b.addEventListener("click", () => {
      range = b.dataset.range;
      $$(".tabs button", wrap).forEach((x) => x.setAttribute("aria-pressed", x === b));
      draw(true);
    }));
    svg.addEventListener("pointermove", (e) => {
      const r = svg.getBoundingClientRect(), x = ((e.clientX - r.left) / r.width) * W;
      const pts = svg._pts, i = Math.max(0, Math.min(pts.length - 1, Math.round((x / W) * (pts.length - 1))));
      const cross = $(".cross", svg), dot = $(".dot", svg);
      cross.setAttribute("x1", pts[i][0]); cross.setAttribute("x2", pts[i][0]); cross.setAttribute("opacity", 1);
      dot.setAttribute("cx", pts[i][0]); dot.setAttribute("cy", pts[i][1]);
      pxEl.textContent = fmt(svg._s[i]);
    });
    svg.addEventListener("pointerleave", () => draw(false));
    document.addEventListener("market", () => { if (range === "1D") draw(false); });
    draw(true);
  });

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  $$("[data-reveal]").forEach((el) => io.observe(el));

  /* ---------- Card tilt + glow ---------- */
  if (fine && !reduce) {
    $$("[data-tilt]").forEach((card) => {
      if (!card.classList.contains("net-card") && !card.querySelector(".tilt-glow")) {
        const g = document.createElement("span"); g.className = "tilt-glow"; g.setAttribute("aria-hidden", "true"); card.appendChild(g);
      }
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", x * 100 + "%"); card.style.setProperty("--my", y * 100 + "%");
        card.style.transform = `rotateX(${(0.5 - y) * 8}deg) rotateY(${(x - 0.5) * 10}deg) translateY(-4px)`;
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });
  }

  /* ---------- Method: research map ---------- */
  const mapEl = $("#researchMap");
  if (mapEl) {
    const sliders = $$("input[type=range]", mapEl), shape = $(".shape", mapEl), scoreEl = $("#mapScore"), verdict = $("#mapVerdict");
    const start = sliders.map((s) => +s.value);
    const C = 160, R = 120;
    const update = () => {
      const vals = sliders.map((s) => +s.value);
      sliders.forEach((s) => { s.style.setProperty("--v", s.value + "%"); $(`output[for="${s.id}"]`).textContent = s.value + "%"; });
      const pts = vals.map((v, i) => { const a = -Math.PI / 2 + (i * Math.PI * 2) / vals.length; return `${C + Math.cos(a) * R * v / 100},${C + Math.sin(a) * R * v / 100}`; });
      shape.setAttribute("points", pts.join(" "));
      const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length), lowest = Math.min(...vals);
      scoreEl.textContent = avg + "%";
      let t, d, col;
      if (avg >= 75 && lowest >= 60) { t = "Thesis holding"; d = "Evidence is strong across every dimension. Keep checking as conditions change."; col = "var(--up)"; }
      else if (lowest < 30) { t = "Hidden risk"; d = "One dimension is weak enough to sink the thesis on its own. Investigate it before anything else."; col = "var(--down)"; }
      else { t = "Keep verifying"; d = "Some evidence is useful, but at least one important dimension needs more work."; col = "var(--amber)"; }
      verdict.querySelector("strong").textContent = t; verdict.querySelector("strong").style.color = col;
      verdict.querySelector("span").textContent = d;
      shape.style.stroke = col.startsWith("var(--up)") ? "#3dffa8" : col.startsWith("var(--down)") ? "#ff5c7a" : "#2ee6ff";
    };
    sliders.forEach((s) => s.addEventListener("input", update));
    $("#mapReset").addEventListener("click", () => { sliders.forEach((s, i) => (s.value = start[i])); update(); });
    update();
  }

  /* ---------- Manifesto: field test ---------- */
  const quiz = $("#fieldTest");
  if (quiz) {
    const total = $$(".scenario", quiz).length, done = new Set();
    const prog = $("#quizCount"), bar = $(".quiz-bar i", quiz);
    $$(".scenario", quiz).forEach((sc, idx) => {
      $$(".choice", sc).forEach((btn) => btn.addEventListener("click", () => {
        $$(".choice", sc).forEach((b) => b.setAttribute("aria-pressed", b === btn));
        $(".feedback", sc).textContent = btn.dataset.feedback;
        done.add(idx); prog.textContent = `${done.size} of ${total} considered`; bar.style.width = (done.size / total) * 100 + "%";
      }));
    });
  }

  /* ---------- Forms → prepared email (nothing is stored) ---------- */
  $$("form[data-mailto]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const data = new FormData(form), kind = form.dataset.mailto;
      let subject, body;
      if (kind === "brief") { subject = "Join the Block Atlas signal list"; body = `Please add ${data.get("email")} to the weekly brief.`; }
      else {
        subject = `Block Atlas question: ${data.get("topic")}`;
        body = `Name: ${data.get("name") || ""}\nEmail: ${data.get("email") || ""}\nTopic: ${data.get("topic")}\n\n${data.get("question") || ""}`;
      }
      const note = $(".form-note", form);
      if (note) note.textContent = "Opening your email app with your message ready to send…";
      location.href = `mailto:hello@blockatlas.xyz?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  });
})();

/* Home: interactive research checklist */
(function () {
  const cards = document.querySelectorAll('[data-rcard]');
  if (!cards.length) return;
  const bar = document.querySelector('[data-rbar]');
  const score = document.querySelector('[data-rscore]');
  const msg = document.querySelector('[data-rmsg]');
  const meter = document.getElementById('rmeter');
  const C = 2 * Math.PI * 16;
  const MSGS = [
    [0, 'Pick a network you’re curious about, then tap each question you can honestly answer.'],
    [1, 'Good start. Keep going: the gaps are where the surprises hide.'],
    [34, 'Getting there. You have a sketch, not a thesis yet.'],
    [67, 'Thesis forming. Close the last gaps before you commit anything.'],
    [100, 'Research complete. You can explain it, name the risks, and know what would change your mind.']
  ];
  function update() {
    let total = 0, done = 0;
    cards.forEach(card => {
      const btns = card.querySelectorAll('.rcheck');
      const on = card.querySelectorAll('.rcheck[aria-pressed="true"]').length;
      total += btns.length; done += on;
      const ring = card.querySelector('.rring');
      ring.querySelector('.rring-fill').style.strokeDashoffset = C * (1 - on / btns.length);
      ring.querySelector('b').textContent = on + '/' + btns.length;
      ring.setAttribute('aria-label', on + ' of ' + btns.length + ' checked');
      card.classList.toggle('complete', on === btns.length);
    });
    const pct = Math.round(done / total * 100);
    bar.style.width = pct + '%';
    score.textContent = pct + '%';
    let m = MSGS[0][1];
    MSGS.forEach(([min, text]) => { if (pct >= min) m = text; });
    msg.textContent = m;
    meter.classList.toggle('complete', pct === 100);
  }
  cards.forEach(card => card.querySelectorAll('.rcheck').forEach(b => {
    b.addEventListener('click', () => {
      b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      update();
    });
  }));
  cards.forEach(card => { const f = card.querySelector('.rring-fill'); f.style.strokeDasharray = C; f.style.strokeDashoffset = C; });
  document.querySelector('[data-rreset]').addEventListener('click', () => {
    document.querySelectorAll('.rcheck').forEach(b => b.setAttribute('aria-pressed', 'false'));
    update();
  });
  update();
})();

/* Method: interactive step walkthrough */
(function () {
  const root = document.getElementById('stepper');
  if (!root) return;
  const tabs = [...root.querySelectorAll('.stab')];
  const panes = [...root.querySelectorAll('.spane')];
  const line = root.querySelector('.stepper-line i');
  const doneBox = root.querySelector('.stepper-done');
  const done = new Set();
  let cur = 0;
  function show(i, focus) {
    cur = i;
    tabs.forEach((t, k) => { t.setAttribute('aria-selected', k === i); t.tabIndex = k === i ? 0 : -1; });
    panes.forEach((p, k) => {
      if (k === i) { p.hidden = false; p.classList.remove('enter'); void p.offsetWidth; p.classList.add('enter'); }
      else p.hidden = true;
    });
    if (focus) tabs[i].focus();
  }
  function paint() {
    tabs.forEach((t, k) => t.classList.toggle('done', done.has(k)));
    line.style.width = (done.size / tabs.length * 100) + '%';
    const all = done.size === tabs.length;
    doneBox.hidden = !all;
    root.classList.toggle('complete', all);
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => show(i));
    t.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); show((i + 1) % tabs.length, true); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); show((i - 1 + tabs.length) % tabs.length, true); }
    });
  });
  panes.forEach((p, i) => {
    p.querySelector('[data-done]').addEventListener('click', () => {
      done.add(i); paint();
      const next = [...Array(tabs.length).keys()].find(k => !done.has(k));
      if (next !== undefined) show(next);
      else doneBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    const prev = p.querySelector('[data-prev]');
    if (prev) prev.addEventListener('click', () => show(i - 1));
  });
  paint();
})();
