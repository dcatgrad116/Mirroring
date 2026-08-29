(function () {
  "use strict";
// 改玻璃參數的地方
  var PARAMS = {
    ior: 2,
    dispersion: 0.06,
    thickness: 100,
    bezelRatio: 0.35,
    bezelMax: 120,
    margin: 0,
    texDpr: 1.25,
    highlight: 0.12
  };

  var SELF = (document.currentScript && document.currentScript.src) || "";
  var BASE = SELF ? SELF.replace(/[^/]*$/, "") : "";
  var BG_URL = BASE + "assets/background.png";

  function marginPx() { return PARAMS.margin > 0 ? PARAMS.margin : Math.max(140, PARAMS.thickness); }

  var VERT = [
    "attribute vec2 aPos;",
    "varying vec2 vUv;",
    "void main() {",
    "  vUv = vec2((aPos.x + 1.0) * 0.5, (1.0 - aPos.y) * 0.5);",
    "  gl_Position = vec4(aPos, 0.0, 1.0);",
    "}"
  ].join("\n");

  var FRAG = [
    "precision highp float;",
    "varying vec2 vUv;",
    "uniform sampler2D uTex;",
    "uniform vec2 uSize;",
    "uniform float uMargin;",
    "uniform float uRadius;",
    "uniform float uBezel;",
    "uniform float uThickness;",
    "uniform vec3 uIOR;",
    "uniform float uHighlight;",
    "",
    "float rrSDF(vec2 p, vec2 b, float r){",
    "  vec2 q = abs(p) - b + r;",
    "  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;",
    "}",
    "",

    "float heightProfile(float s){",
    "  float s4 = s*s*s*s;",
    "  return pow(max(1.0 - s4, 0.0), 0.25);",
    "}",
    "",

    "float snellDisp(float slope, float h, float ior){",
    "  float thetaI = atan(slope);",
    "  float sinR = clamp(sin(thetaI) / ior, -0.999, 0.999);",
    "  float thetaR = asin(sinR);",
    "  return h * uThickness * (tan(thetaI) - tan(thetaR));",
    "}",
    "",
    "void main(){",
    "  vec2 p = (vUv - 0.5) * uSize;",
    "  float sdf = rrSDF(p, uSize * 0.5, uRadius);",
    "  float d = max(-sdf, 0.0);",
    "  float s = 1.0 - clamp(d / uBezel, 0.0, 1.0);",
    "  float h = heightProfile(s);",
    "",

    "  float s3 = s*s*s;",
    "  float denom = pow(max(1.0 - s*s3*s, 1e-4), 0.75);",
    "  float slope = clamp(s3 / (denom * uBezel) * uThickness, 0.0, 12.0);",
    "",

    "  vec2 e = vec2(1.0, 0.0);",
    "  vec2 grad = vec2(",
    "    rrSDF(p + e.xy, uSize*0.5, uRadius) - rrSDF(p - e.xy, uSize*0.5, uRadius),",
    "    rrSDF(p + e.yx, uSize*0.5, uRadius) - rrSDF(p - e.yx, uSize*0.5, uRadius));",
    "  vec2 n = normalize(grad + vec2(1e-5));",
    "",

    "  float dR = snellDisp(slope, h, uIOR.r);",
    "  float dG = snellDisp(slope, h, uIOR.g);",
    "  float dB = snellDisp(slope, h, uIOR.b);",
    "",
    "  vec2 texSize = uSize + 2.0 * uMargin;",
    "  vec2 base = p + uSize * 0.5 + uMargin;",
    "  float r = texture2D(uTex, (base + n * dR) / texSize).r;",
    "  float g = texture2D(uTex, (base + n * dG) / texSize).g;",
    "  float b = texture2D(uTex, (base + n * dB) / texSize).b;",
    "  vec3 col = vec3(r, g, b);",
    "",
    "  col = mix(col, vec3(1.0), 0.04);",
    "  col += (1.0 - h) * uHighlight;",
    "  float alpha = 1.0 - smoothstep(-1.5, 1.5, sdf);",
    "  gl_FragColor = vec4(col, alpha);",
    "}"
  ].join("\n");

  function compile(gl, type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn("[glass] shader error:", gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  }

  function px(v) { var n = parseFloat(v); return isNaN(n) ? 0 : n; }

  var bg = new Image();
  var decos = [];
  var items = [];
  var raf = 0;

  function setup(el) {
    var canvas = document.createElement("canvas");
    canvas.className = "glass-canvas";
    el.insertBefore(canvas, el.firstChild);

    var gl = canvas.getContext("webgl", { premultipliedAlpha: false, alpha: true, antialias: true })
      || canvas.getContext("experimental-webgl", { premultipliedAlpha: false, alpha: true });
    if (!gl) { canvas.remove(); return null; }

    var vs = compile(gl, gl.VERTEX_SHADER, VERT);
    var fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) { canvas.remove(); return null; }
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.remove(); return null; }
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    return {
      el: el, canvas: canvas, gl: gl, prog: prog, tex: tex,
      comp: document.createElement("canvas"),
      u: {
        size: gl.getUniformLocation(prog, "uSize"),
        margin: gl.getUniformLocation(prog, "uMargin"),
        radius: gl.getUniformLocation(prog, "uRadius"),
        bezel: gl.getUniformLocation(prog, "uBezel"),
        thickness: gl.getUniformLocation(prog, "uThickness"),
        ior: gl.getUniformLocation(prog, "uIOR"),
        highlight: gl.getUniformLocation(prog, "uHighlight"),
        tex: gl.getUniformLocation(prog, "uTex")
      },
      w: 0, h: 0
    };
  }

  function composite(it, rect) {
    var M = marginPx();
    var rw = rect.width + 2 * M, rh = rect.height + 2 * M;
    var dpr = Math.min(window.devicePixelRatio || 1, PARAMS.texDpr);
    var W = Math.round(rw * dpr), H = Math.round(rh * dpr);
    if (it.comp.width !== W || it.comp.height !== H) { it.comp.width = W; it.comp.height = H; }
    var ctx = it.comp.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var ox = rect.left - M, oy = rect.top - M;

    ctx.clearRect(0, 0, rw, rh);

    var s0 = Math.max(rw / bg.naturalWidth, rh / bg.naturalHeight);
    var w0 = bg.naturalWidth * s0, h0 = bg.naturalHeight * s0;
    ctx.drawImage(bg, (rw - w0) / 2, (rh - h0) / 2, w0, h0);

    var vw = window.innerWidth, vh = window.innerHeight;
    var s = Math.max(vw / bg.naturalWidth, vh / bg.naturalHeight);
    var dw = bg.naturalWidth * s, dh = bg.naturalHeight * s;
    var bx = (vw - dw) / 2, by = (vh - dh) / 2;
    ctx.drawImage(bg, bx - ox, by - oy, dw, dh);

    for (var i = 0; i < decos.length; i++) {
      var img = decos[i];
      if (!img.complete || !img.naturalWidth) continue;
      var r = img.getBoundingClientRect();
      if (r.right < ox || r.left > ox + rw || r.bottom < oy || r.top > oy + rh) continue;
      ctx.drawImage(img, r.left - ox, r.top - oy, r.width, r.height);
    }
    return { w: rw, h: rh };
  }

  function render(it) {
    var r = it.el.getBoundingClientRect();
    if (r.width === 0 || r.bottom < -80 || r.top > window.innerHeight + 80) return;

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = Math.round(r.width * dpr), H = Math.round(r.height * dpr);
    var gl = it.gl;
    if (W !== it.w || H !== it.h) {
      it.canvas.width = W; it.canvas.height = H;
      it.canvas.style.width = r.width + "px";
      it.canvas.style.height = r.height + "px";
      gl.viewport(0, 0, W, H);
      it.w = W; it.h = H;
    }

    composite(it, r);

    var cs = getComputedStyle(it.el);
    var radius = Math.min(px(cs.borderTopLeftRadius), Math.min(r.width, r.height) * 0.5);
    var minSide = Math.min(r.width, r.height);
    var bezel = Math.min(minSide * PARAMS.bezelRatio, PARAMS.bezelMax);

    gl.useProgram(it.prog);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, it.tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, it.comp);
    } catch (err) {

      console.warn("[glass] texture upload failed, fallback to CSS:", err);
      teardown(it);
      return;
    }
    gl.uniform1i(it.u.tex, 0);
    gl.uniform2f(it.u.size, r.width, r.height);
    gl.uniform1f(it.u.margin, marginPx());
    gl.uniform1f(it.u.radius, radius);
    gl.uniform1f(it.u.bezel, bezel);
    gl.uniform1f(it.u.thickness, PARAMS.thickness);
    gl.uniform3f(it.u.ior, PARAMS.ior - PARAMS.dispersion, PARAMS.ior, PARAMS.ior + PARAMS.dispersion);
    gl.uniform1f(it.u.highlight, PARAMS.highlight);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (!it.on) { it.on = true; it.el.classList.add("glass--on"); }
  }

  function teardown(it) {
    var idx = items.indexOf(it);
    if (idx >= 0) items.splice(idx, 1);
    it.el.classList.remove("glass--on");
    if (it.canvas.parentNode) it.canvas.parentNode.removeChild(it.canvas);
  }

  function renderAll() { raf = 0; for (var i = 0; i < items.length; i++) render(items[i]); }
  function schedule() {
    if (raf) return;
    raf = requestAnimationFrame(renderAll);

    setTimeout(function () { if (raf) { cancelAnimationFrame(raf); renderAll(); } }, 150);
  }

  function init() {
    decos = Array.prototype.slice.call(document.querySelectorAll(".paper-deco img"));
    var els = document.querySelectorAll(".glass");
    for (var i = 0; i < els.length; i++) {
      var it = setup(els[i]);
      if (it) items.push(it);
    }
    if (!items.length) return;
    renderAll();

    decos.forEach(function (img) { if (!img.complete) img.addEventListener("load", schedule); });

    document.addEventListener("scroll", schedule, { capture: true, passive: true });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
  }

  bg.onload = init;
  bg.onerror = function () {  };
  bg.src = BG_URL;
})();
