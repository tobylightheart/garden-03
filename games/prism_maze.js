const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const GRID_SIZE = 40;
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// Game state
let mirrors = [];
let walls = [];
let beam = { x: 0, y: 0, angle: 0, reflections: 0 };
let sanctum = { x: 400, y: 300, radius: 30 };
let selectedMirror = null;
let gameOver = false;

// UI Elements
const timerEl = document.getElementById('timer');
const bestScoreEl = document.getElementById('best-score');
let startTime = null;
let timer = 0;
let bestScore = localStorage.getItem('prism_maze_best') || '--';
bestScoreEl.innerText = bestScore;

function updateTimer() {
    if (gameOver) return;
    timer = Math.floor((Date.now() - startTime) / 1000);
    timerEl.innerText = timer;
    requestAnimationFrame(updateTimer);
}

function saveHighScore() {
    if (timer > 0 && timer < bestScore && bestScore !== '--') {
        localStorage.setItem('prism_maze_best', timer);
        bestScoreEl.innerText = timer;
    }
}

// Level layout (0 = empty, 1 = wall, 2 = mirror, 3 = beam source, 4 = sanctum)
const level = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,0,0,0,0,0,0,1,1,1,0,0,0,0,0,1],
    [1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1],
    [1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1],
    [1,0,1,1,1,0,0,0,0,0,0,1,1,1,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,0,0,0,0,0,0,1,1,1,0,0,0,0,0,1],
    [1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1],
    [1,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1],
    [1,0,1,1,1,0,0,0,0,0,0,1,1,1,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// Initialize entities
for (let y = 0; y < level.length; y++) {
    for (let x = 0; x < level[y].length; x++) {
        const cell = level[y][x];
        if (cell === 1) {
            walls.push({ x: x * GRID_SIZE, y: y * GRID_SIZE, w: GRID_SIZE, h: GRID_SIZE });
        } else if (cell === 2) {
            mirrors.push({ x: x * GRID_SIZE, y: y * GRID_SIZE, angle: Math.random() * Math.PI * 2 });
        } else if (cell === 3) {
            beam.x = x * GRID_SIZE;
            beam.y = y * GRID_SIZE;
            beam.angle = 0;
        } else if (cell === 4) {
            sanctum.x = x * GRID_SIZE;
            sanctum.y = y * GRID_SIZE;
        }
    }
}

// Add some mirrors to make it a real puzzle
for (let i = 0; i < 10; i++) {
    let mx, my;
    do {
        mx = Math.floor(Math.random() * (level[0].length - 2)) + 1;
        my = Math.floor(Math.random() * (level.length - 2)) + 1;
    } while (level[my][mx] !== 0);
    level[my][mx] = 2;
    mirrors.push({ x: mx * GRID_SIZE, y: my * GRID_SIZE, angle: Math.random() * Math.PI * 2 });
}

function castRay(x, y, angle, depth) {
    if (depth > 15) return;
    
    let dx = Math.cos(angle);
    let dy = Math.sin(angle);
    
    let closestDist = Infinity;
    let hitObj = null;

    // Walls
    for (const wall of walls) {
        let tmin = (wall.x - x) / dx;
        let tmax = (wall.x + wall.w - x) / dx;
        if (tmin > tmax) [tmin, tmax] = [tmax, tmin];
        
        let tymin = (wall.y - y) / dy;
        let tymax = (wall.y + wall.h - y) / dy;
        if (tymin > tymax) [tymin, tymax] = [tymax, tymin];
        
        let tEnter = Math.max(tmin, tymin);
        let tExit = Math.min(tmax, tymax);
        
        if (tEnter < tExit && tEnter > 0 && tEnter < closestDist) {
            closestDist = tEnter;
            hitObj = { type: 'wall', x: x + dx * tEnter, y: y + dy * tEnter };
        }
    }

    // Mirrors
    for (const m of mirrors) {
        const dist = Math.sqrt((m.x - x)**2 + (m.y - y)**2);
        if (dist < 20 && dist > 0) {
            const normalX = -Math.sin(m.angle);
            const normalY = Math.cos(m.angle);
            const dot = dx * normalX + dy * normalY;
            
            if (dot < 0) {
                if (dist < closestDist) {
                    closestDist = dist;
                    hitObj = { type: 'mirror', x: m.x, y: m.y, angle: m.angle };
                }
            }
        }
    }

    // Sanctum
    const distToSanctum = Math.sqrt((sanctum.x - x)**2 + (sanctum.y - y)**2);
    if (distToSanctum < sanctum.radius) {
        if (beam.reflections >= 5) {
            gameOver = true;
            statusEl.innerText = "SUCCESS! You reached the Sanctum.";
            statusEl.style.color = "#00ff00";
            saveHighScore();
        }
    }

    if (hitObj) {
        if (hitObj.type === 'mirror') {
            beam.reflections++;
            const newAngle = 2 * hitObj.angle - beam.angle;
            castRay(hitObj.x, hitObj.y, newAngle, depth + 1);
        } else {
            // Hit wall, stop.
        }
    }
}

// Rendering
function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Draw Walls
    ctx.fillStyle = '#222';
    for (const wall of walls) {
        ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    }

    // Draw Sanctum
    ctx.beginPath();
    ctx.arc(sanctum.x, sanctum.y, sanctum.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ff00ff';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff00ff';
    
    // Add pulse effect
    const pulse = Math.sin(Date.now() / 500) * 5;
    ctx.arc(sanctum.x, sanctum.y, sanctum.radius + pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Mirrors
    mirrors.forEach(m => {
        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.rotate(m.angle);
        ctx.strokeStyle = selectedMirror === m ? '#fff' : '#00d4ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-15, 0);
        ctx.lineTo(15, 0);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.restore();
    });

    // Draw Beam
    ctx.beginPath();
    ctx.moveTo(beam.x, beam.y);
    
    let curX = beam.x;
    let curY = beam.y;
    let curAngle = beam.angle;
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 5;
    ctx.shadowColor = '#00d4ff';
    
    ctx.moveTo(curX, curY);
    for (let i = 0; i < 15; i++) {
        let dx = Math.cos(curAngle);
        let dy = Math.sin(curAngle);
        let closestDist = Infinity;
        let hit = null;

        for (const wall of walls) {
            let tmin = (wall.x - curX) / dx;
            let tmax = (wall.x + wall.w - curX) / dx;
            if (tmin > tmax) [tmin, tmax] = [tmax, tmin];
            let tymin = (wall.y - curY) / dy;
            let tymax = (wall.y + wall.h - curY) / dy;
            if (tymin > tymax) [tymin, tymax] = [tymax, tymin];
            let tEnter = Math.max(tmin, tymin);
            let tExit = Math.min(tmax, tymax);
            if (tEnter < tExit && tEnter > 0 && tEnter < closestDist) {
                closestDist = tEnter;
                hit = { type: 'wall', x: curX + dx * tEnter, y: curY + dy * tEnter };
            }
        }

        for (const m of mirrors) {
            const dist = Math.sqrt((m.x - curX)**2 + (m.y - curY)**2);
            if (dist < 20 && dist > 0) {
                const normalX = -Math.sin(m.angle);
                const normalY = Math.cos(m.angle);
                const dot = dx * normalX + dy * normalY;
                if (dot < 0) {
                    if (dist < closestDist) {
                        closestDist = dist;
                        hit = { type: 'mirror', x: m.x, y: m.y, angle: m.angle };
                    }
                }
            }
        }

        if (hit) {
            ctx.lineTo(hit.x, hit.y);
            if (hit.type === 'mirror') {
                curX = hit.x;
                curY = hit.y;
                curAngle = 2 * hit.angle - curAngle;
                beam.reflections++;
            } else {
                break;
            }
        } else {
            ctx.lineTo(curX + dx * closestDist, curY + dy * closestDist);
            break;
        }
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    requestAnimationFrame(draw);
}

// Input handling
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    selectedMirror = mirrors.find(m => {
        const dist = Math.sqrt((m.x - mouseX)**2 + (m.y - mouseY)**2);
        return dist < 20;
    });
});

window.addEventListener('keydown', (e) => {
    if (selectedMirror) {
        if (e.key === 'ArrowLeft') {
            selectedMirror.angle -= 0.1;
        } else if (e.key === 'ArrowRight') {
            selectedMirror.angle += 0.1;
        }
    }
});

// Start
startTime = Date.now();
updateTimer();
draw();
