// Flappy Bird - vanilla JS canvas implementation

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const hud = document.getElementById('hud');
const scoreDisplay = document.getElementById('scoreDisplay');
const finalScoreEl = document.getElementById('finalScore');
const bestScoreEl = document.getElementById('bestScore');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const GRAVITY = 0.45;
const FLAP_STRENGTH = -8;
const PIPE_WIDTH = 60;
const PIPE_GAP = 150;
const PIPE_SPEED = 2.5;
const PIPE_SPAWN_INTERVAL = 1500; // ms
const GROUND_HEIGHT = 80;

let bestScore = Number(localStorage.getItem('flappyBestScore')) || 0;

let state = 'start'; // 'start' | 'playing' | 'gameover'
let animationId = null;
let lastPipeTime = 0;
let lastFrameTime = 0;
let groundOffset = 0;

let bird = createBird();
let pipes = [];
let score = 0;
let clouds = createClouds();

function createBird() {
  return {
    x: WIDTH * 0.3,
    y: HEIGHT / 2,
    velocity: 0,
    radius: 14,
    rotation: 0
  };
}

function createClouds() {
  const list = [];
  for (let i = 0; i < 4; i++) {
    list.push({
      x: Math.random() * WIDTH,
      y: 40 + Math.random() * 150,
      scale: 0.6 + Math.random() * 0.8,
      speed: 0.3 + Math.random() * 0.3
    });
  }
  return list;
}

function resetGame() {
  bird = createBird();
  pipes = [];
  score = 0;
  lastPipeTime = 0;
  groundOffset = 0;
  scoreDisplay.textContent = '0';
}

function spawnPipe() {
  const minTop = 60;
  const maxTop = HEIGHT - GROUND_HEIGHT - PIPE_GAP - 60;
  const topHeight = Math.random() * (maxTop - minTop) + minTop;
  pipes.push({
    x: WIDTH,
    topHeight: topHeight,
    bottomY: topHeight + PIPE_GAP,
    passed: false
  });
}

function flap() {
  if (state === 'start') {
    startGame();
    return;
  }
  if (state === 'gameover') {
    return;
  }
  bird.velocity = FLAP_STRENGTH;
}

function startGame() {
  resetGame();
  state = 'playing';
  startScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
  hud.classList.remove('hidden');
  bird.velocity = FLAP_STRENGTH;
  lastFrameTime = performance.now();
  lastPipeTime = performance.now();
  if (!animationId) {
    animationId = requestAnimationFrame(loop);
  }
}

function endGame() {
  state = 'gameover';
  hud.classList.add('hidden');
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('flappyBestScore', String(bestScore));
  }
  finalScoreEl.textContent = String(score);
  bestScoreEl.textContent = String(bestScore);
  gameOverScreen.classList.remove('hidden');
}

function update(dt) {
  // Bird physics
  bird.velocity += GRAVITY;
  bird.y += bird.velocity;
  bird.rotation = Math.max(-0.5, Math.min(1.2, bird.velocity * 0.08));

  // Ground collision
  if (bird.y + bird.radius >= HEIGHT - GROUND_HEIGHT) {
    bird.y = HEIGHT - GROUND_HEIGHT - bird.radius;
    endGame();
    return;
  }
  // Ceiling collision
  if (bird.y - bird.radius <= 0) {
    bird.y = bird.radius;
    bird.velocity = 0;
  }

  // Pipes
  const now = performance.now();
  if (now - lastPipeTime > PIPE_SPAWN_INTERVAL) {
    spawnPipe();
    lastPipeTime = now;
  }

  for (let i = pipes.length - 1; i >= 0; i--) {
    const pipe = pipes[i];
    pipe.x -= PIPE_SPEED;

    // Scoring
    if (!pipe.passed && pipe.x + PIPE_WIDTH < bird.x) {
      pipe.passed = true;
      score++;
      scoreDisplay.textContent = String(score);
    }

    // Collision detection
    const birdLeft = bird.x - bird.radius;
    const birdRight = bird.x + bird.radius;
    const birdTop = bird.y - bird.radius;
    const birdBottom = bird.y + bird.radius;

    const pipeLeft = pipe.x;
    const pipeRight = pipe.x + PIPE_WIDTH;

    const overlapsX = birdRight > pipeLeft && birdLeft < pipeRight;
    if (overlapsX) {
      const hitsTop = birdTop < pipe.topHeight;
      const hitsBottom = birdBottom > pipe.bottomY;
      if (hitsTop || hitsBottom) {
        endGame();
        return;
      }
    }

    if (pipe.x + PIPE_WIDTH < 0) {
      pipes.splice(i, 1);
    }
  }

  // Ground scroll
  groundOffset -= PIPE_SPEED;
  if (groundOffset <= -24) {
    groundOffset = 0;
  }

  // Clouds
  clouds.forEach(cloud => {
    cloud.x -= cloud.speed;
    if (cloud.x < -60) {
      cloud.x = WIDTH + 60;
      cloud.y = 40 + Math.random() * 150;
    }
  });
}

