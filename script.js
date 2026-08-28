const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const clickHint = document.getElementById('click-hint');

let webs = [];
let nextWebId = 0;
const maxLines = 200;
const maxVisibleLines = 240;
const growthInterval = 90;
const propagationDuration = 15000;
const fadeStart = 9000;
const fadeDuration = 6000;
const webLifetime = 24000;
const centerFadeStart = 18000;
const centerFadeDuration = 6000;

function addSegment(web, x1, y1, x2, y2, hue, width) {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const distanceFromOrigin = Math.hypot(midX - web.x, midY - web.y);

  web.segments.push({
    x1,
    y1,
    x2,
    y2,
    hue,
    width,
    distanceFromOrigin,
    createdAt: performance.now()
  });
  web.totalLines += 1;
  if (web.totalLines >= maxLines) {
    web.growthStopped = true;
  }
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
    totalLines: 0,
    growthStopped: false,
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
  if (web.growthStopped) return;

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
  requestAnimationFrame(growAll);
}

function burstAt(x, y) {
  clickHint.classList.add('hidden');
  const web = createWeb(x, y);
  draw();

  if (!webs.some(w => w !== web && !w.growthStopped)) {
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
  const now = performance.now();
  const allSegments = webs.flatMap(web => web.segments);
  const visibleSegments = allSegments
    .filter(segment => {
      const webAge = now - webs.find(web => web.segments.includes(segment)).start;
      return webAge < webLifetime;
    })
    .sort((first, second) => {
      return first.distanceFromOrigin - second.distanceFromOrigin;
    })
    .slice(0, maxVisibleLines);

  for (const web of webs) {
    web.segments = web.segments.filter(segment => now - web.start < webLifetime);
  }

  ctx.clearRect(0, 0, innerWidth, innerHeight);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const segment of visibleSegments) {
    const web = webs.find(candidate => candidate.segments.includes(segment));
    const webAge = now - web.start;
    const outerFadeProgress = Math.max(0, (webAge - fadeStart) / fadeDuration);
    const centerFadeProgress = Math.max(0, (webAge - centerFadeStart) / centerFadeDuration);
    const outerness = Math.min(1, segment.distanceFromOrigin / 500);
    const fadeProgress = outerness * outerFadeProgress + (1 - outerness) * centerFadeProgress;
    const opacity = 0.92 * (1 - Math.min(1, fadeProgress));

    ctx.beginPath();
    ctx.moveTo(segment.x1, segment.y1);
    ctx.lineTo(segment.x2, segment.y2);
    ctx.strokeStyle = `hsla(${segment.hue}, 90%, 74%, ${opacity})`;
    ctx.lineWidth = segment.width;
    ctx.stroke();
  }
}

addEventListener('pointerdown', e => {
  burstAt(e.clientX, e.clientY);
});
addEventListener('resize', resize);
resize();
requestAnimationFrame(growAll);
