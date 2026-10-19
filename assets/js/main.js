(function () {
  const hasLibs = window.gsap && window.ScrollTrigger && window.THREE;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const coarse = matchMedia('(pointer:coarse)').matches;

  // ---------- Spotlight Hover Effect ----------
  if (!coarse) {
    addEventListener('mousemove', e => {
      $$('[data-spotlight]').forEach(el => {
        const r = el.getBoundingClientRect();
        if (e.clientY >= r.top - 100 && e.clientY <= r.bottom + 100) {
          el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
          el.style.setProperty('--my', (e.clientY - r.top) + 'px');
        }
      });
    });
  }

  // ---------- Interactive Solar ROI & Savings Calculator ----------
  const billRange = $('#billRange');
  const billVal = $('#billVal');
  const resKwp = $('#resKwp');
  const resPanels = $('#resPanels');
  const resYearly = $('#resYearly');
  const resRoi = $('#resRoi');
  const resCo2 = $('#resCo2');
  const calcWaBtn = $('#calcWaBtn');
  let selectedType = 'Konut GES';
  let typeFactor = 1.0;

  function formatTL(num) {
    return Math.round(num).toLocaleString('tr-TR') + ' ₺';
  }

  function updateCalculator() {
    if (!billRange) return;
    const monthlyBill = +billRange.value;
    const pct = ((monthlyBill - 2000) / (250000 - 2000)) * 100;
    billRange.style.background = `linear-gradient(90deg, #ffb800 0%, #ff6a00 ${pct}%, rgba(255,255,255,0.14) ${pct}%)`;
    billVal.textContent = formatTL(monthlyBill);

    // Realistic Turkish GES engineering math (approx 3.4 TL/kWh effective tariff, 1480 kWh/kWp annual yield)
    const monthlyKwh = monthlyBill / 3.35;
    const neededKwp = Math.max(3.3, (monthlyKwh * 12) / (1480 * typeFactor));
    const panels550 = Math.max(6, Math.ceil((neededKwp * 1000) / 550));
    const actualKwp = (panels550 * 0.55).toFixed(1);
    const yearlySavings = monthlyBill * 12 * 1.08;
    const roiYears = Math.max(2.6, (3.85 - (neededKwp / 180) * 0.4) / typeFactor).toFixed(1);
    const co2Tons = (actualKwp * 0.88).toFixed(1);

    resKwp.textContent = `${actualKwp} kWp`;
    resPanels.textContent = `${panels550} Adet`;
    resYearly.textContent = formatTL(yearlySavings);
    resRoi.textContent = `${roiYears} Yıl`;
    resCo2.textContent = `${co2Tons} Ton/Yıl CO₂ Engelleme`;

    if ($('#formFatura')) $('#formFatura').value = formatTL(monthlyBill);
    if ($('#formTur')) $('#formTur').value = selectedType;
  }

  if (billRange) {
    billRange.addEventListener('input', updateCalculator);
    $$('#calcTypes .ct-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('#calcTypes .ct-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedType = btn.dataset.type;
        typeFactor = +btn.dataset.factor || 1.0;
        updateCalculator();
      });
    });
    calcWaBtn.addEventListener('click', () => {
      const msg = `Merhaba Ramazan Bey, web sitenizdeki simülatörden hesaplama yaptım:\n` +
        `• Kurulum Tipi: ${selectedType}\n` +
        `• Aylık Fatura: ${billVal.textContent}\n` +
        `• Önerilen Sistem: ${resKwp.textContent} (${resPanels.textContent} 550W Panel)\n` +
        `• Tahmini Yıllık Kazanç: ${resYearly.textContent}\n` +
        `Ücretsiz keşif ve resmi fiyat teklifi almak istiyorum.`;
      window.open('https://wa.me/905467285656?text=' + encodeURIComponent(msg), '_blank');
    });
    updateCalculator();
  }

  // ---------- WhatsApp Contact Form ----------
  $('#form').addEventListener('submit', e => {
    e.preventDefault();
    const d = new FormData(e.target);
    const t = `Merhaba Ramazan Bey, GES teklifi almak istiyorum.\n` +
      `• Ad Soyad: ${d.get('ad')}\n` +
      `• Telefon: ${d.get('tel')}\n` +
      `• Sistem Türü: ${d.get('tur')}\n` +
      `• Aylık Fatura: ${d.get('fatura') || 'Belirtilmedi'}\n` +
      `• Not: ${d.get('mesaj') || '-'}`;
    window.open('https://wa.me/905467285656?text=' + encodeURIComponent(t), '_blank');
  });

  // ---------- Mobile Menu ----------
  const mm = $('#mm'), burger = $('#burger');
  burger.onclick = () => {
    const isOpen = mm.classList.toggle('open');
    burger.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };
  $$('a', mm).forEach(a => a.addEventListener('click', () => {
    mm.classList.remove('open');
    burger.classList.remove('open');
    document.body.style.overflow = '';
  }));

  if (!hasLibs) { $('#pre').style.display = 'none'; return; }

  gsap.registerPlugin(ScrollTrigger);

  // ---------- Smooth Scroll (Lenis) ----------
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: .085, wheelMultiplier: .95 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length > 1 && $(id)) { e.preventDefault(); lenis.scrollTo(id, { duration: 1.6, offset: 0 }); }
    }));
  }

  // ---------- Preloader ----------
  const preNum = $('#preNum'), preFill = $('#preFill'), counter = { v: 0 };
  document.body.style.overflow = 'hidden';
  if (lenis) lenis.stop();
  gsap.to(counter, {
    v: 100, duration: 1.5, ease: 'power2.inOut',
    onUpdate: () => {
      const val = Math.round(counter.v);
      preNum.textContent = val;
      if (preFill) preFill.style.width = val + '%';
    },
    onComplete: intro
  });

  // ---------- Text Splitting ----------
  function splitNode(node, grad) {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(t => {
          if (!t) return;
          if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.className = 'w';
          const i = document.createElement('span'); i.className = 'wi' + (grad ? ' grad' : '');
          i.textContent = t; w.appendChild(i); frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') splitNode(n, grad || n.classList.contains('grad'));
    });
  }
  $$('[data-split]').forEach(el => splitNode(el));

  const st = $('#statement');
  if (st) st.innerHTML = st.textContent.trim().split(/\s+/).map(w => `<span class="sw">${w}</span>`).join(' ');

  // ---------- Intro ----------
  function intro() {
    const tl = gsap.timeline();
    tl.to('#pre', { yPercent: -100, duration: 1.0, ease: 'power4.inOut' })
      .add(() => { document.body.style.overflow = ''; if (lenis) lenis.start(); }, '-=.4')
      .fromTo('#heroImg', { scale: 1.2 }, { scale: 1, duration: 2.2, ease: 'power3.out' }, 0.4)
      .from('.hero [data-split="hero"] .wi', { yPercent: 120, duration: 1.2, stagger: .06, ease: 'power4.out' }, 0.7)
      .from('.hero [data-fade]', { y: 35, opacity: 0, duration: .9, stagger: .12, ease: 'power3.out' }, 1.0)
      .from('.hero-stats > div', { y: 30, opacity: 0, duration: .9, stagger: .08, ease: 'power3.out' }, 1.3)
      .add(() => { if (window.__goPose) window.__goPose('hero'); }, 0.6);
    setTimeout(() => $('#pre').style.display = 'none', 3000);
  }

  // ---------- Scroll Reveals ----------
  $$('[data-split]:not([data-split="hero"])').forEach(el => {
    gsap.from($$('.wi', el), { yPercent: 120, duration: 1.1, stagger: .04, ease: 'power4.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });
  $$('[data-fade]:not(.hero [data-fade])').forEach(el => {
    gsap.from(el, { y: 45, opacity: 0, duration: 1.0, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
  });
  gsap.to('.sw', { opacity: 1, stagger: .08, ease: 'none', scrollTrigger: { trigger: '#statement', start: 'top 80%', end: 'bottom 45%', scrub: true } });

  // Parallax images
  $$('[data-parallax]').forEach(img => {
    gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  gsap.to('#heroImg', { yPercent: 14, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // Counters
  $$('[data-count]').forEach(el => {
    const n = +el.dataset.count, suf = el.dataset.suf || '', o = { v: 0 };
    ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => gsap.to(o, { v: n, duration: 2, ease: 'power3.out', onUpdate: () => el.textContent = Math.round(o.v) + suf }) });
  });

  // Horizontal GES (Desktop pinned horizontal scroll, Tablet/Mobile clean responsive grid)
  ScrollTrigger.matchMedia({
    '(min-width: 901px)': function () {
      const track = $('#gesTrack');
      gsap.set(track, { clearProps: 'all' });
      const dist = () => track.scrollWidth - innerWidth + innerWidth * .06;
      gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '#ges', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true } });
    },
    '(max-width: 900px)': function () {
      gsap.set('#ges', { clearProps: 'all' });
      gsap.set('#gesTrack', { clearProps: 'all' });
    }
  });

  // Kesif steps
  $$('.kstep').forEach(s => ScrollTrigger.create({ trigger: s, start: 'top 65%', end: 'bottom 35%', toggleClass: { targets: s, className: 'on' } }));

  // Nav behavior + progress + dots
  const nav = $('#nav'), bar = $('#bar'), hudDock = $('#hudDock');
  ScrollTrigger.create({
    onUpdate: self => {
      const y = self.scroll();
      bar.style.width = (self.progress * 100) + '%';
      nav.classList.toggle('solid', y > 40);
    }
  });
  $$('#dots li').forEach(li => {
    const sec = $('#' + li.dataset.t);
    if (sec) ScrollTrigger.create({ trigger: sec, start: 'top 55%', end: 'bottom 55%', onToggle: s => li.classList.toggle('on', s.isActive) });
  });

  // Cursor + magnetic
  if (!coarse) {
    const cur = $('#cur'), ring = $('#curR');
    const cx = gsap.quickTo(cur, 'x', { duration: .08 }), cy = gsap.quickTo(cur, 'y', { duration: .08 });
    const rx = gsap.quickTo(ring, 'x', { duration: .38, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: .38, ease: 'power3' });
    addEventListener('mousemove', e => { cx(e.clientX); cy(e.clientY); rx(e.clientX); ry(e.clientY); });
    $$('[data-cur],button,input,select,textarea,.gcard,.layer-item').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('big'));
      el.addEventListener('mouseleave', () => ring.classList.remove('big'));
    });
    $$('[data-magnetic]').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * .28, y: (e.clientY - r.top - r.height / 2) * .35, duration: .35 });
      });
      el.addEventListener('mouseleave', () => gsap.to(el, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1,.4)' }));
    });
  }

  // =========================================================================
  //  THREE.JS — ULTRA-REALISTIC CINEMATIC 3D SOLAR PANEL (SZ-550M BI-FACIAL)
  // =========================================================================
  const canvas = $('#gl');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.28;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 0, 7.2);

  // Studio + Golden Hour Sky Environment Map for Hyper-Realistic Metallic & Glass Reflections
  (function buildHDRI() {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
    const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 512);
    gr.addColorStop(0, '#07142e');
    gr.addColorStop(0.38, '#1e4282');
    gr.addColorStop(0.49, '#ffae42');
    gr.addColorStop(0.54, '#ff6a00');
    gr.addColorStop(0.62, '#1c1417');
    gr.addColorStop(1, '#03060e');
    g.fillStyle = gr; g.fillRect(0, 0, 1024, 512);

    // Bright studio softboxes + golden sun disk for crisp specular highlights across the panel
    const sun = g.createRadialGradient(720, 235, 2, 720, 235, 150);
    sun.addColorStop(0, 'rgba(255,255,245,1)');
    sun.addColorStop(0.22, 'rgba(255,210,110,0.95)');
    sun.addColorStop(0.55, 'rgba(255,140,20,0.35)');
    sun.addColorStop(1, 'rgba(255,100,0,0)');
    g.fillStyle = sun; g.fillRect(0, 0, 1024, 512);

    // Studio key strip reflection
    g.fillStyle = 'rgba(220,235,255,0.45)';
    g.fillRect(140, 80, 260, 45);
    g.fillRect(480, 60, 180, 35);

    const tex = new THREE.CanvasTexture(c);
    const pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromEquirectangular(tex).texture;
    tex.dispose(); pm.dispose();
  })();

  // ---- High-Definition 144 Half-Cut Solar Cell Maps (Diffuse + 3D Bump + Metalness) ----
  function generateSolarCellMaps() {
    const W = 1024, H = 2048;
    const diffC = document.createElement('canvas'); diffC.width = W; diffC.height = H;
    const dg = diffC.getContext('2d');

    const bumpC = document.createElement('canvas'); bumpC.width = W; bumpC.height = H;
    const bg = bumpC.getContext('2d');

    // 1. High-contrast silver-white EVA backsheet base (visible in cell gaps & diamond chamfers)
    dg.fillStyle = '#d8e3f2';
    dg.fillRect(0, 0, W, H);
    // Outer dark anodized perimeter seal
    dg.strokeStyle = '#0b111e';
    dg.lineWidth = 36;
    dg.strokeRect(18, 18, W - 36, H - 36);

    bg.fillStyle = '#202020';
    bg.fillRect(0, 0, W, H);

    const mX = 28, mY = 40, cols = 6, rows = 24, gapX = 5.5, gapY = 4.5, midSplit = 26;
    const gridW = W - mX * 2, gridH = H - mY * 2;
    const cellW = (gridW - (cols - 1) * gapX) / cols;
    const cellH = (gridH - (rows - 2) * gapY - midSplit) / rows;

    for (let r = 0; r < rows; r++) {
      let y = mY + r * (cellH + gapY);
      if (r >= 12) y += (midSplit - gapY);

      for (let col = 0; col < cols; col++) {
        const x = mX + col * (cellW + gapX);

        // Deep Sapphire-Prussian Monocrystalline N-Type Silicon Wafer Gradient
        const grad = dg.createLinearGradient(x, y, x + cellW, y + cellH);
        const hueShift = ((r * 7 + col * 13) % 10) * 0.6;
        grad.addColorStop(0, `rgb(${7 + hueShift}, ${20 + hueShift}, ${48 + hueShift * 1.5})`);
        grad.addColorStop(0.48, `rgb(${13 + hueShift}, ${36 + hueShift * 1.2}, ${78 + hueShift * 1.8})`);
        grad.addColorStop(1, `rgb(${5 + hueShift}, ${15 + hueShift}, ${38 + hueShift})`);
        dg.fillStyle = grad;

        // Iconic 45-degree monocrystalline wafer corner chamfers (creates white diamonds at intersections)
        const ch = 9.5;
        dg.beginPath();
        dg.moveTo(x + ch, y);
        dg.lineTo(x + cellW - ch, y);
        dg.lineTo(x + cellW, y + ch);
        dg.lineTo(x + cellW, y + cellH - ch);
        dg.lineTo(x + cellW - ch, y + cellH);
        dg.lineTo(x + ch, y + cellH);
        dg.lineTo(x, y + cellH - ch);
        dg.lineTo(x, y + ch);
        dg.closePath();
        dg.fill();

        // Bump map raised wafer plateau
        bg.fillStyle = '#909090';
        bg.beginPath();
        bg.moveTo(x + ch, y);
        bg.lineTo(x + cellW - ch, y);
        bg.lineTo(x + cellW, y + ch);
        bg.lineTo(x + cellW, y + cellH - ch);
        bg.lineTo(x + cellW - ch, y + cellH);
        bg.lineTo(x + ch, y + cellH);
        bg.lineTo(x, y + cellH - ch);
        bg.lineTo(x, y + ch);
        bg.closePath();
        bg.fill();

        // Subtle silicon crystalline diagonal sheen inside wafer
        const sheen = dg.createLinearGradient(x, y + cellH, x + cellW, y);
        sheen.addColorStop(0, 'rgba(56,189,248,0)');
        sheen.addColorStop(0.5, 'rgba(56,189,248,0.07)');
        sheen.addColorStop(1, 'rgba(255,255,255,0)');
        dg.fillStyle = sheen;
        dg.fill();

        // 32 horizontal ultra-fine collector fingers
        dg.strokeStyle = 'rgba(185, 215, 250, 0.34)';
        dg.lineWidth = 0.65;
        const fStep = cellH / 33;
        dg.beginPath();
        for (let f = 1; f <= 32; f++) {
          const fy = y + f * fStep;
          dg.moveTo(x + 2, fy);
          dg.lineTo(x + cellW - 2, fy);
        }
        dg.stroke();

        // 10 Metallic Silver Multi-Busbars (MBB)
        dg.strokeStyle = 'rgba(238, 245, 255, 0.94)';
        dg.lineWidth = 1.45;
        bg.strokeStyle = '#ffffff';
        bg.lineWidth = 2.0;

        const bStep = cellW / 11;
        dg.beginPath();
        bg.beginPath();
        for (let b = 1; b <= 10; b++) {
          const bx = x + b * bStep;
          dg.moveTo(bx, y); dg.lineTo(bx, y + cellH);
          bg.moveTo(bx, y); bg.lineTo(bx, y + cellH);
        }
        dg.stroke();
        bg.stroke();

        // Silver solder pads along busbars
        dg.fillStyle = '#ffffff';
        for (let b = 1; b <= 10; b++) {
          const bx = x + b * bStep;
          dg.fillRect(bx - 1.3, y + 1.5, 2.6, 3.5);
          dg.fillRect(bx - 1.3, y + cellH / 2 - 1.5, 2.6, 3);
          dg.fillRect(bx - 1.3, y + cellH - 5, 2.6, 3.5);
        }

        // Anti-reflective wafer bevel edge highlight
        dg.strokeStyle = 'rgba(110, 175, 255, 0.38)';
        dg.lineWidth = 1.0;
        dg.stroke();
      }
    }

    // Center Split Busbar Interconnect Ribbons (metallic silver-copper busbar strip in center gap)
    const splitY = mY + 12 * (cellH + gapY) - gapY + midSplit / 2;
    dg.fillStyle = '#182438';
    dg.fillRect(mX, splitY - midSplit / 2 + 2, gridW, midSplit - 4);
    dg.strokeStyle = '#e8f0ff';
    dg.lineWidth = 2.6;
    dg.beginPath();
    for (let col = 0; col < cols; col++) {
      const x = mX + col * (cellW + gapX);
      const bStep = cellW / 11;
      for (let b = 1; b <= 10; b++) {
        const bx = x + b * bStep;
        dg.moveTo(bx, splitY - midSplit / 2);
        dg.lineTo(bx, splitY + midSplit / 2);
      }
    }
    dg.stroke();

    // Horizontal silver main busbar collector at top, center, and bottom
    dg.fillStyle = '#ced9ea';
    dg.fillRect(mX, mY - 8, gridW, 4);
    dg.fillRect(mX, H - mY + 4, gridW, 4);
    dg.fillRect(mX, splitY - 2.5, gridW, 5);

    // Bottom Corporate Laser Micro-Engraving
    dg.fillStyle = 'rgba(210, 228, 250, 0.85)';
    dg.font = 'bold 11px monospace';
    dg.textAlign = 'center';
    dg.fillText('SEZGİNLER SOLAR • SZ-550M-144HC N-TYPE TOPCON • CE / TÜV RHEINLAND IEC-61215 • IP68', W / 2, H - 14);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const diffTex = new THREE.CanvasTexture(diffC);
    diffTex.encoding = THREE.sRGBEncoding;
    diffTex.anisotropy = maxAniso;

    const bumpTex = new THREE.CanvasTexture(bumpC);
    bumpTex.anisotropy = maxAniso;

    return { diffTex, bumpTex };
  }

  function createBacksheetTexture() {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 2048;
    const g = c.getContext('2d');
    g.fillStyle = '#eef2f8'; g.fillRect(0, 0, 1024, 2048);

    // Subtle cell grid shadow visible through Tedlar sheet
    g.strokeStyle = 'rgba(165, 182, 205, 0.25)'; g.lineWidth = 2;
    for (let x = 165; x < 900; x += 160) { g.beginPath(); g.moveTo(x, 40); g.lineTo(x, 2008); g.stroke(); }
    for (let y = 80; y < 2000; y += 80) { g.beginPath(); g.moveTo(40, y); g.lineTo(984, y); g.stroke(); }

    // Center busbar trace
    g.fillStyle = '#cfd8e6';
    g.fillRect(40, 1012, 944, 24);

    // Official Corporate High-Voltage Spec Nameplate
    const lx = 242, ly = 290, lw = 540, lh = 410;
    g.fillStyle = '#ffffff'; g.fillRect(lx, ly, lw, lh);
    g.strokeStyle = '#1e293b'; g.lineWidth = 3; g.strokeRect(lx, ly, lw, lh);
    g.fillStyle = '#09152b'; g.fillRect(lx, ly, lw, 62);
    g.fillStyle = '#ffffff'; g.font = 'bold 20px sans-serif'; g.textAlign = 'center';
    g.fillText('SEZGİNLER SOLAR ENERJİ', lx + lw / 2, ly + 28);
    g.fillStyle = '#ffb800'; g.font = 'bold 10px sans-serif';
    g.fillText('N-TYPE TOPCON HALF-CUT PV MODULE • TIER-1 ENGINEERING', lx + lw / 2, ly + 49);

    g.textAlign = 'left'; g.fillStyle = '#0f172a';
    const specs = [
      ['Modül Tipi:', 'SZ-550M-144-HC (Bi-Facial)'],
      ['Nominal Maksimum Güç (Pmax):', '550 Wp (0 ~ +5W)'],
      ['Modül Dönüşüm Verimliliği:', '% 22.80'],
      ['Maksimum Güç Voltajı (Vmp):', '41.95 V DC'],
      ['Maksimum Güç Akımı (Imp):', '13.12 A'],
      ['Açık Devre Voltajı (Voc):', '49.80 V DC'],
      ['Kısa Devre Akımı (Isc):', '14.05 A'],
      ['Maksimum Sistem Voltajı:', '1500 V DC (IEC / UL)'],
      ['Koruma & Mekanik Dayanım:', 'IP68 · 5400 Pa Kar / 2400 Pa Rüzgar']
    ];
    let sy = ly + 86;
    for (const [k, v] of specs) {
      g.font = 'bold 11px sans-serif'; g.fillText(k, lx + 22, sy);
      g.font = 'bold 11px monospace'; g.fillText(v, lx + 295, sy);
      g.strokeStyle = 'rgba(0,0,0,0.08)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(lx + 18, sy + 5); g.lineTo(lx + lw - 18, sy + 5); g.stroke();
      sy += 21;
    }

    const wy = ly + lh - 62;
    g.fillStyle = '#fff5f5'; g.fillRect(lx + 18, wy, lw - 36, 46);
    g.strokeStyle = '#dc2626'; g.lineWidth = 1.5; g.strokeRect(lx + 18, wy, lw - 36, 46);
    g.fillStyle = '#dc2626'; g.font = 'bold 9.5px sans-serif'; g.textAlign = 'center';
    g.fillText('⚠ DİKKAT: GÜNEŞ IŞIĞI ALTINDA YÜKSEK DC GERİLİM ÜRETİR', lx + lw / 2, wy + 18);
    g.fillStyle = '#334155'; g.font = '8.5px sans-serif';
    g.fillText('IEC 61215 · IEC 61730 · TÜV Rheinland · CE · ISO 9001 · Ramazan Sezgin · 0546 728 5656', lx + lw / 2, wy + 35);

    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return tex;
  }

  // EVA Translucent Grid Texture for Exploded View Layer 2
  function createEvaTexture() {
    const c = document.createElement('canvas'); c.width = 512; c.height = 1024;
    const g = c.getContext('2d');
    g.fillStyle = 'rgba(200, 230, 255, 0.14)';
    g.fillRect(0, 0, 512, 1024);
    g.strokeStyle = 'rgba(120, 190, 255, 0.25)';
    g.lineWidth = 1;
    for (let x = 0; x < 512; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 1024); g.stroke(); }
    for (let y = 0; y < 1024; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
    return new THREE.CanvasTexture(c);
  }

  const { diffTex, bumpTex } = generateSolarCellMaps();
  const backsheetTex = createBacksheetTexture();
  const evaTex = createEvaTexture();

  const panel = new THREE.Group();
  scene.add(panel);
  const PW = 1.24, PH = 2.46, PD = 0.042;

  // ---- LAYER 5: Symmetric Anodized Aerospace Aluminum Structural Frame ----
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x181e29,
    metalness: 0.92,
    roughness: 0.24,
    envMapIntensity: 1.35
  });
  const silverClampMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    metalness: 0.95,
    roughness: 0.18,
    envMapIntensity: 1.5
  });

  const frame = new THREE.Group();
  const wallT = 0.022;
  const lipW = 0.018;
  const lipT = 0.004;

  // Left & Right C-channel side walls
  const vWallGeo = new THREE.BoxGeometry(wallT, PH + wallT * 2, PD);
  [-1, 1].forEach(s => {
    const wall = new THREE.Mesh(vWallGeo, frameMat);
    wall.position.set(s * (PW / 2 + wallT / 2), 0, 0);
    frame.add(wall);

    // Front glass-retention bezel lip (overlapping glass edge)
    const vLip = new THREE.Mesh(new THREE.BoxGeometry(wallT + lipW, PH + wallT * 2, lipT), frameMat);
    vLip.position.set(s * (PW / 2 + wallT / 2 - lipW / 2), 0, PD / 2 + lipT / 2);
    frame.add(vLip);

    // Rear mounting flange lip
    const vRearLip = new THREE.Mesh(new THREE.BoxGeometry(wallT + 0.028, PH, lipT), frameMat);
    vRearLip.position.set(s * (PW / 2 + wallT / 2 - 0.014), 0, -PD / 2 - lipT / 2);
    frame.add(vRearLip);
  });

  // Top & Bottom C-channel walls
  const hWallGeo = new THREE.BoxGeometry(PW, wallT, PD);
  [-1, 1].forEach(s => {
    const wall = new THREE.Mesh(hWallGeo, frameMat);
    wall.position.set(0, s * (PH / 2 + wallT / 2), 0);
    frame.add(wall);

    // Front bezel lip
    const hLip = new THREE.Mesh(new THREE.BoxGeometry(PW + wallT * 2, wallT + lipW, lipT), frameMat);
    hLip.position.set(0, s * (PH / 2 + wallT / 2 - lipW / 2), PD / 2 + lipT / 2);
    frame.add(hLip);
  });

  // 4 Brushed Metallic Corner Keys (Köşe Takozları)
  const cornerGeo = new THREE.BoxGeometry(0.055, 0.055, PD + 0.012);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
    const cMesh = new THREE.Mesh(cornerGeo, silverClampMat);
    cMesh.position.set(sx * (PW / 2 + 0.008), sy * (PH / 2 + 0.008), 0);
    frame.add(cMesh);
  });
  panel.add(frame);

  // ---- LAYER 4: Composite Tedlar Backsheet ----
  const backMat = new THREE.MeshStandardMaterial({
    map: backsheetTex,
    roughness: 0.72,
    metalness: 0.12
  });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), backMat);
  back.rotation.y = Math.PI;
  back.position.z = -0.012;
  panel.add(back);

  // ---- LAYER 3: 144 Half-Cut N-Type Monocrystalline Cell Matrix (With 3D Bump Relief) ----
  const cellMat = new THREE.MeshPhysicalMaterial({
    map: diffTex,
    bumpMap: bumpTex,
    bumpScale: 0.008,
    roughness: 0.18,
    metalness: 0.52,
    clearcoat: 0.9,
    clearcoatRoughness: 0.06,
    reflectivity: 0.9,
    envMapIntensity: 1.65
  });
  const cells = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), cellMat);
  cells.position.z = 0.006;
  panel.add(cells);

  // ---- LAYER 2: Translucent EVA Encapsulant Sheet ----
  const evaMat = new THREE.MeshPhysicalMaterial({
    map: evaTex,
    color: 0x93c5fd,
    transparent: true,
    opacity: 0.0, // becomes visible when exploded
    roughness: 0.25,
    metalness: 0.1,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const evaLayer = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), evaMat);
  evaLayer.position.z = 0.012;
  panel.add(evaLayer);

  // ---- LAYER 1: 3.2mm Low-Iron Tempered ARC Solar Glass (Custom Fresnel + Sun Glint Shader) ----
  const glassGroup = new THREE.Group();
  const glassShaderMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uSunPos: { value: new THREE.Vector3(5, 7, 6) },
      uOpacity: { value: 1.0 }
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      void main() {
        vUv = uv;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      uniform float uTime;
      uniform vec3 uSunPos;
      uniform float uOpacity;
      void main() {
        vec3 N = normalize(vWorldNormal);
        vec3 V = normalize(cameraPosition - vWorldPos);
        vec3 L = normalize(uSunPos - vWorldPos);
        vec3 H = normalize(V + L);

        // Fresnel grazing reflection (Sapphire ARC anti-reflective coating tint)
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.2);
        vec3 arcTint = mix(vec3(0.15, 0.45, 0.95), vec3(1.0, 0.78, 0.35), fresnel * 0.6);

        // Sharp solar specular highlight
        float spec = pow(max(dot(N, H), 0.0), 140.0);
        float softSpec = pow(max(dot(N, H), 0.0), 24.0) * 0.22;

        // Moving diagonal cinematic sun reflection band across the glass
        float sweepPos = sin(uTime * 0.55) * 0.65;
        float diag = (vUv.x - 0.5) * 0.8 + (vUv.y - 0.5) * 0.5 - sweepPos * 0.35;
        float sheenBand = exp(-diag * diag * 28.0) * 0.16;

        // Subtle beveled glass edge highlight
        float edgeX = min(vUv.x, 1.0 - vUv.x);
        float edgeY = min(vUv.y, 1.0 - vUv.y);
        float edge = smoothstep(0.018, 0.0, min(edgeX, edgeY)) * 0.45;

        vec3 col = arcTint * (fresnel * 0.35 + softSpec) + vec3(1.0, 0.96, 0.86) * (spec * 1.15 + sheenBand) + vec3(0.4, 0.85, 1.0) * edge;
        float alpha = clamp((fresnel * 0.28 + spec * 0.85 + softSpec + sheenBand + edge) * uOpacity, 0.0, 0.88);
        gl_FragColor = vec4(col, alpha);
      }
    `
  });
  const glassPane = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), glassShaderMat);
  glassGroup.add(glassPane);

  // Aquamarine Tempered Glass Edge Rim (visible when exploded)
  const glassEdgeMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0c4a6e,
    roughness: 0.1,
    metalness: 0.2,
    transparent: true,
    opacity: 0.65
  });
  const glassRim = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(PW, PH, 0.006)),
    new THREE.LineBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.55 })
  );
  glassGroup.add(glassRim);
  glassGroup.position.z = 0.018;
  panel.add(glassGroup);

  // ---- LAYER 6: Rear Heavy-Duty Mounting Rails + 3D IP68 Junction Boxes & MC4 Cables ----
  const jboxGroup = new THREE.Group();
  const jboxMat = new THREE.MeshStandardMaterial({ color: 0x11151f, roughness: 0.45, metalness: 0.35 });
  const cableMat = new THREE.MeshStandardMaterial({ color: 0x090b10, roughness: 0.7 });
  const mc4RedMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, metalness: 0.2 });
  const mc4BlueMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.3, metalness: 0.2 });

  // 2 Horizontal Anodized Aluminum Mounting Rails (Arka Taşıyıcı Konstrüksiyon Profilleri)
  const railGeo = new THREE.BoxGeometry(PW + 0.22, 0.048, 0.028);
  [-0.58, 0.58].forEach(ry => {
    const rail = new THREE.Mesh(railGeo, silverClampMat);
    rail.position.set(0, ry, -0.036);
    jboxGroup.add(rail);

    // Mounting clamps
    [-PW / 2, PW / 2].forEach(cx => {
      const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.068, 0.038), frameMat);
      clamp.position.set(cx, ry, -0.032);
      jboxGroup.add(clamp);
    });
  });

  // 3 Split IP68 Junction Boxes with Cooling Fins
  [-0.34, 0, 0.34].forEach(bx => {
    const boxMesh = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.085, 0.024), jboxMat);
    boxMesh.position.set(bx, 0, -0.025);
    jboxGroup.add(boxMesh);

    // Cooling fins
    for (let f = -0.025; f <= 0.025; f += 0.012) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.004, 0.028), frameMat);
      fin.position.set(bx, f, -0.026);
      jboxGroup.add(fin);
    }
  });

  function createCable(isPositive) {
    const curve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(isPositive ? -0.34 : 0.34, -0.03, -0.026),
      new THREE.Vector3(isPositive ? -0.26 : 0.26, -0.22, -0.048),
      new THREE.Vector3(isPositive ? -0.14 : 0.14, -0.38, -0.052),
      new THREE.Vector3(isPositive ? -0.09 : 0.09, -0.52, -0.042)
    );
    const tubeGeo = new THREE.TubeGeometry(curve, 24, 0.0075, 10, false);
    jboxGroup.add(new THREE.Mesh(tubeGeo, cableMat));

    const mc4Mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.055, 14), cableMat);
    mc4Mesh.position.set(isPositive ? -0.09 : 0.09, -0.54, -0.042);
    jboxGroup.add(mc4Mesh);

    const ringMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.012, 14), isPositive ? mc4RedMat : mc4BlueMat);
    ringMesh.position.set(isPositive ? -0.09 : 0.09, -0.53, -0.042);
    jboxGroup.add(ringMesh);
  }
  createCable(true);
  createCable(false);
  panel.add(jboxGroup);

  // ---- Cinematic Studio & Solar Lighting ----
  scene.add(new THREE.AmbientLight(0x9ab4dc, 0.85));
  const sunKey = new THREE.DirectionalLight(0xfff5e0, 3.4);
  sunKey.position.set(5, 7, 6);
  scene.add(sunKey);

  const skyRim = new THREE.DirectionalLight(0x38bdf8, 1.8);
  skyRim.position.set(-6, -3, 4);
  scene.add(skyRim);

  const backRim = new THREE.DirectionalLight(0xffb800, 1.5);
  backRim.position.set(0, 5, -5);
  scene.add(backRim);

  const orbitLight = new THREE.PointLight(0xffc864, 2.6, 14);
  scene.add(orbitLight);

  // ---- Golden Solar Photon Particles ----
  const N = 280, pos = new Float32Array(N * 3), spd = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - .5) * 15;
    pos[i * 3 + 1] = (Math.random() - .5) * 10;
    pos[i * 3 + 2] = (Math.random() - .5) * 8 - 1;
    spd[i] = .12 + Math.random() * .32;
  }
  const pgeo = new THREE.BufferGeometry();
  pgeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dot = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d');
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, 'rgba(255,235,170,1)');
    r.addColorStop(0.4, 'rgba(255,180,40,0.6)');
    r.addColorStop(1, 'rgba(255,140,0,0)');
    g.fillStyle = r; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();
  const pts = new THREE.Points(pgeo, new THREE.PointsMaterial({
    map: dot, size: .14, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .85
  }));
  scene.add(pts);

  // ---- Pose System & Interactive 3D HUD Controller ----
  const P = { x: 2.2, y: 0.05, s: .4, rx: -.45, ry: -2.4, rz: .4, e: 1.4 };
  const POSES = {
    hero:    { x: 2.15, y: 0.08, s: 1.08, rx: -.18, ry: -.54, rz: .06, e: 0 },
    none:    { x: 0,    y: 0,    s: 0,    rx: -.18, ry: .5,   rz: 0,   e: 0 },
    mission: { x: 0,    y: 0.05, s: 1.48, rx: -1.12, ry: 0,   rz: .0,  e: 0 },
    arge:    { x: 2.35, y: 0.02, s: 1.04, rx: -.24, ry: -.68, rz: .05, e: 1.15 },
    contact: { x: -2.55, y: -.08, s: .88,  rx: -.18, ry: .65,  rz: -.04, e: 0 }
  };

  let currentPose = '';
  let manualOverride = false;

  function setHudActive(mode) {
    $$('#hudDock .hud-btn').forEach(b => b.classList.toggle('active', b.dataset.cam === mode));
  }

  window.__goPose = name => {
    if (name === currentPose || !POSES[name]) return;
    currentPose = name;
    manualOverride = false;
    if (hudDock) hudDock.classList.toggle('hidden', name === 'none');
    setHudActive(name === 'arge' ? 'explode' : 'default');
    const first = !window.__assembled; window.__assembled = true;
    gsap.to(P, { ...POSES[name], duration: first ? 3.2 : 1.8, ease: first ? 'expo.out' : 'power3.inOut', overwrite: true });
  };

  let introDone = false;
  setTimeout(() => introDone = true, 2000);
  $$('[data-pose]').forEach(sec => {
    const n = sec.dataset.pose;
    ScrollTrigger.create({
      trigger: sec, start: 'top 55%', end: 'bottom 45%',
      onToggle: s => { if (s.isActive && introDone) window.__goPose(n); else if (s.isActive) currentPose = ''; }
    });
  });

  // Interactive 3D HUD Dock Buttons
  $$('#hudDock .hud-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.cam;
      setHudActive(mode);
      manualOverride = true;
      const baseX = currentPose === 'arge' ? 2.35 : (currentPose === 'mission' ? 0 : 2.15);
      if (mode === 'default') {
        gsap.to(P, { x: baseX, y: 0.06, s: 1.08, rx: -0.18, ry: -0.54, rz: 0.06, e: 0, duration: 1.4, ease: 'power3.inOut' });
      } else if (mode === 'explode') {
        gsap.to(P, { x: baseX, y: 0.04, s: 1.04, rx: -0.24, ry: -0.68, rz: 0.05, e: 1.25, duration: 1.5, ease: 'power3.inOut' });
      } else if (mode === 'back') {
        gsap.to(P, { x: baseX, y: 0.06, s: 1.08, rx: 0.12, ry: Math.PI - 0.48, rz: -0.04, e: 0.15, duration: 1.6, ease: 'power3.inOut' });
      } else if (mode === 'macro') {
        gsap.to(P, { x: baseX * 0.75, y: -0.15, s: 1.78, rx: -0.12, ry: -0.32, rz: 0.02, e: 0, duration: 1.5, ease: 'power3.inOut' });
      }
    });
  });

  // Interactive Layer List in AR-GE Section (hover + touch click)
  $$('.layer-item').forEach(item => {
    const activateLayer = () => {
      $$('.layer-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const layerIdx = +item.dataset.layer;
      if (layerIdx === 5) {
        gsap.to(P, { ry: Math.PI - 0.65, e: 1.1, duration: 1.3, ease: 'power3.out' });
      } else {
        gsap.to(P, { ry: -0.68, e: 1.15 + layerIdx * 0.08, duration: 1.2, ease: 'power3.out' });
      }
    };
    item.addEventListener('mouseenter', activateLayer);
    item.addEventListener('click', activateLayer);
  });

  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();

  let mx = 0, my = 0, smx = 0, smy = 0;
  addEventListener('mousemove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const T = clock.getElapsedTime();
    smx += (mx - smx) * .05;
    smy += (my - smy) * .05;

    const mobile = innerWidth < 900;
    const k = mobile ? 0.18 : Math.min(1, innerWidth / 1320);
    const py = mobile ? (currentPose === 'hero' ? 0.25 : 0.05) : P.y;
    panel.position.set(P.x * k, py + Math.sin(T * .85) * .05, 0);

    const sc = Math.max(P.s, 0.0001) * (mobile ? .62 : Math.min(1, innerWidth / 1220 + .15));
    panel.scale.setScalar(sc);
    panel.visible = P.s > .01;
    panel.rotation.set(
      P.rx + smy * .22 + Math.cos(T * .4) * .02,
      P.ry + smx * .38 + Math.sin(T * .5) * .06,
      P.rz
    );

    // Exploded View Layer Offsets (5 distinct engineering layers)
    const e = P.e;
    glassGroup.position.z = 0.018 + e * 0.48;
    evaLayer.position.z = 0.012 + e * 0.26;
    evaMat.opacity = Math.min(0.55, e * 0.42);
    cells.position.z = 0.006 + e * 0.04;
    back.position.z = -0.012 - e * 0.22;
    frame.position.z = -e * 0.44;
    jboxGroup.position.z = -e * 0.68;

    glassShaderMat.uniforms.uTime.value = T;
    orbitLight.position.set(Math.cos(T * .65) * 4.5, Math.sin(T * .45) * 3.2, 3.5);
    glassShaderMat.uniforms.uSunPos.value.set(4 + Math.cos(T * .4) * 2.5, 6 + Math.sin(T * .3) * 2, 5.5);

    const a = pgeo.attributes.position.array;
    for (let i = 0; i < N; i++) {
      a[i * 3 + 1] += spd[i] * .011;
      if (a[i * 3 + 1] > 4.8) a[i * 3 + 1] = -4.8;
    }
    pgeo.attributes.position.needsUpdate = true;
    pts.rotation.y = T * .015;

    renderer.render(scene, camera);
  });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
