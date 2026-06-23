const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const statusOverlay = document.getElementById('status-overlay');
const statusEl = document.getElementById('status');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const TILE_SIZE = 40;

const player = {
    x: 60,
    y: 60,
    vx: 0,
    vy: 0,
    radius: 12,
    color: '#e94560'
};

let tilt = { x: 0, y: 0 };
let gameState = 'playing';
let stasisProgress = 0;
let lastTime = performance.now();

// Maze Map: 1 = wall, 0 = path, 2 = stasis gate, 3 = pit, 4 = exit
const map = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
    [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
    [1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1],
    [1,0,0,0,1,2,0,0,0,0,0,0,0,0,0,1,0,1,0,1],
    [1,1,1,0,1,0,1,1,1,1,1,1,1,1,0,1,0,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,3,0,0,1,0,0,0,1,0,1],
    [1,0,1,1,1,1,1,0,1,1,1,1,0,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,1,0,0,1,2,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
    [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
    [1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1],
    [1,0,0,0,1,0,0,0,0,0,0,0,0,3,0,1,0,1,0,1],
    [1,1,1,0,1,0,1,1,1,1,1,1,1,1,0,1,0,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
    [1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

const keys = {};
window.addEventListener('keydown', e => { keys[e.code] = true; });
window.addEventListener('keyup', e => { keys[e.code] = false; });

function resetPlayer(message = 'Reset. Keep moving; the floor remembers stillness.') {
    player.x = 60;
    player.y = 60;
    player.vx = 0;
    player.vy = 0;
    tilt.x = 0;
    tilt.y = 0;
    stasisProgress = 0;
    statusOverlay.style.display = 'none';
    gameState = 'playing';
    statusEl.innerText = message;
    statusEl.style.color = '';
}

function cellAt(x, y) {
    const mapX = Math.floor(x / TILE_SIZE);
    const mapY = Math.floor(y / TILE_SIZE);
    if (!map[mapY] || map[mapY][mapX] === undefined) return 1;
    return map[mapY][mapX];
}

function hitsWall(x, y) {
    const r = player.radius;
    return [
        [x - r, y - r], [x + r, y - r], [x - r, y + r], [x + r, y + r]
    ].some(([px, py]) => cellAt(px, py) === 1);
}

function update(now = performance.now()) {
    const dt = Math.min(2, (now - lastTime) / 16.67);
    lastTime = now;
    if (gameState === 'gameover' || gameState === 'win') return;

    const inputX = (keys['ArrowRight'] || keys['KeyD'] ? 1 : 0) - (keys['ArrowLeft'] || keys['KeyA'] ? 1 : 0);
    const inputY = (keys['ArrowDown'] || keys['KeyS'] ? 1 : 0) - (keys['ArrowUp'] || keys['KeyW'] ? 1 : 0);
    const hasInput = inputX !== 0 || inputY !== 0;

    // Keys tilt the floor, not a one-frame impulse. Tilt persists and decays
    // slowly, so every direction visibly changes motion.
    tilt.x += inputX * 0.035 * dt;
    tilt.y += inputY * 0.035 * dt;
    tilt.x = Math.max(-1, Math.min(1, tilt.x));
    tilt.y = Math.max(-1, Math.min(1, tilt.y));

    if (!hasInput) {
        tilt.x *= 0.992;
        tilt.y *= 0.992;
    }

    player.vx += tilt.x * 0.28 * dt;
    player.vy += tilt.y * 0.28 * dt;
    player.vx *= 0.985;
    player.vy *= 0.985;

    let nextX = player.x + player.vx * dt;
    let nextY = player.y + player.vy * dt;

    if (!hitsWall(nextX, player.y)) {
        player.x = nextX;
    } else {
        player.vx *= -0.35;
    }

    if (!hitsWall(player.x, nextY)) {
        player.y = nextY;
    } else {
        player.vy *= -0.35;
    }

    const cell = cellAt(player.x, player.y);
    const speed = Math.hypot(player.vx, player.vy);

    if (cell === 3) {
        gameState = 'gameover';
        statusEl.innerText = 'You fell into the void. Resetting...';
        setTimeout(() => resetPlayer(), 900);
        return;
    }

    if (cell === 2) {
        if (speed < 0.45) {
            stasisProgress += 0.012 * dt;
            statusOverlay.style.display = 'block';
            statusOverlay.innerText = `STASIS: ${Math.min(100, Math.floor(stasisProgress * 100))}%`;
            statusEl.innerText = 'Hold still. The gate is learning your weight.';
            if (stasisProgress >= 1) {
                const mapX = Math.floor(player.x / TILE_SIZE);
                const mapY = Math.floor(player.y / TILE_SIZE);
                map[mapY][mapX] = 0;
                stasisProgress = 0;
                statusOverlay.style.display = 'none';
                statusEl.innerText = 'Gate released. Tilt away before momentum returns.';
            }
        } else {
            stasisProgress = 0;
            statusOverlay.style.display = 'none';
            statusEl.innerText = 'Slow down on the stasis gate to unlock it.';
        }
    } else {
        stasisProgress = 0;
        statusOverlay.style.display = 'none';
        statusEl.innerText = hasInput ? 'Tilt holds. Let momentum carry you.' : 'No input: tilt slowly settles.';
    }

    if (cell === 4) {
        gameState = 'win';
        statusEl.innerText = 'You balanced the shadow. Returning to the Maze...';
        statusEl.style.color = '#44ff44';
        setTimeout(() => { window.location.href = '../index.html'; }, 1000);
    }
}

function draw() {
    ctx.fillStyle = '#07111f';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.save();
    ctx.translate(WIDTH / 2, HEIGHT / 2);
    ctx.rotate((tilt.x - tilt.y) * 0.02);
    ctx.translate(-WIDTH / 2, -HEIGHT / 2);

    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            const cell = map[y][x];
            if (cell === 1) {
                ctx.fillStyle = '#16213e';
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = `rgba(233, 69, 96, ${0.12 + Math.sin(Date.now() / 500) * 0.05})`;
                ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            } else if (cell === 2) {
                ctx.fillStyle = '#e94560';
                ctx.fillRect(x * TILE_SIZE + 5, y * TILE_SIZE + 5, TILE_SIZE - 10, TILE_SIZE - 10);
            } else if (cell === 3) {
                ctx.fillStyle = '#000';
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            } else if (cell === 4) {
                ctx.fillStyle = '#4ecc71';
                ctx.fillRect(x * TILE_SIZE + 4, y * TILE_SIZE + 4, TILE_SIZE - 8, TILE_SIZE - 8);
            }
        }
    }

    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.shadowBlur = 12;
    ctx.shadowColor = player.color;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();

    ctx.fillStyle = 'white';
    ctx.font = '16px Courier New';
    ctx.fillText(`Tilt X:${tilt.x.toFixed(2)} Y:${tilt.y.toFixed(2)}  Speed:${Math.hypot(player.vx, player.vy).toFixed(2)}`, 20, 30);

    requestAnimationFrame((now) => {
        update(now);
        draw();
    });
}

resetPlayer('Use WASD/Arrows to tilt the floor. Tilt persists, so steer early.');
draw();
