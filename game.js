const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('highScore');
const startBtn = document.getElementById('startBtn');

// Load high score from localStorage
let highScore = localStorage.getItem('flappyBirdHighScore') || 0;
highScoreDisplay.textContent = highScore;

// Game variables
const bird = {
    x: 50,
    y: canvas.height / 2,
    width: 30,
    height: 30,
    velocity: 0,
    gravity: 0.6,
    lift: -12
};

const pipes = [];
const pipeGap = 120;
const pipeWidth = 80;
const pipeSpacing = 200;

let score = 0;
let gameRunning = false;
let gameOver = false;
let lastPipeX = canvas.width;

// Event listeners
startBtn.addEventListener('click', startGame);
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (gameRunning) {
            bird.velocity = bird.lift;
        }
    }
});
canvas.addEventListener('click', () => {
    if (gameRunning) {
        bird.velocity = bird.lift;
    }
});

function startGame() {
    if (gameRunning || gameOver) {
        resetGame();
    }
    gameRunning = true;
    gameOver = false;
    score = 0;
    scoreDisplay.textContent = score;
    startBtn.textContent = 'Restart Game';
    gameLoop();
}

function resetGame() {
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    pipes.length = 0;
    lastPipeX = canvas.width;
    gameRunning = false;
    gameOver = false;
}

function gameLoop() {
    // Update
    update();

    // Draw
    draw();

    if (gameRunning) {
        requestAnimationFrame(gameLoop);
    }
}

function update() {
    // Update bird
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;

    // Check collision with ground and ceiling
    if (bird.y + bird.height > canvas.height || bird.y < 0) {
        endGame();
        return;
    }

    // Generate pipes
    if (lastPipeX < canvas.width - pipeSpacing) {
        const gapStart = Math.random() * (canvas.height - pipeGap - 100) + 50;
        pipes.push({
            x: canvas.width,
            gapStart: gapStart,
            gapEnd: gapStart + pipeGap,
            passed: false
        });
        lastPipeX = canvas.width;
    }

    // Update pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= 5;

        // Check if bird passed the pipe
        if (!pipes[i].passed && pipes[i].x + pipeWidth < bird.x) {
            pipes[i].passed = true;
            score++;
            scoreDisplay.textContent = score;
        }

        // Check collision with pipe
        if (
            bird.x < pipes[i].x + pipeWidth &&
            bird.x + bird.width > pipes[i].x &&
            (bird.y < pipes[i].gapStart || bird.y + bird.height > pipes[i].gapEnd)
        ) {
            endGame();
            return;
        }

        // Remove off-screen pipes
        if (pipes[i].x + pipeWidth < 0) {
            pipes.splice(i, 1);
        }
    }
}

function draw() {
    // Clear canvas
    ctx.fillStyle = 'rgba(135, 206, 235, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw bird
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(bird.x, bird.y, bird.width, bird.height);
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(bird.x + 20, bird.y + 10, 4, 0, Math.PI * 2);
    ctx.fill();

    // Draw pipes
    ctx.fillStyle = '#2ecc71';
    for (let pipe of pipes) {
        // Top pipe
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.gapStart);
        // Bottom pipe
        ctx.fillRect(pipe.x, pipe.gapEnd, pipeWidth, canvas.height - pipe.gapEnd);
    }
}

function endGame() {
    gameRunning = false;
    gameOver = true;

    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('flappyBirdHighScore', highScore);
        highScoreDisplay.textContent = highScore;
    }

    // Draw game over message
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '24px Arial';
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, canvas.height / 2 + 60);
}