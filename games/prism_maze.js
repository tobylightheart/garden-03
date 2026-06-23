const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const timerEl = document.getElementById('timer');
const bestScoreEl = document.getElementById('best-score');

const GRID_SIZE = 40;
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// Game state
let mirrors = [];
let walls = [];
let beam = { x: 60, y: 60, angle: 0, reflections: 0 };
let sanctum = { x: 740, y: 540, radius: 30 };
let selectedMirror = null;
let gameOver = false;

// Particle system
let particles = [];
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.01;
        this.color = color;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }
    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

// Audio setup
let audioCtx = null;
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playPing() {
    if (!audioCtx) initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.2);
}

function playWin() {
    if (!audioCtx) initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
}

// UI Elements
let startTime = null;
let timeLeft = 60;
let bestScore = localStorage.getItem('prism_maze_best');

if (bestScore) {
    bestScoreEl.innerText = bestScore;
} else {
    bestScoreEl.innerText = '--';
}

function updateTimer() {
    if (gameOver) return;
    if (!startTime) startTime = Date.now();
    
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    timeLeft = Math.max(0, 60 - elapsed);
    
    timerEl.innerText = timeLeft;
    
    if (timeLeft <= 10) {
        timerEl.classList.add('critical-time');
    } else {
        timerEl.classList.remove('critical-time');
    }
    
    if (timeLeft <= 0) {
        gameOver = true;
        statusEl.innerText = "TIME EXPIRED!";
        statusEl.style.color = "#ff4444";
    }
    
    requestAnimationFrame(updateTimer);
}

function saveHighScore(finalTime) {
    if (bestScore === null || bestScore === '--' || finalTime < parseInt(bestScore)) {
        localStorage.setItem('prism_maze_best', finalTime);
        bestScore = finalTime;
        bestScoreEl.innerText = bestScore;
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

function castRay(x, y, angle, depth, path = []) {
    if (depth > 15) return path;
    
    let dx = Math.cos(angle);
    let dy = Math.sin(angle);
    
    let closestDist = Infinity;
    let hitObj = null;
    
    path.push({ x, y, dx, dy });

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
            playWin();
            saveHighScore(timeLeft);
        }
    }

    if (hitObj) {
        if (hitObj.type === 'mirror') {
            beam.reflections++;
            // Spawn particles
            for (let i = 0; i < 5; i++) {
                particles.push(new Particle(hitObj.x, hitObj.y, '#00d4ff'));
            }
            const newAngle = 2 * hitObj.angle - angle;
            castRay(hitObj.x, hitObj.y, newAngle, depth + 1, path);
        } else {
            // Hit wall, stop.
            path.push({ x: hitObj.x, y: hitObj.y, dx: 0, dy: 0 });
        }
    } else {
        path.push({ x: x + dx * closestDist, y: y + dy * closestDist, dx: 0, dy: 0 });
    }
    
    return path;
}

// Rendering
let currentBeamPath = [];

function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Update and draw particles
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
        p.update();
        p.draw(ctx);
    });

    // Draw Walls (Dynamic Lighting)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)'; // Very dim base
    for (const wall of walls) {
        ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    }

    // Draw "Lit" Walls
    ctx.fillStyle = 'rgba(0, 212, 255, 0.15)';
    currentBeamPath.forEach(p => {
        // Draw a small radius of light around each point of the beam
        const litRadius = 40;
        ctx.beginPath();
        ctx.arc(p.x, p.y, litRadius, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw Sanctum
    ctx.beginPath();
    ctx.arc(sanctum.x, sanctum.y, sanctum.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ff00ff';
    ctx.shadowBlur = 15 + Math.sin(Date.now() / 500) * 5;
    ctx.shadowColor = '#ff00ff';
    
    const pulse = Math.sin(Date.now() / 500) * 5;
    ctx.arc(sanctum.x, sanctum.y, sanctum.radius + pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Beam Source
    ctx.beginPath();
    ctx.arc(beam.x, beam.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#00d4ff';
    ctx.fill();

    // Draw Mirrors
    mirrors.forEach(m => {
        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.rotate(m.angle);
        
        // Glow
        if (selectedMirror === m) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#fff';
        }

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
    if (currentBeamPath.length > 0) {
        ctx.moveTo(currentBeamPath[0].x, currentBeamPath[0].y);
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#00d4ff';
        
        for (let i = 1; i < currentBeamPath.length; i++) {
            ctx.lineTo(currentBeamPath[i].x, currentBeamPath[i].y);
        }
        ctx.stroke();
    }
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
            playPing();
        } else if (e.key === 'ArrowRight') {
            selectedMirror.angle += 0.1;
            playPing();
        }
    }
});

// Start
startTime = Date.now();
updateTimer();

// Re-calculate beam path every frame for dynamic lighting
function animateBeam() {
    currentBeamPath = castRay(beam.x, beam.y, beam.angle, 0);
    requestAnimationFrame(animateBeam);
}
animateBeam();
draw();
