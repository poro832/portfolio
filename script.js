(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && 'IntersectionObserver' in window) root.classList.add('js');

  // header: hairline once the page moves, menu on small screens
  var top = document.querySelector('.top');
  function onScroll() { top.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  var menu = document.querySelector('.menu');
  var nav = document.getElementById('nav');
  function setMenu(open) { menu.setAttribute('aria-expanded', String(open)); nav.classList.toggle('open', open); }
  menu.addEventListener('click', function () { setMenu(menu.getAttribute('aria-expanded') !== 'true'); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });

  // nav marks the section in view
  var links = Array.prototype.slice.call(nav.querySelectorAll('a'));
  if ('IntersectionObserver' in window) {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(function (a) { var s = document.querySelector(a.getAttribute('href')); if (s) seen.observe(s); });
  }

  // sections rise in as they arrive
  if (root.classList.contains('js')) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    document.querySelectorAll('[data-reveal]').forEach(function (el) { io.observe(el); });
  }

  // home: the word before "서비스를 만듭니다" types itself in and out
  var typed = document.querySelector('.typed');
  var words = ['음성 AI', '문서 AI', 'LLM 기반', '검증 가능한'];
  if (typed && !reduce) {
    var w = 0, n = words[0].length, back = false;
    (function tick() {
      var word = words[w];
      typed.textContent = word.slice(0, n);
      var wait = back ? 55 : 110;
      if (!back && n === word.length) { back = true; wait = 1800; }
      else if (back && n === 0) { back = false; w = (w + 1) % words.length; wait = 300; }
      n += back ? -1 : 1;
      if (back && n < 0) n = 0;
      setTimeout(tick, wait);
    })();
  }

  // home orbit: each logo runs on a tilted circle around the planet. Its depth decides everything
  // the eye reads as 3D: behind the planet it is small, faint and under the disc; in front it is
  // large, bright and over it. The pointer leans the rings a little.
  var orbit = document.querySelector('.orbit');
  var stage = document.querySelector('.orbit-stage');
  var hero = document.querySelector('.hero');
  if (orbit && stage) {
    root.classList.add('orbit-on');
    var D = Math.PI / 180;
    var rings = [
      { r: 285, tilt: 70, roll: -14, period: 26, dir: 1, el: null },
      { r: 395, tilt: 77, roll: 10, period: 40, dir: -1, el: null }
    ];
    var sats = Array.prototype.slice.call(stage.querySelectorAll('.sat')).map(function (el) {
      return { el: el, ring: rings[+el.dataset.ring] };
    });
    rings.forEach(function (ring, ri) {
      var mine = sats.filter(function (s) { return s.ring === ring; });
      mine.forEach(function (s, i) { s.phase = (i / mine.length) * Math.PI * 2; });
    });
    // the planet is a small Earth: every project is a continent, drawn on a canvas each frame as
    // the globe turns on a 23.4° axis — land bends at the rim and slips round the back
    var R = 175, SPIN = 24, TILT_Z = -23.4 * D, TILT_X = 12 * D;
    var canvas = stage.querySelector('.earth');
    var ctx = canvas && canvas.getContext('2d');
    var C = canvas ? canvas.width / 2 : 0;                 // canvas centre = radius, in canvas pixels
    var TONES = ['#5fd2ff', '#7fb2ff', '#3fd6c2'];
    function seeded(n) { return function () { n = (n * 9301 + 49297) % 233280; return n / 233280; }; }
    var lands = Array.prototype.slice.call(stage.querySelectorAll('.city')).map(function (el, i) {
      var lon0 = +el.dataset.lon * D, lat0 = +el.dataset.lat * D, size = +el.dataset.size * D;
      // a coastline: a wobbly ring around the centre, the same every visit
      var rnd = seeded(i * 7919 + 13), ph = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28], shape = [];
      for (var k = 0; k < 48; k++) {
        var a = (k / 48) * Math.PI * 2;
        var r = size * (1 + 0.22 * Math.sin(2 * a + ph[0]) + 0.14 * Math.sin(3 * a + ph[1]) + 0.08 * Math.sin(5 * a + ph[2]));
        shape.push([lon0 + r * Math.cos(a) / Math.cos(lat0), lat0 + 0.8 * r * Math.sin(a)]);
      }
      return { el: el, lon: lon0, lat: lat0, shape: shape, tone: TONES[+el.dataset.tone || 0] };
    });
    // a point (lon, lat) on the unit sphere after the day's turn, the axial tilt and the pointer's lean
    function onSphere(lon, lat, spin) {
      var l = lon + spin;
      var x = Math.cos(lat) * Math.sin(l), y = -Math.sin(lat), z = Math.cos(lat) * Math.cos(l);
      var y1 = y * Math.cos(TILT_X) - z * Math.sin(TILT_X), z1 = y * Math.sin(TILT_X) + z * Math.cos(TILT_X);
      var yaw = px * 9 * D;
      var x2 = x * Math.cos(yaw) + z1 * Math.sin(yaw), z2 = -x * Math.sin(yaw) + z1 * Math.cos(yaw);
      return { x: x2 * Math.cos(TILT_Z) - y1 * Math.sin(TILT_Z), y: x2 * Math.sin(TILT_Z) + y1 * Math.cos(TILT_Z), z: z2 };
    }
    function drawEarth(spin) {
      if (!ctx) return;
      ctx.clearRect(0, 0, C * 2, C * 2);
      ctx.save();
      ctx.beginPath(); ctx.arc(C, C, C, 0, Math.PI * 2); ctx.clip();
      var sea = ctx.createRadialGradient(C * 0.8, C * 0.62, C * 0.05, C, C, C);
      sea.addColorStop(0, '#1f4fc4'); sea.addColorStop(0.45, '#12348c'); sea.addColorStop(0.8, '#0a1d55'); sea.addColorStop(1, '#050d27');
      ctx.fillStyle = sea; ctx.fillRect(0, 0, C * 2, C * 2);
      lands.forEach(function (L) {
        var pts = L.shape.map(function (p) { return onSphere(p[0], p[1], spin); });
        if (!pts.some(function (q) { return q.z > 0; })) return;      // wholly on the far side
        ctx.beginPath();
        pts.forEach(function (q, i) {
          var x = q.x, y = q.y;
          if (q.z < 0) { var m = Math.sqrt(x * x + y * y) || 1; x /= m; y /= m; }   // the part round the back hugs the rim
          if (i) ctx.lineTo(C + x * C, C + y * C); else ctx.moveTo(C + x * C, C + y * C);
        });
        ctx.closePath();
        // land with a glowing coast, then a lighter upland toward the light
        ctx.shadowColor = 'rgba(120, 220, 255, .8)'; ctx.shadowBlur = 14;
        ctx.fillStyle = L.tone; ctx.fill();
        ctx.shadowBlur = 0;
        var up = ctx.createLinearGradient(0, 0, C * 2, C * 2);
        up.addColorStop(0, 'rgba(255, 255, 255, .35)'); up.addColorStop(0.6, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = up; ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(230, 248, 255, .9)'; ctx.stroke();
      });
      // sunlight from the upper left, night gathering at the rim
      var lit = ctx.createRadialGradient(C * 0.62, C * 0.5, C * 0.05, C * 0.62, C * 0.5, C * 1.25);
      lit.addColorStop(0, 'rgba(255, 255, 255, .28)'); lit.addColorStop(0.45, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = lit; ctx.fillRect(0, 0, C * 2, C * 2);
      var limb = ctx.createRadialGradient(C, C, C * 0.55, C, C, C);
      limb.addColorStop(0, 'rgba(3, 8, 28, 0)'); limb.addColorStop(1, 'rgba(3, 8, 28, .7)');
      ctx.fillStyle = limb; ctx.fillRect(0, 0, C * 2, C * 2);
      ctx.restore();
      // a thin atmosphere on the rim
      ctx.beginPath(); ctx.arc(C, C, C - 1.5, 0, Math.PI * 2);
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(120, 200, 255, .55)'; ctx.stroke();
    }
    function smooth(e0, e1, v) { var u = Math.max(0, Math.min(1, (v - e0) / (e1 - e0))); return u * u * (3 - 2 * u); }

    var back = stage.querySelector('.paths-back');
    var front = stage.querySelector('.paths-front');
    var px = 0, py = 0, tx = 0, ty = 0;

    function place(ring, th) {
      var x = ring.r * Math.cos(th), y = ring.r * Math.sin(th);
      var tilt = (ring.tilt - py * 7) * D;
      var y1 = y * Math.cos(tilt), z = y * Math.sin(tilt);
      var yaw = px * 9 * D;
      var x1 = x * Math.cos(yaw) + z * Math.sin(yaw);
      z = -x * Math.sin(yaw) + z * Math.cos(yaw);
      var roll = ring.roll * D;
      var X = x1 * Math.cos(roll) - y1 * Math.sin(roll);
      var Y = x1 * Math.sin(roll) + y1 * Math.cos(roll);
      var d = Math.max(-1, Math.min(1, z / ring.r));
      var spread = 1 + 0.1 * d;
      return { x: X * spread, y: Y * spread, d: d };
    }

    function drawPaths() {
      var b = '', f = '';
      rings.forEach(function (ring, ri) {
        var segB = '', segF = '', prev = null;
        for (var i = 0; i <= 120; i++) {
          var q = place(ring, (i / 120) * Math.PI * 2);
          var pt = q.x.toFixed(1) + ' ' + q.y.toFixed(1);
          var isFront = q.d >= 0;
          if (isFront) { segF += (prev === true ? ' L' : ' M') + pt; }
          else { segB += (prev === false ? ' L' : ' M') + pt; }
          prev = isFront;
        }
        b += '<path class="p' + ri + '" d="' + segB + '"/>';
        f += '<path class="p' + ri + '" d="' + segF + '"/>';
      });
      back.innerHTML = b;
      front.innerHTML = f;
    }

    function frame(t) {
      px += (tx - px) * 0.06; py += (ty - py) * 0.06;
      sats.forEach(function (s) {
        var th = s.phase + s.ring.dir * (t / 1000) * (Math.PI * 2 / s.ring.period);
        var q = place(s.ring, th);
        var k = (q.d + 1) / 2;                 // 0 at the far side, 1 nearest the reader
        var scale = 0.48 + 0.66 * k;           // about half size behind the planet
        s.el.style.transform = 'translate(' + q.x.toFixed(1) + 'px,' + q.y.toFixed(1) + 'px) scale(' + scale.toFixed(3) + ')';
        s.el.style.opacity = (0.3 + 0.7 * k).toFixed(3);
        s.el.style.zIndex = q.d < 0 ? 1 : 5;   // behind: under the planet; in front: over the planet, its services and the rings
        s.d = q.d;
      });
      var spin = (t / 1000) * (Math.PI * 2 / SPIN);
      drawEarth(spin);
      lands.forEach(function (L) {
        var q = onSphere(L.lon, L.lat, spin);
        var seen = smooth(0.2, 0.55, q.z);    // a tag shows while its continent faces the reader
        L.el.style.transform = 'translate(' + (q.x * R).toFixed(1) + 'px,' + (q.y * R).toFixed(1) + 'px)';
        L.el.style.opacity = seen.toFixed(3);
        L.el.style.visibility = seen > 0.01 ? 'visible' : 'hidden';
      });
    }


    function fit() {
      // on a phone the rings draw in closer to the planet, so the planet can stay large
      // while the outer ring still fits inside the screen
      var w = orbit.clientWidth, narrow = w < 560;
      rings[0].r = narrow ? 228 : 285;
      rings[1].r = narrow ? 292 : 395;
      var k = Math.max(0.38, Math.min(1, narrow ? w / 640 : w / 600));
      stage.style.setProperty('--k', k.toFixed(3));
      drawPaths();
    }
    fit();
    window.addEventListener('resize', fit);
    frame(0);

    if (!reduce) {
      var running = false;
      var loop = function (t) {
        if (!running) return;
        var leaning = Math.abs(tx - px) > 0.002 || Math.abs(ty - py) > 0.002;
        frame(t);
        if (leaning) drawPaths();
        requestAnimationFrame(loop);
      };
      // only spend frames while the home screen is on view
      new IntersectionObserver(function (entries) {
        var on = entries[0].isIntersecting;
        if (on && !running) { running = true; requestAnimationFrame(loop); }
        else if (!on) running = false;
      }).observe(orbit);
      if (window.matchMedia('(hover: hover)').matches) {
        hero.addEventListener('pointermove', function (e) {
          var r = orbit.getBoundingClientRect();
          tx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2)));
          ty = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2)));
        });
        hero.addEventListener('pointerleave', function () { tx = 0; ty = 0; });
      }
    }
  }

  // projects: filter by area
  var fbtns = document.querySelectorAll('.filters button');
  var cards = document.querySelectorAll('.proj');
  fbtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.dataset.f;
      fbtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      cards.forEach(function (c) { c.hidden = f !== 'all' && (' ' + c.dataset.cat + ' ').indexOf(' ' + f + ' ') === -1; });
    });
  });

  // deep dive: tabs, arrow keys move between them
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.dd-tabs [role="tab"]'));
  function select(tab) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(t); });
    t.addEventListener('keydown', function (e) {
      var k = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!k) return;
      var next = tabs[(i + k + tabs.length) % tabs.length];
      select(next); next.focus(); e.preventDefault();
    });
  });
  // "자세히" on a project card opens its tab
  document.querySelectorAll('[data-tab]').forEach(function (a) {
    a.addEventListener('click', function () { var t = document.getElementById('tab-' + a.dataset.tab); if (t) select(t); });
  });

  // demo windows light up their steps in order while on screen
  document.querySelectorAll('.win[data-cycle]').forEach(function (win) {
    var steps = win.querySelectorAll('.step');
    if (reduce || !steps.length || !('IntersectionObserver' in window)) return;
    win.classList.add('cycling');
    var i = 0, timer = null;
    function tick() {
      if (i < steps.length) { steps[i].classList.add('on'); i++; timer = setTimeout(tick, 650); }
      else { timer = setTimeout(function () { steps.forEach(function (s) { s.classList.remove('on'); }); i = 0; tick(); }, 3000); }
    }
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && !timer) tick();
        else if (!en.isIntersecting) { clearTimeout(timer); timer = null; }
      });
    }, { threshold: 0.2 }).observe(win);
  });

  // LittleBoss: the same three tries as backend/utils/ai.py _parse_response
  var body = '{\n  "document_type": "장학금 공지",\n  "summary": "2학기 교내 장학금 신청 안내",\n  "deadlines": [\n    {"date": "2026-09-12", "urgency": "high"}\n  ]\n}';
  var cases = {
    ok: body,
    fence: '```json\n' + body + '\n```',
    prose: '분석 결과입니다.\n' + body + '\n더 궁금한 점이 있으면 말씀해 주세요.',
    broken: '{\n  "document_type": "장학금 공지",\n  "deadlines": [\n    {"date": "2026-09-12"}'
  };
  var fallback = { document_type: '알 수 없음', summary: '분석 실패 - 다시 시도해주세요', deadlines: [] };
  function parse(raw) {
    var tries = [];
    var cleaned = raw.replace(/```json\s*|\s*```/g, '').trim();
    try { var a = JSON.parse(cleaned); tries.push('ok'); return { data: a, tries: tries }; } catch (e) { tries.push('fail'); }
    var s = cleaned.indexOf('{'), e2 = cleaned.lastIndexOf('}');
    if (s !== -1 && e2 !== -1 && e2 > s) {
      try { var b = JSON.parse(cleaned.slice(s, e2 + 1)); tries.push('ok'); return { data: b, tries: tries }; } catch (e) { tries.push('fail'); }
    } else {
      tries.push('fail');
    }
    tries.push('ok');
    return { data: fallback, tries: tries };
  }
  function esc(t) { return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function paint(raw) {
    return esc(raw)
      .replace(/(```json|```)/g, '<span class="x">$1</span>')
      .replace(/"([a-z_]+)"(?=:)/g, '<span class="k">"$1"</span>')
      .replace(/: "([^"]*)"/g, ': <span class="s">"$1"</span>');
  }
  var rawEl = document.getElementById('raw');
  var outEl = document.getElementById('out');
  var stages = document.querySelectorAll('.stages li');
  var labels = { ok: '성공', fail: '실패', skip: '건너뜀' };
  function show(name) {
    var raw = cases[name];
    rawEl.innerHTML = paint(raw);
    var res = parse(raw);
    stages.forEach(function (li, i) { var r = res.tries[i] || 'skip'; li.dataset.r = r; li.querySelector('em').textContent = labels[r]; });
    var d = res.data, failed = d === fallback, due = d.deadlines && d.deadlines[0];
    outEl.innerHTML =
      '<span class="doc-type' + (failed ? ' bad' : '') + '">' + esc(d.document_type) + '</span>' +
      '<span>' + esc(d.summary || '') + '</span>' +
      (due ? '<span class="due">마감 <b>' + esc(due.date) + '</b>' + (due.urgency === 'high' ? ' · 급함' : '') + '</span>' : '<span class="due">마감일 없음 · 화면 구조는 그대로</span>');
  }
  var ptabs = document.querySelectorAll('.ptabs button');
  ptabs.forEach(function (btn) {
    btn.addEventListener('click', function () {
      ptabs.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      show(btn.dataset.case);
    });
  });
  if (rawEl) show('ok');

  // contact: a static page can't send mail, so the form fills in the reader's mail app
  var form = document.getElementById('mailform');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = form.elements;
    var who = [f.name.value.trim(), f.org.value.trim()].filter(Boolean).join(' · ');
    var subject = f.subject.value.trim() || '포트폴리오를 보고 연락드립니다';
    var text = (who ? '보내는 사람: ' + who + '\n\n' : '') + f.message.value.trim();
    location.href = 'mailto:ldd0826@naver.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(text);
  });
})();
