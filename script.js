(() => {
  const $ = id => document.getElementById(id);
  const main = $('main');
  const bootEl = $('boot');
  const statusLine = $('statusLine');
  const input = $('cmdInput');

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  const SECTIONS = ['about', 'experience', 'projects', 'skills', 'github', 'education', 'now', 'contact'];
  const ALIAS = {
    whoami: 'about', bio: 'about', me: 'about', neofetch: 'about',
    work: 'experience', exp: 'experience', xp: 'experience',
    proj: 'projects', project: 'projects', ls: 'projects', 'ls -la': 'projects',
    skill: 'skills', stack: 'skills',
    gh: 'github', stats: 'github',
    edu: 'education', school: 'education',
    email: 'contact', hire: 'contact', mail: 'contact',
  };

  const STATUS_COLORS = {
    muted: 'oklch(0.62 0.02 255)',
    ok: 'oklch(0.82 0.14 150)',
    err: 'oklch(0.74 0.16 25)',
  };

  function setStatus(out, type = 'muted', cmd) {
    statusLine.innerHTML = '';
    if (!out && !cmd) { statusLine.hidden = true; return; }
    statusLine.hidden = false;
    if (cmd) {
      const c = document.createElement('div');
      c.className = 'status-cmd';
      c.textContent = '❯ ' + cmd;
      statusLine.appendChild(c);
    }
    if (out) {
      const o = document.createElement('pre');
      o.className = 'status-out';
      o.textContent = out;
      o.style.color = STATUS_COLORS[type] || STATUS_COLORS.muted;
      statusLine.appendChild(o);
    }
  }

  // ---- CRT power-on ----
  let crtEl = $('crtBoot');
  function playCrt(cb) {
    if (!crtEl || reduced) { if (crtEl) crtEl.style.display = 'none'; cb(); return; }
    const fresh = crtEl.cloneNode(true);
    crtEl.replaceWith(fresh);
    crtEl = fresh;
    fresh.style.display = '';
    let done = false;
    const fin = () => { if (done) return; done = true; fresh.style.display = 'none'; cb(); };
    fresh.addEventListener('animationend', e => { if (e.animationName === 'crt-fade') fin(); });
    setTimeout(fin, 1500);
  }

  // ---- boot sequence: first line instant, the rest typed ----
  const bootLines = [
    'Last login: Fri Jul 17 16:23:05 on ttys001',
    'rohan@kl ~ % ./portfolio.sh --profile',
    'initializing environment ............ ok',
    'mounting /projects /experience /skills  ok',
    'session ready — type `help` to navigate',
  ];
  let li = 0;
  function nextBootLine() {
    if (li >= bootLines.length) return;
    const text = bootLines[li];
    const d = document.createElement('div');
    bootEl.appendChild(d);
    if (li === 0) { d.textContent = text; li++; setTimeout(nextBootLine, 160); return; }
    let ci = 0;
    const iv = setInterval(() => {
      ci++;
      d.textContent = text.slice(0, ci);
      if (ci >= text.length) {
        clearInterval(iv);
        if (/ ok$/.test(text)) d.innerHTML = d.textContent.replace(/ok$/, '<span class="ok">ok</span>');
        if (text.startsWith('session ready')) d.classList.add('boot-ready');
        li++;
        setTimeout(nextBootLine, 130);
      }
    }, 11);
  }
  playCrt(nextBootLine);

  // ---- smooth scroll ----
  let raf = null;
  function smoothTo(target) {
    if (raf) cancelAnimationFrame(raf);
    const start = main.scrollTop;
    const dist = target - start;
    const dur = 420;
    const t0 = performance.now();
    function step(now) {
      const p = Math.min(1, (now - t0) / dur);
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      main.scrollTop = start + dist * e;
      if (p < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
  }

  function go(id, cmd) {
    const el = document.getElementById('sec-' + id);
    if (!el) return;
    const target = el.getBoundingClientRect().top - main.getBoundingClientRect().top + main.scrollTop - 16;
    smoothTo(Math.max(0, target));
    setStatus('→ ' + id, 'ok', cmd);
  }

  const navItems = [...document.querySelectorAll('.nav-item')];
  navItems.forEach(el => el.addEventListener('click', () => go(el.dataset.target)));

  // ---- scroll-spy ----
  function updateActive() {
    const mtop = main.getBoundingClientRect().top;
    let cur = SECTIONS[0];
    for (const id of SECTIONS) {
      const el = document.getElementById('sec-' + id);
      if (el && el.getBoundingClientRect().top - mtop <= 140) cur = id;
    }
    navItems.forEach(n => n.classList.toggle('active', n.dataset.target === cur));
  }
  main.addEventListener('scroll', () => requestAnimationFrame(updateActive), { passive: true });
  updateActive();

  // ---- scroll reveal ----
  if (!reduced && 'IntersectionObserver' in window) {
    const secs = document.querySelectorAll('.section');
    secs.forEach(s => s.classList.add('reveal'));
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { root: main, threshold: 0.08 });
    secs.forEach(s => io.observe(s));
  }

  // ---- matrix rain ----
  const rain = $('rain');
  let rainBoost = false;
  let rainReady = false;
  if (rain && !reduced) {
    rainReady = true;
    const ctx = rain.getContext('2d');
    const CH = 'アイウエオカキクケコサシスセソタチツテト0123456789ABCDEF<>/{}[]=+*#$%'.split('');
    const fs = 14;
    let W, H, cols, drops;
    function sizeRain() {
      W = rain.width = innerWidth;
      H = rain.height = innerHeight;
      cols = Math.floor(W / fs) + 1;
      drops = Array.from({ length: cols }, () => Math.random() * -H / fs);
    }
    sizeRain();
    addEventListener('resize', sizeRain);
    let last = 0;
    function draw(t) {
      requestAnimationFrame(draw);
      if (document.hidden) return;
      const interval = rainBoost ? 45 : 85;
      if (t - last < interval) return;
      last = t;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,' + (rainBoost ? 0.16 : 0.1) + ')';
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
      ctx.font = fs + 'px "JetBrains Mono", monospace';
      for (let i = 0; i < cols; i++) {
        const y = drops[i] * fs;
        if (y > 0) {
          const ch = CH[(Math.random() * CH.length) | 0];
          ctx.fillStyle = Math.random() < 0.06
            ? 'rgba(190,255,220,0.85)'
            : 'rgba(52,211,153,' + (rainBoost ? 0.5 : 0.3) + ')';
          ctx.fillText(ch, i * fs, y);
        }
        if (y > H) {
          if (Math.random() > (rainBoost ? 0.95 : 0.975)) drops[i] = 0;
        } else {
          drops[i]++;
        }
      }
    }
    requestAnimationFrame(draw);
  }
  function setRain(boost) {
    rainBoost = boost;
    if (rain) rain.style.opacity = boost ? '0.85' : '0.55';
  }

  // ---- 3D terminal tilt + ambient glow ----
  if (finePointer && !reduced) {
    const term = document.querySelector('.terminal');
    const page = document.querySelector('.page');
    let tx = 0, ty = 0, cx = 0, cy = 0, tiltRaf = null;
    function tiltTick() {
      cx += (tx - cx) * 0.07;
      cy += (ty - cy) * 0.07;
      term.style.transform = `rotateY(${cx.toFixed(3)}deg) rotateX(${cy.toFixed(3)}deg)`;
      if (Math.abs(cx - tx) > 0.005 || Math.abs(cy - ty) > 0.005) {
        tiltRaf = requestAnimationFrame(tiltTick);
      } else {
        tiltRaf = null;
      }
    }
    addEventListener('mousemove', e => {
      const nx = e.clientX / innerWidth - 0.5;
      const ny = e.clientY / innerHeight - 0.5;
      tx = nx * 3.2;
      ty = -ny * 2.2;
      page.style.setProperty('--mx', (e.clientX / innerWidth * 100).toFixed(1) + '%');
      page.style.setProperty('--my', (e.clientY / innerHeight * 100).toFixed(1) + '%');
      if (!tiltRaf) tiltRaf = requestAnimationFrame(tiltTick);
    }, { passive: true });
  }

  // ---- 3D card tilt + glare ----
  if (finePointer && !reduced) {
    document.querySelectorAll('.project-card, .contact-card').forEach(card => {
      card.classList.add('tiltable');
      const glare = document.createElement('span');
      glare.className = 'card-glare';
      card.appendChild(glare);
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.transition = 'transform 0.06s linear';
        card.style.transform =
          `perspective(700px) translateY(-3px) rotateY(${((px - 0.5) * 7).toFixed(2)}deg) rotateX(${((0.5 - py) * 6).toFixed(2)}deg)`;
        card.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
      });
      card.addEventListener('mouseleave', () => {
        card.style.transition = 'transform 0.35s ease';
        card.style.transform = '';
      });
    });
  }

  // ---- commands ----
  const HELP =
