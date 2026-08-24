const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const hint = document.querySelector('.hint');
const titleScreen = document.getElementById('title-screen');
const startButton = document.getElementById('start-button');

let branches = [];
let mouse = { x: innerWidth / 2, y: innerHeight / 2 };
let started = false;
let lastSplit = 0;
const splitEvery = 1000 / 10;
const maxBranches = 50000;

function begin() {
  if (started) return;

  started = true;
  lastSplit = performance.now();
  titleScreen.classList.add('hidden');
  hint.style.opacity = 1;
}

function resize() {
  const dpr = devicePixelRatio || 1;
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw();
}

function addInitialLine(x, y) {
  const angle = Math.random() * Math.PI * 2;
  const length = 22;
  branches.push({
    x1: x - Math.cos(angle) * length / 2,
    y1: y - Math.sin(angle) * length / 2,
    x2: x + Math.cos(angle) * length / 2,
    y2: y + Math.sin(angle) * length / 2,
    hue: 185 + Math.random() * 55,
    width: 1.6
  });
}

function aimFrom(x, y) {
  return Math.atan2(mouse.y - y, mouse.x - x);
}

function splitBranch(branch) {
  const dx = branch.x2 - branch.x1;
  const dy = branch.y2 - branch.y1;
  const baseAngle = Math.atan2(dy, dx);
  const length = Math.max(9, Math.hypot(dx, dy) * (0.72 + Math.random() * 0.25));

  const makeChild = (x, y, outward) => {
    const angle = aimFrom(x, y);

    return {
      x1: x,
      y1: y,
      x2: x + Math.cos(angle) * length,
      y2: y + Math.sin(angle) * length,
      hue: branch.hue + (Math.random() - 0.5) * 12,
      width: Math.max(0.35, branch.width * 0.92)
    };
  };

  return [
    makeChild(branch.x1, branch.y1, -1),
    makeChild(branch.x2, branch.y2, 1)
  ];
}

function draw() {
  ctx.fillStyle = 'rgba(7, 17, 31, 0.20)';
  ctx.fillRect(0, 0, innerWidth, innerHeight);
  ctx.lineCap = 'round';
  for (const b of branches) {
    ctx.beginPath();
    ctx.moveTo(b.x1, b.y1);
    ctx.lineTo(b.x2, b.y2);
    ctx.strokeStyle = `hsla(${b.hue}, 92%, 72%, .88)`;
    ctx.lineWidth = b.width;
    ctx.stroke();
  }
}

function animate() {
  draw();
  requestAnimationFrame(animate);
}

animate();

function tick(now) {
  if (started && now - lastSplit >= splitEvery) {
    lastSplit = now;
    const next = [];
    for (const branch of branches) next.push(...splitBranch(branch));
    branches = next.slice(-maxBranches);
    draw();
  }
  requestAnimationFrame(tick);
}

addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
addEventListener('pointerdown', e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;

  begin();
  addInitialLine(e.clientX, e.clientY);
  draw();
});
startButton.addEventListener('click', begin);
addEventListener('resize', resize);
resize();
requestAnimationFrame(tick);
