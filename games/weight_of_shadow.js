const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const statusOverlay = document.getElementById('status-overlay');
const statusEl = document.getElementById('status');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const TILE_SIZE = 40;

// Game state
let player = {
    x: 100,
    y: 100,
    vx: 0,
    vy: 0,
    radius: 12,
    color: '#e94560'
};

let tilt = 0; // -1 to 1
let gravityForce = { x: 0, y: 0 };
let gameState = 'playing'; // 'playing', 'stasis', 'gameover', 'win'
let stasisProgress = 0;
let currentStasisGate = null;

// Maze Map: 1 = wall, 0 = path, 2 = stasis gate, 3 = pit, 4 = exit
const map = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
    [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
    [1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1],
    [1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1,0,1],
    [1,1,1,0,1,0,1,1,1,1,1,1,1,1,0,1,0,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,1,0,1],
    [1,0,1,1,1,1,1,0,1,1,1,1,0,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
    [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
    [1,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,1],
    [1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,1,0,1],
    [1,1,1,0,1,0,1,1,1,1,1,1,1,1,0,1,0,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1],
    [1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// Hand-place hazards/objectives on reachable path cells.
map[5][5] = 2;   // stasis gate
map[9][12] = 2;  // stasis gate
map[7][10] = 3;  // pit
map[15][13] = 3; // pit
map[19][18] = 4; // exit

const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

function update() {
    if (gameState === 'gameover' || gameState === 'win') return;

    let moveX = 0;
    let moveY = 0;
    if (keys['ArrowUp'] || keys['KeyW']) moveY -= 1;
    if (keys['ArrowDown'] || keys['KeyS']) moveY += 1;
    if (keys['ArrowLeft'] || keys['KeyA']) moveX -= 1;
    if (keys['ArrowRight'] || keys['KeyD']) moveX += 1;

    // Apply input to velocity
    player.vx += moveX * 0.5;
    player.vy += moveY * 0.5;

    // Friction
    player.vx *= 0.9;
    player.vy *= 0.9;

    // Tilt calculation
    const speed = Math.sqrt(player.vx**2 + player.vy**2);
    statusEl.innerText = speed < 0.5 ? 'The floor is starting to tilt...' : 'Momentum lightens the shadow.';
    if (speed < 0.5) {
        tilt += 0.005;
        if (tilt > 1) tilt = 1;
        if (tilt < -1) tilt = -1;
    } else {
        tilt *= 0.95;
        if (Math.abs(tilt) < 0.01) tilt = 0;
    }

    // Gravity force from tilt
    gravityForce.x = tilt * 0.2;
    gravityForce.y = tilt * 0.2;

    // Apply gravity and velocity
    player.vx += gravityForce.x;
    player.vy += gravityForce.y;

    // Collision detection
    let nextX = player.x + player.vx;
    let nextY = player.y + player.vy;

    const mapX = Math.floor(nextX / TILE_SIZE);
    const mapY = Math.floor(nextY / TILE_SIZE);

    // Simple wall collision
    if (map[mapY] && map[mapY][mapX] === 1) {
        player.vx *= -0.5;
        player.vy *= -0.5;
    } else {
        player.x = nextX;
        player.y = nextY;
    }

    // Pit detection
    if (map[mapY] && map[mapY][mapX] === 3) {
        gameState = 'gameover';
        statusEl.innerText = 'You fell into the void. Resetting...';
        setTimeout(() => {
            player.x = 100;
            player.y = 100;
            player.vx = 0;
            player.vy = 0;
            tilt = 0;
            gameState = 'playing';
            statusEl.innerText = 'Keep moving. Stasis is a heavy burden.';
        }, 1000);
    }

    // Stasis Gate detection
    if (map[mapY] && map[mapY][mapX] === 2) {
        if (speed < 0.5) {
            gameState = 'stasis';
            stasisProgress += 0.02;
            statusOverlay.style.display = 'block';
            statusOverlay.innerText = `STASIS: ${Math.min(100, Math.floor(stasisProgress * 100))}%`;
            
            if (stasisProgress >= 1) {
                gameState = 'playing';
                map[mapY][mapX] = 0;
                stasisProgress = 0;
                statusOverlay.style.display = 'none';
                statusEl.innerText = 'Gate released. Move before the floor remembers your weight.';
            }
        } else {
            gameState = 'playing';
            stasisProgress = 0;
            statusOverlay.style.display = 'none';
        }
    }

    // Exit detection
    if (map[mapY] && map[mapY][mapX] === 4) {
        gameState = 'win';
        statusEl.innerText = 'You balanced the shadow. Returning to the Maze...';
        statusEl.style.color = '#44ff44';
        setTimeout(() => { window.location.href = '../index.html'; }, 1000);
    }

    // Bounds check
    if (player.x < 0 || player.x > WIDTH || player.y < 0 || player.y > HEIGHT) {
        gameState = 'gameover';
        setTimeout(() => {
            player.x = 100;
            player.y = 100;
            player.vx = 0;
            player.vy = 0;
            tilt = 0;
            gameState = 'playing';
        }, 1000);
    }
}

function draw() {
    // Clear
    ctx.fillStyle = '#0f3460';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Draw Map
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            const cell = map[y][x];
            if (cell === 1) {
                ctx.fillStyle = '#16213e';
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                // Shimmer
                ctx.strokeStyle = `rgba(233, 69, 96, ${0.1 + Math.sin(Date.now() / 500) * 0.05})`;
                ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            } else if (cell === 2) {
                ctx.fillStyle = '#e94560';
                ctx.fillRect(x * TILE_SIZE + 5, y * TILE_SIZE + 5, TILE_SIZE - 10, TILE_SIZE - 10);
            } else if (cell === 3) {
                ctx.fillStyle = '#000';
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            } else if (cell === 4) {
                ctx.fillStyle = '#4ecc71';
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }

    // Draw Player
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();
    ctx.closePath();

    // Tilt effect (camera shake/shift)
    ctx.save();
    ctx.translate(WIDTH / 2 - (tilt * 20), HEIGHT / 2 - (tilt * 20));
    ctx.rotate(tilt * 0.05);
    // redraw everything in a relative space or just apply a global transform
    // For simplicity, let's just apply the tilt to the player's draw or a container.
    // Actually, applying it to the canvas context is easier.
    ctx.restore();

    // Re-draw player with tilt
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(tilt * 0.2);
    ctx.beginPath();
    ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();
    ctx.closePath();
    ctx.restore();

    // HUD
    ctx.fillStyle = 'white';
    ctx.font = '16px Courier New';
    ctx.fillText(`Tilt: ${tilt.toFixed(2)}`, 20, 30);
    if (gameState === 'gameover') {
        ctx.fillStyle = 'red';
        ctx.font = '40px Courier New';
        ctx.fillText('FELL INTO THE VOID', WIDTH / 2 - 150, HEIGHT / 2);
    }

    requestAnimationFrame(() => {
        update();
        draw();
    });
}

draw();
