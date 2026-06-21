const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const noiseBar = document.getElementById('noise-bar');
const statusText = document.getElementById('status');
const scoreText = document.getElementById('score');
const highScoreText = document.getElementById('high-score');
const timerText = document.getElementById('timer');

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
    radius: 15,
    pulse: 0
};

let walls = [];
let pings = [];
let particles = [];
let noiseLevel = 0;
let score = 0;
let highScore = localStorage.getItem('echoing_corridor_high_score') || 0;

// Time Attack State
let gameTime = 120; // 2 minutes
let gameActive = true;

highScoreText.innerText = `BEST: ${highScore}`;
timerText.innerText = `TIME: 02:00`;

let shadowEntity = {
    x: 800,
    y: 600,
    radius: 12,
    speed: 1.2,
    active: false,
    lastHum: 0
};

// Visual Polish
let shakeIntensity = 0;

// Audio System
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playPing() {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.5);
    
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
}

function playShadowHum() {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(60, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

function createParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 1.0,
            color: color,
            size: Math.random() * 3 + 1
        });
    }
}

// Generate Maze
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
    if (!gameActive) return;
    initAudio();
    playPing();
    pings.push({
        x: player.x,
        y: player.y,
        radius: 0,
        maxRadius: 250,
        speed: 5,
        opacity: 1,
        pulse: 0
    });
    noiseLevel += 25;
    createParticles(player.x, player.y, '#fff', 15);
});

function update() {
    if (!gameActive) return;

    // Time Attack Logic
    gameTime -= 1/60;
    let mins = Math.floor(gameTime / 60);
    let secs = Math.floor(gameTime % 60);
    timerText.innerText = `TIME: ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    if (gameTime <= 0) {
        gameActive = false;
        statusText.innerText = "STATUS: TIME EXPIRED";
        statusText.style.color = "#ff4444";
    }

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
        p.pulse += 0.2;
        if (p.radius > p.maxRadius || p.opacity <= 0) {
            pings.splice(i, 1);
        }
    }

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }

    // Noise Decay
    noiseLevel -= 0.5;
    if (noiseLevel < 0) noiseLevel = 0;
    noiseBar.style.width = `${noiseLevel}%`;

    // Score increment
    score += 0.1;
    scoreText.innerText = `SCORE: ${Math.floor(score)}`;

    // Shadow Entity Logic
    if (noiseLevel > 50) {
        shadowEntity.active = true;
        let angle = Math.atan2(player.y - shadowEntity.y, player.x - shadowEntity.x);
        shadowEntity.x += Math.cos(angle) * shadowEntity.speed;
        shadowEntity.y += Math.sin(angle) * shadowEntity.speed;
        
        // Screen shake
        shakeIntensity = 3;
        
        // Play hum periodically
        if (Date.now() - shadowEntity.lastHum > 500) {
            playShadowHum();
            shadowEntity.lastHum = Date.now();
        }
    } else {
        shadowEntity.active = false;
    }
    
    if (shakeIntensity > 0) shakeIntensity *= 0.9;

    // Goal Pulse
    goal.pulse += 0.1;

    // Check Win
    let distToGoal = Math.hypot(player.x - goal.x, player.y - goal.y);
    if (distToGoal < goal.radius + player.radius) {
        gameActive = false;
        statusText.innerText = "STATUS: ESCAPED!";
        statusText.style.color = "#44ff44";
        
        if (score > highScore) {
            highScore = Math.floor(score);
            localStorage.setItem('echoing_corridor_high_score', highScore);
            highScoreText.innerText = `BEST: ${highScore}`;
        }
    }

    // Check Game Over
    let distToShadow = Math.hypot(player.x - shadowEntity.x, player.y - shadowEntity.y);
    if (shadowEntity.active && distToShadow < shadowEntity.radius + player.radius) {
        gameActive = false;
        statusText.innerText = "STATUS: CONSUMED BY SHADOW";
        statusText.style.color = "#ff4444";
        
        if (score > highScore) {
            highScore = Math.floor(score);
            localStorage.setItem('echoing_corridor_high_score', highScore);
            highScoreText.innerText = `BEST: ${highScore}`;
        }
    }
}

function draw() {
    ctx.save();
    
    // Screen Shake
    if (shakeIntensity > 0.1) {
        ctx.translate(Math.random() * shakeIntensity, Math.random() * shakeIntensity);
    }
    
    // Background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Draw Walls
    ctx.fillStyle = (Math.random() > 0.98) ? '#444' : '#333';
    for (let wall of walls) {
        ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    }
    
    // Draw Goal
    let pulseSize = goal.radius + Math.sin(goal.pulse) * 3;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(goal.x, goal.y, pulseSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#fff';
    
    // Draw Pings
    for (let p of pings) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.lineWidth = 2 + Math.sin(p.pulse) * 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // Reset shadow blur
    ctx.shadowBlur = 0;
    
    // Draw Particles
    for (let p of particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1.0;
    
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
        ctx.shadowBlur = 25;
        ctx.shadowColor = 'red';
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
    
    // Fog of War
    let fogGradient = ctx.createRadialGradient(player.x, player.y, 60, player.x, player.y, 250);
    fogGradient.addColorStop(0, 'rgba(0,0,0,0)');
    fogGradient.addColorStop(1, 'rgba(0,0,0,0.98)');
    ctx.fillStyle = fogGradient;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    ctx.restore();
    
    requestAnimationFrame(() => {
        update();
        draw();
    });
}

draw();