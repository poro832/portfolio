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
      { r: 285, tilt: 70, roll: -14, period: 28, dir: 1, aMin: 0.95, aMax: 1.08, eMax: 0.24, rgb: '77, 141, 255', trailMs: 3300 },
      { r: 395, tilt: 77, roll: 10, period: 44, dir: -1, aMin: 0.88, aMax: 0.97, eMax: 0.19, rgb: '54, 194, 240', trailMs: 4100 }
    ];
    var sats = Array.prototype.slice.call(stage.querySelectorAll('.sat')).map(function (el) {
      return { el: el, ring: rings[+el.dataset.ring] };
    });
    // the planet is a small Earth: every project is a continent, drawn on a canvas each frame as
    // the globe turns on a 23.4° axis — land bends at the rim and slips round the back
    var R = 175, SPIN = 24, TILT_Z = -23.4 * D, TILT_X = 12 * D, S = 1.4;
    var canvas = stage.querySelector('.earth');
    var ctx = canvas && canvas.getContext('2d');
    var C = canvas ? canvas.width / 2 : 0;
    var TONES = ['#5fd2ff', '#7fb2ff', '#3fd6c2'];
    function seeded(n) { return function () { n = (n * 9301 + 49297) % 233280; return n / 233280; }; }
    var lands = Array.prototype.slice.call(stage.querySelectorAll('.city')).map(function (el, i) {
      var lon0 = +el.dataset.lon * D, lat0 = +el.dataset.lat * D, size = +el.dataset.size * D;
      var rnd = seeded(i * 7919 + 13), ph = [rnd() * 6.28, rnd() * 6.28, rnd() * 6.28], shape = [];
      for (var k = 0; k < 48; k++) {
        var a = (k / 48) * Math.PI * 2;
        var r = size * (1 + 0.22 * Math.sin(2 * a + ph[0]) + 0.14 * Math.sin(3 * a + ph[1]) + 0.08 * Math.sin(5 * a + ph[2]));
        shape.push([lon0 + r * Math.cos(a) / Math.cos(lat0), lat0 + 0.8 * r * Math.sin(a)]);
      }
      return { el: el, lon: lon0, lat: lat0, shape: shape, tone: TONES[+el.dataset.tone || 0] };
    });
    lands.forEach(function (L) { L.hw = L.el.textContent.trim().length * 4.3 + 12; L.fade = 1; });
    var px = 0, py = 0, tx = 0, ty = 0;
    var orbitRnd = seeded(61);
    rings.forEach(function (ring) {
      var mine = sats.filter(function (o) { return o.ring === ring; });
      mine.forEach(function (o, i) {
        o.aMul = ring.aMin + orbitRnd() * (ring.aMax - ring.aMin);
        o.e = ring.eMax * (0.35 + 0.65 * orbitRnd());
        o.peri = orbitRnd() * Math.PI * 2;
        o.tilt = ring.tilt + (orbitRnd() - 0.5) * 16;
        o.roll = ring.roll + (orbitRnd() - 0.5) * 18;
        o.phase = (i / mine.length) * Math.PI * 2 + (orbitRnd() - 0.5) * 0.25;
      });
    });
    function view(x, y, z) {
      var y1 = y * Math.cos(TILT_X) - z * Math.sin(TILT_X), z1 = y * Math.sin(TILT_X) + z * Math.cos(TILT_X);
      var yaw = px * 9 * D;
      var x2 = x * Math.cos(yaw) + z1 * Math.sin(yaw), z2 = -x * Math.sin(yaw) + z1 * Math.cos(yaw);
      return { x: x2 * Math.cos(TILT_Z) - y1 * Math.sin(TILT_Z), y: x2 * Math.sin(TILT_Z) + y1 * Math.cos(TILT_Z), z: z2 };
    }
    function onSphere(lon, lat, spin) {
      var l = lon + spin;
      return view(Math.cos(lat) * Math.sin(l), -Math.sin(lat), Math.cos(lat) * Math.cos(l));
    }
    function rim(x, y) { var m = Math.sqrt(x * x + y * y) || 1; return [x / m, y / m]; }
    function outline(L, spin) {
      var pts = L.shape.map(function (p) { return onSphere(p[0], p[1], spin); });
      if (!pts.some(function (q) { return q.z > 0; })) return null;
      var out = [], n = pts.length;
      for (var i = 0; i < n; i++) {
        var a = pts[i], b = pts[(i + 1) % n];
        out.push(a.z >= 0 ? [a.x, a.y] : rim(a.x, a.y));
        if ((a.z >= 0) !== (b.z >= 0)) {
          var t = a.z / (a.z - b.z);
          out.push(rim(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t));
        }
      }
      return out;
    }
    function trace(pts, dx, dy) {
      ctx.beginPath();
      pts.forEach(function (p, i) {
        var x = C + p[0] * C + dx, y = C + p[1] * C + dy;
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      });
      ctx.closePath();
    }
    function glow(x, y, r0, r1, stops) {
      var g = ctx.createRadialGradient(x, y, r0, x, y, r1);
      stops.forEach(function (st) { g.addColorStop(st[0], st[1]); });
      ctx.fillStyle = g; ctx.fillRect(0, 0, C * 2, C * 2);
    }
    function drawEarth(spin) {
      if (!ctx) return;
      ctx.clearRect(0, 0, C * 2, C * 2);
      ctx.save();
      ctx.beginPath(); ctx.arc(C, C, C, 0, Math.PI * 2); ctx.clip();
      var sea = ctx.createRadialGradient(C * 0.62, C * 0.5, C * 0.04, C * 0.8, C * 0.75, C * 1.3);
      sea.addColorStop(0, '#3a7cf0'); sea.addColorStop(0.35, '#1d4cba'); sea.addColorStop(0.7, '#0f2c78'); sea.addColorStop(1, '#06123a');
      ctx.fillStyle = sea; ctx.fillRect(0, 0, C * 2, C * 2);
      ctx.lineJoin = 'round';
      lands.forEach(function (L) {
        var pts = outline(L, spin);
        if (!pts) return;
        trace(pts, 0, 0);
        ctx.lineWidth = 14; ctx.strokeStyle = 'rgba(120, 210, 255, .16)'; ctx.stroke();
        trace(pts, C * 0.016, C * 0.022);
        ctx.fillStyle = 'rgba(2, 10, 40, .6)'; ctx.fill();
        trace(pts, 0, 0);
        ctx.fillStyle = L.tone; ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(235, 248, 255, .85)'; ctx.stroke();
      });
      glow(C * 0.6, C * 0.48, C * 0.05, C * 1.5, [[0, 'rgba(3, 8, 30, 0)'], [0.42, 'rgba(3, 8, 30, .06)'], [0.7, 'rgba(3, 8, 30, .55)'], [1, 'rgba(3, 8, 30, .9)']]);
      glow(C * 0.56, C * 0.42, 0, C * 0.6, [[0, 'rgba(255, 255, 255, .34)'], [1, 'rgba(255, 255, 255, 0)']]);
      glow(C * 0.52, C * 0.36, 0, C * 0.18, [[0, 'rgba(255, 255, 255, .3)'], [1, 'rgba(255, 255, 255, 0)']]);
      glow(C, C, C * 0.8, C, [[0, 'rgba(120, 200, 255, 0)'], [1, 'rgba(120, 200, 255, .42)']]);
      ctx.restore();
    }

    var VS = 'attribute vec2 a; uniform float uS; varying vec2 v; void main() { v = a * uS; gl_Position = vec4(a, 0.0, 1.0); }';
    var FS = [
      '#ifdef GL_FRAGMENT_PRECISION_HIGH', 'precision highp float;', '#else', 'precision mediump float;', '#endif',
      'varying vec2 v;',
      'uniform sampler2D uMap, uDecal, uMark; uniform mat3 uFwd, uInv; uniform vec3 uL; uniform float uPx, uTime;',
      'float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }',
      'float noise(vec3 x) { vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);',
      '  return mix(mix(mix(hash(i), hash(i + vec3(1.0, 0.0, 0.0)), f.x), mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),',
      '             mix(mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), f.x), mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0)), f.x), f.y), f.z); }',
      'float fbm(vec3 p) { float s = 0.0; float a = 0.5; for (int i = 0; i < 4; i++) { s += a * noise(p); p = p * 2.07 + 1.3; a *= 0.5; } return s; }',
      'float fbm3(vec3 p) { float s = 0.0; float a = 0.5; for (int i = 0; i < 3; i++) { s += a * noise(p); p = p * 2.07 + 1.3; a *= 0.5; } return s * 1.14; }',
      'vec4 map(vec3 w) { return texture2D(uMap, vec2(fract(atan(w.x, w.z) / 6.2831853), 0.5 - asin(clamp(-w.y, -1.0, 1.0)) / 3.1415927)); }',
      'float height(vec3 w) { vec4 m = map(w); return smoothstep(0.5, 0.95, m.g) * (0.4 + 0.75 * fbm(w * 5.0)); }',
      'vec3 spinY(vec3 p, float a) { float c = cos(a); float s = sin(a); return vec3(c * p.x + s * p.z, p.y, c * p.z - s * p.x); }',
      'float clouds(vec3 w) { vec3 q = spinY(w, uTime * 0.012) * vec3(1.0, 2.6, 1.0); float c = fbm(q * 2.4 + vec3(0.0, 0.0, uTime * 0.004)); float d = fbm3(q * 7.0);',
      '  return smoothstep(0.55, 0.72, c + (d - 0.45) * 0.45) * 0.42; }',
      'void main() {',
      '  vec2 p = vec2(v.x, -v.y); float r = length(p); vec3 L = normalize(uL); vec3 sky = vec3(0.36, 0.66, 1.0);',
      '  float side = 0.3 + 0.7 * smoothstep(-0.7, 0.8, dot(p / max(r, 0.0001), normalize(L.xy)));',
      '  float halo = exp(-max(r - 1.0, 0.0) * 10.0) * side * 0.42;',
      '  vec4 outside = vec4(sky * halo, halo);',
      '  if (r >= 1.0) { gl_FragColor = outside; return; }',
      '  vec3 n = vec3(p, sqrt(max(1.0 - r * r, 0.0)));',
      '  vec3 w = uInv * n; vec4 m = map(w);',
      '  float land = smoothstep(0.22, 0.78, m.r); float ndl = dot(n, L); float day = smoothstep(-0.3, 0.4, ndl); float lat = abs(w.y);',
      '  vec3 ns = n; float h0 = 0.0;',
      '  if (m.g > 0.45) {',
      '    vec3 t1 = normalize(cross(w, abs(w.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0))); vec3 t2 = cross(w, t1);',
      '    float e = 0.006; h0 = height(w);',
      '    float h1 = height(normalize(w + t1 * e)); float h2 = height(normalize(w + t2 * e));',
      '    ns = normalize(uFwd * normalize(w - 0.012 * ((h1 - h0) * t1 + (h2 - h0) * t2) / e));',
      '  }',
      '  float dif = max(dot(ns, L), 0.0);',
      '  vec3 dq = vec3(n.x, 0.927 * n.y - 0.375 * n.z, 0.375 * n.y + 0.927 * n.z);',
      '  vec2 duv = vec2(0.5 + atan(dq.x, dq.z) / 2.4, 0.5 - asin(clamp(-dq.y, -1.0, 1.0)) / 2.4);',
      '  vec4 dc = texture2D(uDecal, duv); float ta = dc.a;',
      '  float ex = texture2D(uDecal, duv + vec2(0.0016, 0.0)).a - texture2D(uDecal, duv - vec2(0.0016, 0.0)).a;',
      '  float ey = texture2D(uDecal, duv + vec2(0.0, 0.0016)).a - texture2D(uDecal, duv - vec2(0.0, 0.0016)).a;',
      '  float tdif = max(dot(normalize(ns + vec3(-ex, -ey, 0.0) * 0.7), L), 0.0);',
      '  vec2 mp = p * 175.0 + vec2(0.0, 12.0); float th = asin(clamp(mp.x / 110.0, -1.0, 1.0));',
      '  for (int i = 0; i < 4; i++) { float q = 260.0 + 110.0 * (1.0 - cos(th)); float g = 28600.0 * sin(th) / q;',
      '    float gd = 28600.0 * (cos(th) * q - 110.0 * sin(th) * sin(th)) / (q * q); th = clamp(th - (g - mp.x) / max(gd, 0.05), -1.55, 1.55); }',
      '  float ms = 260.0 / (260.0 + 110.0 * (1.0 - cos(th)));',
      '  vec2 muv = vec2(0.5 + 110.0 * th / 220.0, 0.5 + mp.y / ms / 157.0);',
      '  vec4 mk = texture2D(uMark, muv);',
      '  float mx = texture2D(uMark, muv + vec2(0.002, 0.0)).a - texture2D(uMark, muv - vec2(0.002, 0.0)).a;',
      '  float my = texture2D(uMark, muv + vec2(0.0, 0.003)).a - texture2D(uMark, muv - vec2(0.0, 0.003)).a;',
      '  float mdif = max(dot(normalize(ns + vec3(-mx, -my, 0.0) * 0.7), L), 0.0);',
      '  float da = dc.a; ta = mk.a + da * (1.0 - mk.a);',
      '  float moist = fbm3(w * 2.2 + 7.0);',
      '  vec3 lc = mix(vec3(0.17, 0.4, 0.84), vec3(0.12, 0.55, 0.78), smoothstep(0.4, 0.62, moist));',
      '  lc = mix(lc, vec3(0.3, 0.6, 0.92), smoothstep(0.5, 0.95, h0) * 0.6);',
      '  lc = mix(lc, vec3(0.36, 0.78, 0.98), 0.5 * (1.0 - smoothstep(0.5, 0.56, m.g)));',
      '  float depth = 1.0 - clamp(m.g * 2.0, 0.0, 1.0); float sn = fbm3(w * 4.0 + 3.0);',
      '  vec3 sea = mix(vec3(0.07, 0.36, 0.74), vec3(0.04, 0.22, 0.6), smoothstep(0.0, 0.3, depth));',
      '  sea = mix(sea, vec3(0.03, 0.13, 0.43), smoothstep(0.25, 0.6, depth));',
      '  sea = mix(sea, vec3(0.01, 0.05, 0.19), smoothstep(0.55, 1.0, depth + (sn - 0.42) * 0.6));',
      '  vec3 surf = mix(sea, lc, land);',
      '  float ice = smoothstep(0.92, 0.97, lat + (fbm3(w * 6.0) - 0.45) * 0.12);',
      '  surf = mix(surf, vec3(0.74, 0.88, 1.0), ice);',
      '  float cl = clouds(w) * (1.0 - 0.45 * ta); float shade = clouds(normalize(w + (uInv * L) * 0.02));',
      '  vec3 col = surf * (0.1 + 1.05 * dif * day) * (1.0 - 0.25 * shade * day);',
      '  col = col * (1.0 - ta) + dc.rgb * (1.0 - mk.a) * (0.5 + 0.62 * tdif * mix(0.55, 1.0, day)) + mk.rgb * (0.5 + 0.62 * mdif * mix(0.55, 1.0, day));',
      '  float nh = max(dot(n, normalize(L + vec3(0.0, 0.0, 1.0))), 0.0);',
      '  col += vec3(0.8, 0.92, 1.0) * (pow(nh, 70.0) * 0.9 + pow(nh, 10.0) * 0.12) * (1.0 - land) * (1.0 - ice) * day * (1.0 - cl) * (1.0 - ta);',
      '  float city = smoothstep(0.62, 0.85, noise(w * 70.0)) * smoothstep(0.35, 0.6, fbm3(w * 9.0 + 2.0));',
      '  col += vec3(0.35, 0.9, 1.0) * city * land * (1.0 - ice) * (1.0 - day) * (1.0 - cl) * (1.0 - ta) * 1.3;',
      '  col += vec3(0.02, 0.05, 0.16) * (1.0 - day);',
      '  col = mix(col, vec3(0.82, 0.93, 1.0) * (0.1 + 1.15 * max(ndl, 0.0) * day) + vec3(0.03, 0.06, 0.16), cl);',
      '  vec3 atm = mix(vec3(0.62, 0.5, 1.0), sky, smoothstep(-0.05, 0.35, ndl));',
      '  col = mix(col, atm * (0.25 + 0.85 * day), pow(1.0 - n.z, 2.6) * 0.5);',
      '  gl_FragColor = mix(outside, vec4(col, 1.0), 1.0 - smoothstep(1.0 - uPx * 1.5, 1.0, r));',
      '}'
    ].join('\n');
    function landMap() {
      var W = 2048, H = 1024, P = 128, offs = [-W, 0, W];
      function layer(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c.getContext('2d'); }
      var mask = layer(W + 2 * P, H);
      mask.fillStyle = '#000'; mask.fillRect(0, 0, W + 2 * P, H); mask.fillStyle = '#fff';
      lands.forEach(function (L) {
        offs.forEach(function (off) {
          mask.beginPath();
          L.shape.forEach(function (p, i) {
            var x = p[0] / (Math.PI * 2) * W + off + P, y = (0.5 - p[1] / Math.PI) * H;
            if (i) mask.lineTo(x, y); else mask.moveTo(x, y);
          });
          mask.closePath(); mask.fill();
        });
      });
      var soft = layer(W + 2 * P, H);
      if (typeof soft.filter === 'string') {
        soft.filter = 'blur(26px)'; soft.drawImage(mask.canvas, 0, 0); soft.filter = 'none';
      } else {
        var small = layer((W + 2 * P) / 32, H / 32);
        small.drawImage(mask.canvas, 0, 0, small.canvas.width, small.canvas.height);
        soft.imageSmoothingEnabled = true; soft.drawImage(small.canvas, 0, 0, W + 2 * P, H);
      }
      var m = mask.getImageData(P, 0, W, H).data, b = soft.getImageData(P, 0, W, H).data;
      var outL = layer(W, H), out = outL.createImageData(W, H), o = out.data;
      for (var i = 0; i < o.length; i += 4) { o[i] = m[i]; o[i + 1] = b[i]; o[i + 3] = 255; }
      outL.putImageData(out, 0, 0);
      return outL.canvas;
    }
    var gl = null, glU = {}, glCanvas = stage.querySelector('.earth-gl');
    var glStyled = glCanvas && getComputedStyle(glCanvas).position === 'absolute';
    try { gl = glStyled ? glCanvas.getContext('webgl', { premultipliedAlpha: true, antialias: false }) : null; } catch (e) { gl = null; }
    if (gl) {
      var mk = function (type, src) { var sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh); return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null; };
      var vsh = mk(gl.VERTEX_SHADER, VS), fsh = mk(gl.FRAGMENT_SHADER, FS), prog = gl.createProgram();
      if (vsh && fsh) { gl.attachShader(prog, vsh); gl.attachShader(prog, fsh); gl.linkProgram(prog); }
      if (!vsh || !fsh || !gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        gl = null;
      } else {
        gl.useProgram(prog);
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        var aLoc = gl.getAttribLocation(prog, 'a');
        gl.enableVertexAttribArray(aLoc); gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);
        gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, landMap());
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        ['Fwd', 'Inv', 'Px', 'L', 'S', 'Time', 'Map', 'Decal', 'Mark'].forEach(function (n) { glU[n] = gl.getUniformLocation(prog, 'u' + n); });
        gl.uniform1f(glU.S, S);
        gl.uniform3f(glU.L, -0.5, -0.42, 0.76);
        gl.uniform1i(glU.Map, 0);
        gl.uniform1i(glU.Decal, 1);
        gl.uniform1i(glU.Mark, 2);
        [gl.TEXTURE1, gl.TEXTURE2].forEach(function (unit) {
          gl.activeTexture(unit);
          gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        });
        gl.activeTexture(gl.TEXTURE0);
        stage.querySelector('.planet').classList.add('gl');
      }
    }
    function decalMap() {
      var W = 1024, H = 1024, K = W / 2.4, c = document.createElement('canvas');
      c.width = W; c.height = H;
      var g = c.getContext('2d'), head = getComputedStyle(document.documentElement).getPropertyValue('--head').trim() || 'sans-serif';
      function row(phi) { return H / 2 - phi * K; }
      g.textBaseline = 'alphabetic';
      var sub = 'AI SERVICE DEVELOPER', fs = 33, gap = fs * 0.2, y = row(-0.16);
      g.font = '700 ' + fs + 'px ' + head; g.textAlign = 'left';
      var widths = sub.split('').map(function (ch) { return ch === ' ' ? fs * 0.3 : g.measureText(ch).width; });
      var total = widths.reduce(function (a, b) { return a + b + gap; }, -gap), x = W / 2 - total / 2;
      sub.split('').forEach(function (ch, i) {
        if (ch !== ' ') {
          g.fillStyle = 'rgba(6, 18, 60, .7)'; g.fillText(ch, x + 2, y + 3);
          g.fillStyle = '#e2edff'; g.fillText(ch, x, y);
        }
        x += widths[i] + gap;
      });
      return c;
    }
    function markMap() {
      var W = 1024, H = 730, K = W / 220, c = document.createElement('canvas');
      c.width = W; c.height = H;
      var g = c.getContext('2d'), head = getComputedStyle(document.documentElement).getPropertyValue('--head').trim() || 'sans-serif';
      var size = 100 * K, base = H / 2 + size * 0.35;
      g.font = '700 ' + size + 'px ' + head; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      g.fillStyle = 'rgba(6, 18, 60, .6)'; g.fillText('DC', W / 2 + 1.2 * K, base + 2.6 * K);
      var grad = g.createLinearGradient(W / 2 - 55 * K, base - size * 0.75, W / 2 + 55 * K, base);
      grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.4, '#e3edff'); grad.addColorStop(0.75, '#a9c4f2'); grad.addColorStop(1, '#7d9bd8');
      g.fillStyle = grad; g.fillText('DC', W / 2, base);
      return c;
    }
    function drawDecal() {
      if (!gl) return;
      gl.activeTexture(gl.TEXTURE1);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, decalMap());
      gl.activeTexture(gl.TEXTURE2);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, markMap());
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.activeTexture(gl.TEXTURE0);
      stage.querySelector('.planet').classList.add('decal');
      frame(lastT);
    }
    function drawGL(spin, sec) {
      var c1 = view(Math.cos(spin), 0, -Math.sin(spin)), c2 = view(0, 1, 0), c3 = view(Math.sin(spin), 0, Math.cos(spin));
      gl.uniformMatrix3fv(glU.Fwd, false, [c1.x, c1.y, c1.z, c2.x, c2.y, c2.z, c3.x, c3.y, c3.z]);
      gl.uniformMatrix3fv(glU.Inv, false, [c1.x, c2.x, c3.x, c1.y, c2.y, c3.y, c1.z, c2.z, c3.z]);
      gl.uniform1f(glU.Px, 2 * S / glCanvas.width);
      gl.uniform1f(glU.Time, sec);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    function smooth(e0, e1, v) { var u = Math.max(0, Math.min(1, (v - e0) / (e1 - e0))); return u * u * (3 - 2 * u); }

    function orbitPos(o, t) {
      var a = o.ring.r * o.aMul, e = Math.min(o.e, Math.max(0, 1 - 205 / a));
      var M = o.phase - o.peri + o.ring.dir * (t / 1000) * (Math.PI * 2 / o.ring.period), E = M;
      for (var i = 0; i < 4; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
      var ox = a * (Math.cos(E) - e), oy = a * Math.sqrt(1 - e * e) * Math.sin(E);
      var x = ox * Math.cos(o.peri) - oy * Math.sin(o.peri), y = ox * Math.sin(o.peri) + oy * Math.cos(o.peri);
      var tilt = (o.tilt - py * 7) * D;
      var y1 = y * Math.cos(tilt), z = y * Math.sin(tilt);
      var yaw = px * 9 * D;
      var x1 = x * Math.cos(yaw) + z * Math.sin(yaw);
      z = -x * Math.sin(yaw) + z * Math.cos(yaw);
      var roll = o.roll * D;
      var X = x1 * Math.cos(roll) - y1 * Math.sin(roll);
      var Y = x1 * Math.sin(roll) + y1 * Math.cos(roll);
      var d = Math.max(-1, Math.min(1, z / a));
      var spread = 1 + 0.1 * d;
      return { x: X * spread, y: Y * spread, d: d };
    }

    var TW = 960, TH = 520;
    var trails = Array.prototype.slice.call(stage.querySelectorAll('.trail')).map(function (c) { return c.getContext('2d'); });
    function drawTrails(t) {
      trails.forEach(function (g) {
        g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, g.canvas.width, g.canvas.height); g.restore();
        g.globalCompositeOperation = 'lighter'; g.lineCap = 'butt';
      });
      sats.forEach(function (s) {
        var ring = s.ring, n = 24, prev = orbitPos(s, t), near0 = (prev.d + 1) / 2;
        var g0 = trails[prev.d < 0 ? 0 : 1], ar = 32 * (0.48 + 0.66 * near0);
        var aura = g0.createRadialGradient(prev.x, prev.y, 0, prev.x, prev.y, ar);
        aura.addColorStop(0, 'rgba(' + ring.rgb + ',' + (0.16 * (0.35 + 0.65 * near0)).toFixed(3) + ')');
        aura.addColorStop(1, 'rgba(' + ring.rgb + ',0)');
        g0.fillStyle = aura; g0.beginPath(); g0.arc(prev.x, prev.y, ar, 0, Math.PI * 2); g0.fill();
        for (var j = 1; j <= n; j++) {
          var q = orbitPos(s, t - ring.trailMs * j / n);
          var f = 1 - (j - 0.5) / n, dm = (prev.d + q.d) / 2, near = (dm + 1) / 2;
          var g = trails[dm < 0 ? 0 : 1];
          var al = f * f * (0.3 + 0.7 * near), w = (1.5 + 9 * f) * (0.55 + 0.6 * near);
          g.beginPath(); g.moveTo(prev.x, prev.y); g.lineTo(q.x, q.y);
          g.strokeStyle = 'rgba(' + ring.rgb + ',' + (al * 0.1).toFixed(3) + ')'; g.lineWidth = w * 1.8; g.stroke();
          g.strokeStyle = 'rgba(' + ring.rgb + ',' + (al * 0.75).toFixed(3) + ')'; g.lineWidth = w * 0.4; g.stroke();
          prev = q;
        }
      });
    }

    var sky = document.querySelector('.stars'), sg = sky && sky.getContext('2d');
    var stars = [], meteor = null, skyDpr = 1, skyW = 0, skyH = 0, skyCx = 0, skyCy = 0;
    var TINTS = ['219, 232, 255', '219, 232, 255', '190, 228, 255', '159, 230, 255', '201, 184, 255'];
    function buildSky() {
      if (!sg) return;
      var hr = hero.getBoundingClientRect(), orr = orbit.getBoundingClientRect(), copy = document.querySelector('.hero-copy').getBoundingClientRect();
      skyW = hr.width; skyH = hr.height;
      skyCx = orr.left + orr.width / 2 - hr.left; skyCy = orr.top + orr.height / 2 - hr.top;
      skyDpr = Math.min(1.5, window.devicePixelRatio || 1);
      sky.width = Math.round(skyW * skyDpr); sky.height = Math.round(skyH * skyDpr);
      var rnd = seeded(777), want = Math.round(skyW * skyH / 1800);
      var textRight = copy.right - hr.left, textBottom = copy.bottom - hr.top;
      stars = [];
      for (var tries = 0; stars.length < want && tries < want * 12; tries++) {
        var x = rnd() * skyW, y = rnd() * skyH;
        var keep = 0.18 + 0.82 * Math.exp(-Math.sqrt((x - skyCx) * (x - skyCx) + (y - skyCy) * (y - skyCy)) / 420);
        if (x < textRight && y < textBottom) keep *= 0.3;
        if (rnd() > keep) continue;
        var big = rnd() < 0.035;
        stars.push({ x: x, y: y, r: big ? 1.3 + rnd() * 0.6 : 0.35 + rnd() * rnd() * 1.05, a: 0.3 + rnd() * 0.7,
          tw: 0.6 + rnd() * 1.8, ph: rnd() * 6.28, z: 0.2 + rnd() * 0.8, c: TINTS[Math.floor(rnd() * TINTS.length)], big: big });
      }
    }
    function drawSky(t) {
      if (!sg) return;
      var sec = t / 1000;
      sg.setTransform(skyDpr, 0, 0, skyDpr, 0, 0);
      sg.clearRect(0, 0, skyW, skyH);
      stars.forEach(function (st) {
        var x = st.x - px * 14 * st.z, y = st.y - py * 10 * st.z;
        var a = st.a * (0.55 + 0.45 * Math.sin(sec * st.tw + st.ph));
        sg.fillStyle = 'rgba(' + st.c + ',' + a.toFixed(3) + ')';
        sg.beginPath(); sg.arc(x, y, st.r, 0, 6.2832); sg.fill();
        if (st.big) {
          var len = st.r * 7 * (0.7 + 0.3 * Math.sin(sec * st.tw * 0.7 + st.ph));
          sg.strokeStyle = 'rgba(' + st.c + ',' + (a * 0.5).toFixed(3) + ')'; sg.lineWidth = 0.7;
          sg.beginPath(); sg.moveTo(x - len, y); sg.lineTo(x + len, y); sg.moveTo(x, y - len); sg.lineTo(x, y + len); sg.stroke();
        }
      });
      if (!meteor && !reduce && Math.random() < 0.0015) meteor = { x: skyCx + 120 + Math.random() * 380, y: skyCy - 320 + Math.random() * 120, born: sec };
      if (meteor) {
        var age = sec - meteor.born;
        if (age < 0 || age > 0.9) { meteor = null; return; }
        var hx = meteor.x - 492 * age, hy = meteor.y + 342 * age, fade = Math.sin(Math.PI * age / 0.9);
        var g = sg.createLinearGradient(hx, hy, hx + 107, hy - 74);
        g.addColorStop(0, 'rgba(220, 238, 255,' + (0.85 * fade).toFixed(3) + ')'); g.addColorStop(1, 'rgba(220, 238, 255, 0)');
        sg.strokeStyle = g; sg.lineWidth = 1.4; sg.lineCap = 'round';
        sg.beginPath(); sg.moveTo(hx, hy); sg.lineTo(hx + 107, hy - 74); sg.stroke();
      }
    }

    var markBox = { x0: -52, x1: 52, y0: -42, y1: 30 };
    function measureMark() {
      var mk = document.querySelector('.orb-mark'), pl = stage.querySelector('.planet');
      if (!mk || !pl) return;
      var a = mk.getBoundingClientRect(), b = pl.getBoundingClientRect(), u = b.width / (2 * R), cx = b.left + b.width / 2, cy = b.top + b.height / 2;
      if (!u) return;
      markBox = { x0: (a.left - cx) / u, x1: (a.right - cx) / u, y0: (a.top - cy) / u, y1: (a.bottom - cy) / u };
    }
    function overText(x, y, hw) {
      for (var i = -2; i <= 2; i++) {
        for (var j = -1; j <= 1; j++) {
          var sx = x + hw * i / 2, sy = y + 12 * j, ex = sx / 150, ey = (sy - 29.5) / 62, rho = Math.sqrt(ex * ex + ey * ey);
          if (sy > 24 && Math.abs(sx) < 132 && rho > 0.68 && rho < 1.16) return true;
          if (sx > markBox.x0 - 8 && sx < markBox.x1 + 8 && sy > markBox.y0 - 8 && sy < markBox.y1 + 8) return true;
        }
      }
      return false;
    }

    var lastT = 0;
    function frame(t) {
      var ease = 1 - Math.exp(-Math.max(0, Math.min(1000, t - lastT)) / 90);
      lastT = t;
      px += (tx - px) * 0.06; py += (ty - py) * 0.06;
      drawSky(t);
      sats.forEach(function (s) {
        var q = orbitPos(s, t);
        var k = (q.d + 1) / 2;
        var scale = 0.48 + 0.66 * k;
        s.el.style.transform = 'translate(' + q.x.toFixed(1) + 'px,' + q.y.toFixed(1) + 'px) scale(' + scale.toFixed(3) + ')';
        s.el.style.opacity = (0.3 + 0.7 * k).toFixed(3);
        s.el.style.zIndex = q.d < 0 ? -1 - Math.round(-q.d * 9) : 5 + Math.round(q.d * 10);
        s.d = q.d;
      });
      drawTrails(t);
      var spin = (t / 1000) * (Math.PI * 2 / SPIN);
      if (gl) drawGL(spin, t / 1000); else drawEarth(spin);
      lands.forEach(function (L) {
        var q = onSphere(L.lon, L.lat, spin);
        var x = q.x * R, y = q.y * R;
        L.fade += ((overText(x, y, L.hw) ? 0.12 : 1) - L.fade) * (t ? ease : 1);
        var seen = smooth(0.2, 0.55, q.z) * L.fade;
        L.el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
        L.el.style.opacity = seen.toFixed(3);
        L.el.style.visibility = seen > 0.01 ? 'visible' : 'hidden';
      });
    }

    function fit() {
      var w = orbit.clientWidth, narrow = w < 560;
      rings[0].r = narrow ? 228 : 285;
      rings[1].r = narrow ? 292 : 395;
      var k = Math.max(0.38, Math.min(1, narrow ? w / 640 : w / 600));
      stage.style.setProperty('--k', k.toFixed(3));
      var dpr = Math.min(2, window.devicePixelRatio || 1) * k;
      trails.forEach(function (g) {
        g.canvas.width = Math.round(TW * dpr); g.canvas.height = Math.round(TH * dpr);
        g.setTransform(dpr, 0, 0, dpr, TW / 2 * dpr, TH / 2 * dpr);
      });
      if (gl) {
        glCanvas.width = glCanvas.height = Math.round(2 * R * S * Math.min(1.5, window.devicePixelRatio || 1) * k);
        gl.viewport(0, 0, glCanvas.width, glCanvas.height);
      }
      buildSky();
      measureMark();
      frame(lastT);
    }
    fit();
    if (gl) (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(drawDecal);
    window.addEventListener('resize', fit);
    window.addEventListener('load', fit);

    if (!reduce) {
      var running = false;
      var loop = function (t) {
        if (!running) return;
        frame(t);
        requestAnimationFrame(loop);
      };
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

  var subArc = document.querySelector('.orb-sub');
  function bendText() {
    var tp = subArc && subArc.querySelector('textPath');
    if (!tp || !tp.getComputedTextLength) return;
    var NS = 'http://www.w3.org/2000/svg', src = tp.parentNode, path = subArc.querySelector(tp.getAttribute('href'));
    var cs = getComputedStyle(src), fs = parseFloat(cs.fontSize), ls = parseFloat(cs.letterSpacing) || 0;
    var chars = tp.textContent.split('');
    var probe = document.createElementNS(NS, 'text');
    probe.style.letterSpacing = '0';
    subArc.appendChild(probe);
    var adv = chars.map(function (ch) {
      if (ch === ' ') return fs * 0.3 + ls;
      probe.textContent = ch;
      return probe.getComputedTextLength() + ls;
    });
    subArc.removeChild(probe);
    var total = path.getTotalLength(), sc = adv.map(function () { return 1; }), centers = [];
    function lay() {
      var width = 0;
      adv.forEach(function (a, i) { width += a * sc[i]; });
      var pos = total / 2 - (width - ls * sc[sc.length - 1]) / 2;
      centers = adv.map(function (a, i) { var c = pos + (a - ls) * sc[i] / 2; pos += a * sc[i]; return c; });
    }
    for (var it = 0; it < 4; it++) {
      lay();
      sc = centers.map(function (c) {
        var x = (path.getPointAtLength(Math.max(0, Math.min(total, c))).x - 175) / 165;
        return 1.08 * Math.sqrt(Math.max(0.3, 1 - x * x));
      });
    }
    lay();
    var g = subArc.querySelector('.bent');
    if (!g) { g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'bent'); subArc.appendChild(g); }
    g.textContent = '';
    chars.forEach(function (ch, i) {
      if (ch === ' ') return;
      var c = Math.max(0.5, Math.min(total - 0.5, centers[i]));
      var p = path.getPointAtLength(c), a = path.getPointAtLength(c - 0.5), b = path.getPointAtLength(c + 0.5);
      var t = document.createElementNS(NS, 'text');
      t.textContent = ch;
      t.setAttribute('text-anchor', 'middle');
      t.style.letterSpacing = '0';
      t.setAttribute('transform', 'translate(' + p.x.toFixed(2) + ' ' + p.y.toFixed(2) + ') rotate(' + (Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI).toFixed(2) + ') scale(' + sc[i].toFixed(3) + ')');
      g.appendChild(t);
    });
    src.style.display = 'none';
  }
  bendText();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(bendText);

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
