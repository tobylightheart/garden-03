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
// Currently, mirrors are sparse. Let's add some strategically.
// Actually, let's just rely on the ones placed in the level or add a few more.
// Since I'm building it now, I'll add a few more mirrors to ensure there are at least 5.
for (let i = 0; i < 10; i++) {
    let mx, my;
    do {
        mx = Math.floor(Math.random() * (level[0].length - 2)) + 1;
        my = Math.floor(Math.random() * (level.length - 2)) + 1;
    } while (level[my][mx] !== 0);
    level[my][mx] = 2;
    mirrors.push({ x: mx * GRID_SIZE, y: my * GRID_SIZE, angle: Math.random() * Math.PI * 2 });
}

function updateBeam() {
    if (gameOver) return;
    
    beam.reflections = 0;
    let currentX = beam.x;
    let currentY = beam.y;
    let currentAngle = beam.angle;
    
    // Max reflections to prevent infinite loops
    for (let i = 0; i < 20; i++) {
        let dx = Math.cos(currentAngle);
        let dy = Math.sin(currentAngle);
        
        let closestDist = Infinity;
        let hit = null;

        // Check walls
        for (const wall of walls) {
            // Basic ray-box intersection
            // ... simplified for this demo
            // We'll just check if it hits the grid cell
            const nextX = currentX + dx * 100; // look ahead
            const nextY = currentY + dy * 100;
            const gridX = Math.floor(nextX / GRID_SIZE);
            const gridY = Math.floor(nextY / GRID_SIZE);
            
            if (gridY >= 0 && gridY < level.length && gridX >= 0 && gridX < level[0].length) {
                if (level[gridY][gridX] === 1) {
                    // Find exact intersection with the wall (rectangle)
                    // For simplicity, we'll just assume it hits the cell and find distance
                    const dist = Math.sqrt((nextX - currentX)**2 + (nextY - currentY)**2);
                    if (dist < closestDist) {
                        closestDist = dist;
                        hit = { type: 'wall', x: nextX, y: nextY };
                    }
                }
            }
        }

        // Check mirrors
        for (const m of mirrors) {
            // Distance to mirror center
            const dist = Math.sqrt((m.x - currentX)**2 + (m.y - currentY)**2);
            if (dist < 20 && dist > 0) {
                // Check if the ray is hitting the mirror face
                // Mirror is a line segment
                // ... complex math. Let's simplify: if it's close, it reflects.
                // To make it better, we'll calculate the angle.
                // Actually, for a "creative" game, let's just do a simple reflection.
                // A mirror at angle theta reflects a ray at angle alpha to 2*theta - alpha
                // But we need to know which side it hit.
                
                // Let's skip precise ray-mirror intersection for now and use a simpler "hit"
                // But it needs to be playable.
            }
        }
        
        // Re-evaluating: A real "Prism Maze" needs real ray-mirror interaction.
        break; 
    }
}

// Simplified Beam Logic for the demo:
// We'll use a simple recursive reflection system.
function castRay(x, y, angle, depth) {
    if (depth > 15) return;
    
    let dx = Math.cos(angle);
    let dy = Math.sin(angle);
    
    let closestDist = Infinity;
    let hitObj = null;

    // Walls
    for (const wall of walls) {
        // Ray-AABB intersection
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
        // Mirror is a line segment from m.x,m.y to m.x + cos(angle)*len, m.y + sin(angle)*len
        // For simplicity, let's treat mirror as a point that reflects rays
        // and has a radius of 15
        const dist = Math.sqrt((m.x - x)**2 + (m.y - y)**2);
        if (dist < 20 && dist > 0) {
            // Check if hit
            // We'll just say if it's close enough and not a wall hit, it's a mirror hit
            // To make it feel like a mirror, we need the angle.
            // The mirror's normal is perpendicular to its angle.
            // Reflection: r = i - 2(i.n)n
            // Let's simplify: the mirror is at m.angle.
            // The reflection angle is 2 * m.angle - currentAngle.
            
            // But we need to make sure it's not just "hitting" it from behind.
            // Dot product of ray and mirror normal.
            const normalX = -Math.sin(m.angle);
            const normalY = Math.cos(m.angle);
            const dot = dx * normalX + dy * normalY;
            
            if (dot < 0) { // hitting the front
                closestDist = dist;
                hitObj = { type: 'mirror', x: m.x, y: m.y, angle: m.angle };
            }
        }
    }

    // Sanctum
    const distToSanctum = Math.sqrt((sanctum.x - x)**2 + (sanctum.y - y)**2);
    if (distToSanctum < sanctum.radius) {
        // Check if we have enough reflections
        if (beam.reflections >= 5) {
            gameOver = true;
            statusEl.innerText = "SUCCESS! You reached the Sanctum.";
            statusEl.style.color = "#00ff00";
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
        // "Illumination" effect
        // If beam is close, change color?
        // For now, let's just draw them.
    }

    // Draw Sanctum
    ctx.beginPath();
    ctx.arc(sanctum.x, sanctum.y, sanctum.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ff00ff';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff00ff';
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
        
        // Small circle at joint
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.restore();
    });

    // Draw Beam
    ctx.beginPath();
    ctx.moveTo(beam.x, beam.y);
    
    // We need to draw the beam path.
    // Let's re-calculate the path each frame.
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

        // Walls
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

        // Mirrors
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
draw();
