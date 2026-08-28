const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const clickHint = document.getElementById('click-hint');

let webs = [];
let nextWebId = 0;
const maxLines = 400;
const growthInterval = 90;
const propagationDuration = 15000;

function addSegment(web, x1, y1, x2, y2, hue, width) {
  web.segments.push({ x1, y1, x2, y2, hue, width });
}

function seedCracks(web, x, y) {
  const count = 12;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.18;
    const length = 30 + Math.random() * 110;
    const x2 = x + Math.cos(angle) * length;
    const y2 = y + Math.sin(angle) * length;
    addSegment(web, x, y, x2, y2, 190 + Math.random() * 20, 1.2 + Math.random() * 0.8);
  }
}

function createWeb(x, y) {
  const web = {
    id: nextWebId++,
    segments: [],
    start: performance.now(),
    lastGrowth: performance.now() - growthInterval,
    x,
    y
  };

  seedCracks(web, x, y);
  webs.push(web);
  return web;
}

function growWeb(web) {
  if (web.segments.length >= maxLines) return;

  const now = performance.now();
  const elapsed = now - web.start;
  if (elapsed >= propagationDuration) return;
  if (now - web.lastGrowth < growthInterval) return;

  const branch = web.segments[Math.floor(Math.random() * web.segments.length)];
  if (!branch) return;

  const dx = branch.x2 - branch.x1;
  const dy = branch.y2 - branch.y1;
  const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.9;
  const length = 18 + Math.random() * 32;
  const x1 = branch.x2;
  const y1 = branch.y2;
  const x2 = x1 + Math.cos(angle) * length;
  const y2 = y1 + Math.sin(angle) * length;

  addSegment(web, x1, y1, x2, y2, branch.hue + (Math.random() - 0.5) * 8, Math.max(0.22, branch.width * 0.82));
  web.lastGrowth = now;
}

function growAll() {
  for (const web of webs) {
    growWeb(web);
  }

  draw();
  if (webs.some(web => web.segments.length < maxLines && performance.now() - web.start < propagationDuration)) {
    requestAnimationFrame(growAll);
  }
}

function burstAt(x, y) {
  clickHint.classList.add('hidden');
  const web = createWeb(x, y);
  draw();

  if (!webs.some(w => w !== web && w.segments.length < maxLines)) {
    requestAnimationFrame(growAll);
  }
}

function resize() {
  const dpr = devicePixelRatio || 1;
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  draw();
}

function draw() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const web of webs) {
    for (const b of web.segments) {
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.strokeStyle = `hsla(${b.hue}, 90%, 74%, 0.92)`;
      ctx.lineWidth = b.width;
      ctx.stroke();
    }
  }
}

addEventListener('pointerdown', e => {
  burstAt(e.clientX, e.clientY);
});
addEventListener('resize', resize);
resize();
