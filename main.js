const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- typing tagline hero ---------- */
const typeEl = document.getElementById('typeLine');
const phrases = [
  'New tools. Same eye.',
  'Brand campaigns · film · set design',
  'Eleven years. Zero shortcuts on craft.',
  'IKEA · Adidas · your brand next'
];
let pi = 0, ch = 0, deleting = false;
function typeLoop(){
  if(reduced){ typeEl.textContent = phrases[0]; return; }
  const word = phrases[pi];
  typeEl.innerHTML = word.slice(0, ch) + '<span class="caret"></span>';
  if(!deleting){
    ch++;
    if(ch > word.length){ deleting = true; setTimeout(typeLoop, 1600); return; }
  } else {
    ch--;
    if(ch === 0){ deleting = false; pi = (pi+1) % phrases.length; }
  }
  setTimeout(typeLoop, deleting ? 28 : 60);
}
typeLoop();

/* ---------- soft gradient canvases (bildplatshållare) ---------- */
function soft(cv){
  const ctx = cv.getContext('2d');
  const w = cv.width = cv.offsetWidth * devicePixelRatio || 600;
  const h = cv.height = cv.offsetHeight * devicePixelRatio || 800;
  const tone = ((+cv.dataset.h) % 30);
  const g = ctx.createLinearGradient(0,0,w,h);
  g.addColorStop(0, `hsl(0 0% ${82 - tone*0.2}%)`);
  g.addColorStop(.55, `hsl(0 0% ${64 - tone*0.2}%)`);
  g.addColorStop(1, `hsl(0 0% ${46 - tone*0.2}%)`);
  ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
  for(let i=0;i<3;i++){
    const rg = ctx.createRadialGradient(
      Math.random()*w, Math.random()*h, 0,
      Math.random()*w, Math.random()*h, w*.7);
    rg.addColorStop(0, `hsla(0 0% 94% / .45)`);
    rg.addColorStop(1, 'transparent');
    ctx.fillStyle = rg; ctx.fillRect(0,0,w,h);
  }
}
function paintAll(){document.querySelectorAll('canvas.soft').forEach(soft)}
paintAll();
addEventListener('resize', paintAll);

/* ---------- animated reel canvas (videoplatshållare) ---------- */
const reel = document.getElementById('reelCanvas');
if(reel){
  const ctx = reel.getContext('2d');
  let t = 0;
  function frame(){
    const w = reel.width = reel.offsetWidth * devicePixelRatio;
    const h = reel.height = reel.offsetHeight * devicePixelRatio;
    ctx.fillStyle = '#D7D6D2'; ctx.fillRect(0,0,w,h);
    for(let i=0;i<60;i++){
      const x = w/2 + Math.cos(t*.008 + i*.35)*(w*.32)*Math.sin(i*.13+t*.004);
      const y = h/2 + Math.sin(t*.011 + i*.3)*(h*.34);
      const r = 2 + Math.abs(Math.sin(i+t*.02))*5;
      ctx.beginPath();
      ctx.fillStyle = i%9===0 ? 'rgba(17,17,18,.6)' : 'rgba(17,17,18,.16)';
      ctx.arc(x, y, r*devicePixelRatio, 0, 7);
      ctx.fill();
    }
    t++;
    if(!reduced) requestAnimationFrame(frame);
  }
  frame();
}

/* ---------- nav: vit över herobild/footer, svart över vitt innehåll ---------- */
const nav = document.querySelector('nav');
const heroEl = document.querySelector('.hero');
const footerEl = document.querySelector('footer');
function navState(){
  const overHero = scrollY < heroEl.offsetHeight - 70;
  const overFooter = footerEl.getBoundingClientRect().top < 40;
  nav.classList.toggle('scrolled', !(overHero || overFooter));
}
navState();

