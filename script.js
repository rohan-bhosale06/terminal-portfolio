(() => {
  const $ = id => document.getElementById(id);
  const main = $('main');
  const bootEl = $('boot');
  const statusLine = $('statusLine');
  const input = $('cmdInput');

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

  // boot sequence — first line instant, the rest typed out
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
  nextBootLine();

  // smooth scroll
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

  // scroll-spy: highlight the section currently in view
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

  // commands
  const HELP =
`sections  ${SECTIONS.join(' · ')}
extras    date · pwd · echo <msg> · history · neofetch · uname · ping · clear
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
    'help', 'clear', 'date', 'pwd', 'history', 'neofetch', 'uname', 'ping', 'echo ',
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

  // vim-style global keys (ignored while typing)
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

  // tmux clock — Kuala Lumpur time
  const clock = $('clock');
  if (clock) {
    const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Kuala_Lumpur' });
    const tick = () => { clock.textContent = fmt.format(new Date()); };
    tick();
    setInterval(tick, 1000);
  }

  setStatus("welcome — type 'help', press / to start typing, or click a section", 'muted');
})();