`sections  ${SECTIONS.join(' · ')}
extras    date · pwd · echo <msg> · history · matrix · reboot · uname · ping · clear
keys      [1-8] jump · [/] focus · [j/k] scroll · [g/G] top/end · [tab] complete`;

  const hist = [];
  let histIdx = null;

  function run(raw) {
    const c = raw.trim();
    if (!c) return;
    hist.push(c);
    if (hist.length > 50) hist.shift();
    histIdx = null;
    const lc = c.toLowerCase();

    if (lc === 'help' || lc === '?') { setStatus(HELP, 'muted', c); return; }
    if (lc === 'clear') { smoothTo(0); setStatus('', 'muted'); return; }
    if (lc === 'top' || lc === 'cd' || lc === 'cd ~') { smoothTo(0); setStatus('~', 'muted', c); return; }
    if (lc === 'reboot') { setStatus('', 'muted'); smoothTo(0); bootEl.innerHTML = ''; li = 0; playCrt(nextBootLine); return; }
    if (lc === 'matrix') {
      if (!rainReady) { setStatus('matrix unavailable (reduced motion enabled)', 'err', c); return; }
      setRain(true);
      setStatus('wake up, neo…  (type `matrix off` to exit)', 'ok', c);
      return;
    }
    if (lc === 'matrix off') { setRain(false); setStatus('back to reality.', 'muted', c); return; }
    if (lc === 'sudo' || lc.startsWith('sudo ')) { setStatus('permission denied: this incident will be reported.', 'err', c); return; }
    if (lc === 'rm' || lc.startsWith('rm ')) { setStatus('rm: cannot remove: portfolio is read-only (nice try)', 'err', c); return; }
    if (['exit', 'quit', ':q', ':q!', ':wq'].includes(lc)) { setStatus("you can't escape the portfolio.", 'muted', c); return; }
    if (lc === 'date') { setStatus(new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kuala_Lumpur', dateStyle: 'full', timeStyle: 'long' }), 'muted', c); return; }
    if (lc === 'pwd') { setStatus('/home/rohan/portfolio', 'muted', c); return; }
    if (lc.startsWith('echo ')) { setStatus(c.slice(5), 'muted', c); return; }
    if (lc === 'history') {
      const last = hist.slice(-8);
      const base = hist.length - last.length;
      setStatus(last.map((h, i) => `  ${base + i + 1}  ${h}`).join('\n'), 'muted', c);
      return;
    }
    if (lc === 'uname' || lc === 'uname -a') { setStatus('RohanOS 6.2.0-lts x86_64 — powered by coffee & AWS Lambda', 'muted', c); return; }
    if (lc === 'ping') { setStatus('PONG — 64 bytes from kuala-lumpur: time=0.42ms ttl=∞', 'ok', c); return; }
    if (['vim', 'vi', 'nano'].includes(lc)) { setStatus('this portfolio was written in vim btw.', 'muted', c); return; }
    if (lc === 'emacs') { setStatus('emacs: command not found — try vim ;)', 'err', c); return; }

    const target = SECTIONS.includes(lc) ? lc : ALIAS[lc];
    if (target) { go(target, c); return; }
    setStatus(`command not found: ${c}  (try 'help')`, 'err', c);
  }

  const CANDIDATES = [...new Set([
    ...SECTIONS,
    'help', 'clear', 'date', 'pwd', 'history', 'matrix', 'matrix off', 'reboot', 'neofetch', 'uname', 'ping', 'echo ',
    ...Object.keys(ALIAS),
  ])];

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const v = input.value;
      input.value = '';
      run(v);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!hist.length) return;
      histIdx = histIdx === null ? hist.length - 1 : Math.max(0, histIdx - 1);
      input.value = hist[histIdx];
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx === null) return;
      histIdx++;
      if (histIdx >= hist.length) { histIdx = null; input.value = ''; }
      else input.value = hist[histIdx];
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const v = input.value.trim().toLowerCase();
      if (!v) return;
      const m = CANDIDATES.filter(x => x.startsWith(v));
      if (m.length) {
        input.value = m[0];
        if (m.length > 1) setStatus(m.join('  '), 'muted');
      }
    } else if (e.key === 'Escape') {
      input.blur();
    }
  });

  // ---- vim-style global keys (ignored while typing) ----
  document.addEventListener('keydown', e => {
    if (e.target === input || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^[1-8]$/.test(e.key)) go(SECTIONS[+e.key - 1]);
    else if (e.key === 'j') main.scrollBy({ top: 140 });
    else if (e.key === 'k') main.scrollBy({ top: -140 });
    else if (e.key === 'g') smoothTo(0);
    else if (e.key === 'G') smoothTo(main.scrollHeight);
    else if (e.key === '/') { e.preventDefault(); input.focus(); }
    else if (e.key === '?') setStatus(HELP, 'muted', 'help');
  });

  document.querySelector('.cmd-row').addEventListener('click', () => input.focus());

  // ---- tmux clock (Kuala Lumpur) ----
  const clock = $('clock');
  if (clock) {
    const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Kuala_Lumpur' });
    const tick = () => { clock.textContent = fmt.format(new Date()); };
    tick();
    setInterval(tick, 1000);
  }

  setStatus("welcome — type 'help', press / to start typing, or click a section", 'muted');
})();