/* ---------- fisheye-warp på herobakgrunden, följer musen ---------- */
const warpCv = document.getElementById('heroWarp');
let drawWarp = null;
if(warpCv && !reduced){
  const gl = warpCv.getContext('webgl', {antialias:false});
  if(!gl){ warpCv.remove(); }
  else{
    const vs = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
    const fs = `
      precision mediump float;
      uniform sampler2D u_tex;
      uniform vec2 u_res;
      uniform vec2 u_mouse;
      void main(){
        vec2 uv = gl_FragCoord.xy / u_res;
        vec2 m = u_mouse;
        vec2 d = uv - m;
        float aspect = u_res.x / u_res.y;
        d.x *= aspect;
        float r = length(d);
        /* fisheye: kanterna dras ut, liten lins närmast musen */
        float f = 1.0 - 0.28 * r - 0.10 * exp(-r * r * 5.0);
        vec2 nd = d * max(f, .2);
        nd.x /= aspect;
        gl_FragColor = texture2D(u_tex, clamp(m + nd, 0.0, 1.0));
      }`;
    function sh(type, src){
      const s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s); return s;
    }
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog); gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, 'u_res');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');

    /* textur: bild om data-img finns, annars mörk gradient-platshållare */
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    function upload(src){ gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src); }
    const ph = document.createElement('canvas');
    ph.width = 1280; ph.height = 800;
    const pctx = ph.getContext('2d');
    let g = pctx.createLinearGradient(0,0,ph.width,ph.height);
    g.addColorStop(0,'#1d1d1d'); g.addColorStop(1,'#0b0b0b');
    pctx.fillStyle = g; pctx.fillRect(0,0,ph.width,ph.height);
    [[.72*ph.width,.18*ph.height,'#3d3d3d'],[.15*ph.width,.85*ph.height,'#2b2b2b']].forEach(([x,y,c])=>{
      const rg = pctx.createRadialGradient(x,y,0,x,y,ph.width*.55);
      rg.addColorStop(0,c); rg.addColorStop(1,'transparent');
      pctx.fillStyle = rg; pctx.fillRect(0,0,ph.width,ph.height);
    });
    upload(ph);
    if(warpCv.dataset.img){
      const im = new Image();
      im.onload = ()=>{ gl.bindTexture(gl.TEXTURE_2D, tex); upload(im); };
      im.src = warpCv.dataset.img;
    }

    /* mus, mjukad + lätt drift när den står stilla */
    let mx = .5, my = .5, tx = .5, ty = .5, t0 = 0;
    addEventListener('mousemove', e=>{
      tx = e.clientX / innerWidth;
      ty = 1 - e.clientY / innerHeight;
    });
    drawWarp = ()=>{
      const w = warpCv.offsetWidth * devicePixelRatio;
      const h = warpCv.offsetHeight * devicePixelRatio;
      if(warpCv.width !== w || warpCv.height !== h){
        warpCv.width = w; warpCv.height = h;
        gl.viewport(0,0,w,h);
      }
      t0 += .004;
      mx += (tx + Math.sin(t0)*.015 - mx) * .06;
      my += (ty + Math.cos(t0*.8)*.015 - my) * .06;
      gl.uniform2f(uRes, w, h);
      gl.uniform2f(uMouse, mx, my);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
  }
}

/* ---------- hero-scener: crossfade + drift + bg-zoom mot scrollprogress ---------- */
const sceneEls = [...document.querySelectorAll('.hero .scene')];
function scenesUpdate(){
  const max = heroEl.offsetHeight - innerHeight;
  if(max <= 0 || !sceneEls.length) return;
  const p = Math.min(Math.max(scrollY / max, 0), 1);
  const n = sceneEls.length;
  sceneEls.forEach((s, i)=>{
    const local = p * n - i;            // 0..1 inom scenens segment
    let o = 0;
    if(local >= -0.05 && local <= 1.05){
      const fadeIn  = i === 0     ? 1 : Math.min(Math.max(local / .22, 0), 1);
      const fadeOut = i === n - 1 ? 1 : Math.min(Math.max((1 - local) / .22, 0), 1);
      o = Math.min(fadeIn, fadeOut);
    }
    s.style.opacity = o;
    s.style.transform = `translate3d(0, ${(local - .5) * -46}px, 0)`;
    s.classList.toggle('on', o > .01);
  });
  if(warpCv) warpCv.style.transform = `scale(${1 + p * .14})`;
}

/* ---------- soft parallax ---------- */
const strip = document.getElementById('stripTrack');
const speedEls = document.querySelectorAll('[data-speed]');
function raf(){
  navState();
  if(!reduced){
    if(drawWarp) drawWarp();
    scenesUpdate();

    if(strip){
      strip.style.transform = `translate3d(${-(scrollY - (strip.parentElement.offsetTop - innerHeight)) * .18}px,0,0)`;
    }
    speedEls.forEach(el=>{
      const r = el.getBoundingClientRect();
      const off = (r.top + r.height/2 - innerHeight/2) * +el.dataset.speed;
      el.style.transform = `translate3d(0, ${off}px, 0)`;
    });
  }
  requestAnimationFrame(raf);
}
raf();

/* ---------- reveal ---------- */
const io = new IntersectionObserver(es=>{
  es.forEach(e=>e.isIntersecting && e.target.classList.add('in'));
},{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
