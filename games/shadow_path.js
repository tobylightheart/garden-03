const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
let hasWon = false;

const TILE_SIZE = 40;
const COLS = canvas.width / TILE_SIZE;
const ROWS = canvas.height / TILE_SIZE;

// 1 = wall, 0 = empty, 2 = goal
const maze = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,0,1,1,1,1,1,1,1,0,1,1,1,0,1],
    [1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1],
    [1,0,1,0,1,1,1,1,1,0,1,1,0,1,1,1,0,1,0,1],
    [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,1],
    [1,1,1,0,1,1,1,0,1,1,1,1,1,1,1,1,0,1,0,1],
    [1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1,0,1],
    [1,0,1,1,1,0,1,1,1,1,0,1,1,1,0,1,0,1,0,1],
    [1,0,0,0,0,0,1,0,0,1,0,0,0,1,0,1,0,0,0,1],
    [1,1,1,1,1,0,1,0,0,1,1,1,0,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,1,1,1,1,1,0,1,1,1,1,1,0,1],
    [1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// Inject goal in a random but reachable spot
maze[13][15] = 2;

let player = {
    x: 1 * TILE_SIZE,
    y: 1 * TILE_SIZE,
    width: 30,
    height: 30,
    speed: 4,
    vx: 0,
    vy: 0,
    isMoving: false
};

const keys = {};

window.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
});

window.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
});

function update() {
    player.vx = 0;
    player.vy = 0;
    player.isMoving = false;

    if (keys['ArrowUp'] || keys['w']) {
        player.vy = -player.speed;
        player.isMoving = true;
    }
    if (keys['ArrowDown'] || keys['s']) {
        player.vy = player.speed;
        player.isMoving = true;
    }
    if (keys['ArrowLeft'] || keys['a']) {
        player.vx = -player.speed;
        player.isMoving = true;
    }
    if (keys['ArrowRight'] || keys['d']) {
        player.vx = player.speed;
        player.isMoving = true;
    }

    // Simple collision detection
    let nextX = player.x + player.vx;
    let nextY = player.y + player.vy;

    // Check boundaries and walls
    const checkCollision = (x, y) => {
        const col = Math.floor(x / TILE_SIZE);
        const row = Math.floor(y / TILE_SIZE);
        if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return true;
        return maze[row][col] === 1;
    };

    if (!checkCollision(nextX, player.y)) {
        player.x = nextX;
    } else {
        player.vx = 0;
    }

    if (!checkCollision(player.x, nextY)) {
        player.y = nextY;
    } else {
        player.vy = 0;
    }

    // Check goal
    const goalCol = Math.floor(player.x / TILE_SIZE);
    const goalRow = Math.floor(player.y / TILE_SIZE);
    if (!hasWon && maze[goalRow][goalCol] === 2) {
        hasWon = true;
        statusEl.innerText = 'Exit found. The next chamber opens...';
        statusEl.style.color = '#44ff44';
        setTimeout(() => { window.location.href = 'fractal_fold.html'; }, 900);
    } else if (!hasWon) {
        statusEl.innerText = player.isMoving ? 'Moving blind — remember the corridor.' : 'Stillness reveals the path.';
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw maze
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (maze[r][c] === 1) {
                ctx.fillStyle = '#555';
                if (player.isMoving) {
                    ctx.globalAlpha = 0.2;
                    ctx.filter = 'blur(4px)';
                } else {
                    ctx.globalAlpha = 1.0;
                    ctx.filter = 'none';
                }
                ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                ctx.filter = 'none';
                ctx.globalAlpha = 1.0;
            } else if (maze[r][c] === 2) {
                ctx.fillStyle = '#0f0';
                ctx.fillRect(c * TILE_SIZE + 5, r * TILE_SIZE + 5, TILE_SIZE - 10, TILE_SIZE - 10);
            }
        }
    }

    // Draw player
    ctx.fillStyle = '#0af';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    requestAnimationFrame(() => {
        update();
        draw();
    });
}

draw();
