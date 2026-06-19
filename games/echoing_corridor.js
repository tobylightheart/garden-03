const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const noiseBar = document.getElementById('noise-bar');
const statusText = document.getElementById('status');

const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;

// Game State
let player = {
    x: 50,
    y: 50,
    radius: 8,
    speed: 2.5,
    color: '#fff'
};

let goal = {
    x: 750,
    y: 550,
    radius: 15
};

let walls = [];
let pings = [];
let noiseLevel = 0;
let shadowEntity = {
    x: 800,
    y: 600,
    radius: 12,
    speed: 1.2,
    active: false
};

// Generate Maze (Simple grid-based walls)
function initMaze() {
    walls = [];
    // Outer boundaries
    walls.push({x: 0, y: 0, w: 800, h: 10});
    walls.push({x: 0, y: 590, w: 800, h: 10});
    walls.push({x: 0, y: 0, w: 10, h: 600});
    walls.push({x: 790, y: 0, w: 10, h: 600});

    // Random internal walls
    for (let i = 0; i < 15; i++) {
        let w = Math.random() * 200 + 50;
        let h = Math.random() * 200 + 50;
        let x = Math.random() * (GAME_WIDTH - w);
        let y = Math.random() * (GAME_HEIGHT - h);
        // Don't block the start or end
        if (x < 150 || y < 150 || x > 600 || y > 400) {
            walls.push({x, y, w, h});
        }
    }
}

initMaze();

const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

canvas.addEventListener('mousedown', () => {
    pings.push({
        x: player.x,
        y: player.y,
        radius: 0,
        maxRadius: 150,
        speed: 4,
        opacity: 1
    });
    noiseLevel += 25;
});

function update() {
    // Movement
    let dx = 0;
    let dy = 0;
    if (keys['ArrowUp'] || keys['KeyW']) dy -= player.speed;
    if (keys['ArrowDown'] || keys['KeyS']) dy += player.speed;
    if (keys['ArrowLeft'] || keys['KeyA']) dx -= player.speed;
    if (keys['ArrowRight'] || keys['KeyD']) dx += player.speed;

    // Collision with walls
    let nextX = player.x + dx;
    let nextY = player.y + dy;

    let hit = false;
    for (let wall of walls) {
        if (nextX + player.radius > wall.x && nextX - player.radius < wall.x + wall.w &&
            nextY + player.radius > wall.y && nextY - player.radius < wall.y + wall.h) {
            hit = true;
            break;
        }
    }

    if (!hit) {
        player.x = nextX;
        player.y = nextY;
    }

    // Pings
    for (let i = pings.length - 1; i >= 0; i--) {
        let p = pings[i];
        p.radius += p.speed;
        p.opacity -= 0.01;
        if (p.radius > p.maxRadius || p.opacity <= 0) {
            pings.splice(i, 1);
        }
    }

    // Noise Decay
    noiseLevel -= 0.5;
    if (noiseLevel < 0) noiseLevel = 0;
    noiseBar.style.width = `${noiseLevel}%`;

    // Shadow Entity Logic
    if (noiseLevel > 50) {
        shadowEntity.active = true;
        let angle = Math.atan2(player.y - shadowEntity.y, player.x - shadowEntity.x);
        shadowEntity.x += Math.cos(angle) * shadowEntity.speed;
        shadowEntity.y += Math.sin(angle) * shadowEntity.speed;
    } else {
        shadowEntity.active = false;
    }

    // Check Win
    let distToGoal = Math.hypot(player.x - goal.x, player.y - goal.y);
    if (distToGoal < goal.radius + player.radius) {
        statusText.innerText = "STATUS: ESCAPED!";
        statusText.style.color = "#44ff44";
    }

    // Check Game Over
    let distToShadow = Math.hypot(player.x - shadowEntity.x, player.y - shadowEntity.y);
    if (shadowEntity.active && distToShadow < shadowEntity.radius + player.radius) {
        statusText.innerText = "STATUS: CONSUMED BY SHADOW";
        statusText.style.color = "#ff4444";
        player.speed = 0;
    }
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw Walls (Only if nearby or pinged)
    ctx.fillStyle = '#333';
    for (let wall of walls) {
        // Simple optimization: only draw if in view/near pings
        ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    }

    // Draw Goal
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(goal.x, goal.y, goal.radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw Pings
    for (let p of pings) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Draw Player
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw Shadow
    if (shadowEntity.active) {
        ctx.fillStyle = 'rgba(100, 0, 0, 0.8)';
        ctx.beginPath();
        ctx.arc(shadowEntity.x, shadowEntity.y, shadowEntity.radius, 0, Math.PI * 2);
        ctx.fill();
        // Glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'red';
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    requestAnimationFrame(() => {
        update();
        draw();
    });
}

draw();