function drawBackground() {
  ctx.fillStyle = '#70c5ce';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  clouds.forEach(cloud => {
    drawCloud(cloud.x, cloud.y, cloud.scale);
  });
}

function drawCloud(x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.beginPath();
  ctx.arc(0, 0, 20, 0, Math.PI * 2);
  ctx.arc(18, -6, 16, 0, Math.PI * 2);
  ctx.arc(-18, 4, 14, 0, Math.PI * 2);
  ctx.arc(10, 8, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPipes() {
  pipes.forEach(pipe => {
    // Top pipe
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
    ctx.fillStyle = '#3d8b40';
    ctx.fillRect(pipe.x - 3, pipe.topHeight - 24, PIPE_WIDTH + 6, 24);

    // Bottom pipe
    const bottomHeight = HEIGHT - GROUND_HEIGHT - pipe.bottomY;
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(pipe.x, pipe.bottomY, PIPE_WIDTH, bottomHeight);
    ctx.fillStyle = '#3d8b40';
    ctx.fillRect(pipe.x - 3, pipe.bottomY, PIPE_WIDTH + 6, 24);

    // Outline
    ctx.strokeStyle = '#2c6e2f';
    ctx.lineWidth = 2;
    ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
    ctx.strokeRect(pipe.x, pipe.bottomY, PIPE_WIDTH, bottomHeight);
  });
}

function drawGround() {
  const groundY = HEIGHT - GROUND_HEIGHT;
  ctx.fillStyle = '#ded895';
  ctx.fillRect(0, groundY, WIDTH, GROUND_HEIGHT);
  ctx.fillStyle = '#c2b280';
  ctx.fillRect(0, groundY, WIDTH, 12);

  // Scrolling stripe pattern
  ctx.fillStyle = '#b8a563';
  for (let x = groundOffset; x < WIDTH; x += 24) {
    ctx.fillRect(x, groundY + 12, 12, 6);
  }
}

function drawBird() {
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(bird.rotation);

  // Body
  ctx.fillStyle = '#ffcc00';
  ctx.beginPath();
  ctx.ellipse(0, 0, bird.radius, bird.radius * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#cc9900';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Wing
  ctx.fillStyle = '#ffe066';
  ctx.beginPath();
  ctx.ellipse(-4, 4, 8, 5, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Eye
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(6, -4, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(7.5, -4, 2, 0, Math.PI * 2);
  ctx.fill();

  // Beak
  ctx.fillStyle = '#ff8c00';
  ctx.beginPath();
  ctx.moveTo(bird.radius - 2, -2);
  ctx.lineTo(bird.radius + 8, 0);
  ctx.lineTo(bird.radius - 2, 4);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function render() {
  drawBackground();
  drawPipes();
  drawGround();
  drawBird();
}

function loop(timestamp) {
  const dt = timestamp - lastFrameTime;
  lastFrameTime = timestamp;

  if (state === 'playing') {
    update(dt);
  }
  render();

  animationId = requestAnimationFrame(loop);
}

// Draw an idle preview frame before the game starts
function renderIdle() {
  drawBackground();
  drawGround();
  drawBird();
}

// Input handling
function handleInput(e) {
  e.preventDefault();
  flap();
}

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault();
    flap();
  }
});

canvas.addEventListener('mousedown', handleInput);
canvas.addEventListener('touchstart', handleInput, { passive: false });

startBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  startGame();
});

restartBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  startGame();
});

// Initial idle render loop (clouds drift, bird bobs gently on start screen)
let idleTime = 0;
function idleLoop(timestamp) {
  if (state === 'start') {
    idleTime += 1;
    bird.y = HEIGHT / 2 + Math.sin(idleTime * 0.05) * 10;
    clouds.forEach(cloud => {
      cloud.x -= cloud.speed;
      if (cloud.x < -60) {
        cloud.x = WIDTH + 60;
      }
    });
    renderIdle();
    requestAnimationFrame(idleLoop);
  }
}

bestScoreEl.textContent = String(bestScore);
requestAnimationFrame(idleLoop);
