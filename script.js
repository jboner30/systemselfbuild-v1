const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let branches = [];
let activePropagation = null;
const maxLines = 160;
const growthInterval = 100;
const propagationDuration = 15000;

function addSegment(x1, y1, x2, y2, hue, width) {
  branches.push({ x1, y1, x2, y2, hue, width });
}

function seedCracks(x, y) {
  const count = 12;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.18;
    const length = 30 + Math.random() * 110;
    const x2 = x + Math.cos(angle) * length;
    const y2 = y + Math.sin(angle) * length;
    addSegment(x, y, x2, y2, 190 + Math.random() * 20, 1.2 + Math.random() * 0.8);
  }
}

function growCracks() {
  if (!activePropagation || branches.length >= maxLines) {
    activePropagation = null;
    return;
  }

  const now = performance.now();
  const elapsed = now - activePropagation.start;
  if (elapsed >= propagationDuration) {
    activePropagation = null;
    return;
  }

  if (now - activePropagation.lastGrowth < growthInterval) return;

  const available = maxLines - branches.length;
  if (available <= 0) {
    activePropagation = null;
    return;
  }

  const addCount = Math.min(1, available);
  for (let i = 0; i < addCount; i++) {
    const branch = branches[Math.floor(Math.random() * branches.length)];
    if (!branch) break;

    const dx = branch.x2 - branch.x1;
    const dy = branch.y2 - branch.y1;
    const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.9;
    const length = 18 + Math.random() * 32;
    const x1 = branch.x2;
    const y1 = branch.y2;
    const x2 = x1 + Math.cos(angle) * length;
    const y2 = y1 + Math.sin(angle) * length;

    addSegment(x1, y1, x2, y2, branch.hue + (Math.random() - 0.5) * 8, Math.max(0.22, branch.width * 0.82));
  }

  activePropagation.lastGrowth = now;
  draw();
}

function burstAt(x, y) {
  branches = [];
  seedCracks(x, y);
  activePropagation = {
    start: performance.now(),
    lastGrowth: performance.now() - growthInterval,
    x,
    y
  };
  draw();
  requestAnimationFrame(runPropagation);
}

function runPropagation() {
  if (!activePropagation) return;

  growCracks();
  requestAnimationFrame(runPropagation);
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

  for (const b of branches) {
    ctx.beginPath();
    ctx.moveTo(b.x1, b.y1);
    ctx.lineTo(b.x2, b.y2);
    ctx.strokeStyle = `hsla(${b.hue}, 90%, 74%, 0.92)`;
    ctx.lineWidth = b.width;
    ctx.stroke();
  }
}

addEventListener('pointerdown', e => {
  burstAt(e.clientX, e.clientY);
});
addEventListener('resize', resize);
resize();
