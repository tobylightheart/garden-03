const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const container = document.getElementById('game-container');

const GRID_SIZE = 6;
const CELL_SIZE = 100;
const OFFSET_X = 50;
const OFFSET_Y = 50;

const DIRS = [
    { x: 0, y: -1 }, // 0: North
    { x: 1, y: 0 },  // 1: East
    { x: 0, y: 1 },  // 2: South
    { x: -1, y: 0 }  // 3: West
];

class Room {
    constructor(x, y, id) {
        this.x = x;
        this.y = y;
        this.id = id;
        // Connectivity: [N, E, S, W]
        this.connections = [false, false, false, false]; 
        this.isFoldable = Math.random() > 0.4;
        this.isStable = Math.random() > 0.85;
        this.isExit = (x === 2 && y === 2);
        this.foldState = 0;
        
        // Initialize with some random connections
        this.connections = [Math.random() > 0.5, Math.random() > 0.5, Math.random() > 0.5, Math.random() > 0.5];
    }

    fold() {
        if (!this.isFoldable || this.isStable) return;
        this.foldState = (this.foldState + 1) % 4;
        const conn = this.connections;
        this.connections = [conn[3], conn[0], conn[1], conn[2]];
    }

    getAvailableMoves() {
        const moves = [];
        for (let i = 0; i < 4; i++) {
            if (this.connections[i]) {
                const nx = this.x + DIRS[i].x;
                const ny = this.y + DIRS[i].y;
                if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
                    moves.push(i);
                }
            }
        }
        return moves;
    }
}

const rooms = [];
for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
        rooms.push(new Room(x, y, `r-${x}-${y}`));
    }
}

// Procedural generation to ensure some paths
rooms.forEach(r => {
    // Ensure at least one connection for most rooms
    if (r.connections.every(c => !c)) {
        r.connections[Math.floor(Math.random() * 4)] = true;
    }
});

// Fix start/exit and guarantee at least one fair route.
const startRoom = rooms.find(r => r.x === 0 && r.y === 0);
const exitRoom = rooms.find(r => r.x === 2 && r.y === 2);

function roomAt(x, y) {
    return rooms.find(room => room.x === x && room.y === y);
}

function connectRooms(a, dir) {
    const b = roomAt(a.x + DIRS[dir].x, a.y + DIRS[dir].y);
    if (!b) return;
    a.connections[dir] = true;
    b.connections[(dir + 2) % 4] = true;
}

connectRooms(startRoom, 1);      // (0,0) -> (1,0)
connectRooms(roomAt(1, 0), 1);   // (1,0) -> (2,0)
connectRooms(roomAt(2, 0), 2);   // (2,0) -> (2,1)
connectRooms(roomAt(2, 1), 2);   // (2,1) -> exit
exitRoom.isExit = true;
exitRoom.isStable = true;

let currentRoom = startRoom;
let won = false;
let player = { x: 0, y: 0 };

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    rooms.forEach(r => {
        const rx = r.x * CELL_SIZE + OFFSET_X;
        const ry = r.y * CELL_SIZE + OFFSET_Y;

        // Draw Room Border
        ctx.strokeStyle = (r === currentRoom) ? '#00ffcc' : '#333';
        ctx.lineWidth = (r === currentRoom) ? 3 : 1;
        ctx.strokeRect(rx, ry, CELL_SIZE, CELL_SIZE);

        // Draw Connections
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        r.connections.forEach((open, i) => {
            if (open) {
                ctx.beginPath();
                ctx.moveTo(rx + CELL_SIZE / 2, ry + CELL_SIZE / 2);
                ctx.lineTo(
                    rx + CELL_SIZE / 2 + DIRS[i].x * CELL_SIZE / 2,
                    ry + CELL_SIZE / 2 + DIRS[i].y * CELL_SIZE / 2
                );
                ctx.stroke();
            }
        });

        if (r.isExit) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.15)';
            ctx.fillRect(rx, ry, CELL_SIZE, CELL_SIZE);
            ctx.fillStyle = '#ff4444';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText("EXIT", rx + CELL_SIZE / 2, ry + CELL_SIZE / 2 + 5);
        }
    });

    // Draw Player
    const px = currentRoom.x * CELL_SIZE + OFFSET_X + CELL_SIZE / 2;
    const py = currentRoom.y * CELL_SIZE + OFFSET_Y + CELL_SIZE / 2;
    ctx.fillStyle = '#00ffcc';
    ctx.beginPath();
    ctx.arc(px, py, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00ffcc';
    ctx.stroke();
    ctx.shadowBlur = 0;

    // UI Update
    const foldable = currentRoom.isFoldable ? "Yes" : "No";
    const stable = currentRoom.isStable ? "Yes" : "No";
    statusEl.innerText = won ? 'Fold complete. The exit holds steady.' : `Room: ${currentRoom.x}, ${currentRoom.y} | Foldable: ${foldable} | Stable: ${stable}`;
}

window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    
    if (won) return;
    if (key === 'f') {
        currentRoom.fold();
        container.classList.remove('fold-anim');
        void container.offsetWidth; 
        container.classList.add('fold-anim');
        draw();
    } else if (key === 'r') {
        currentRoom = startRoom;
        draw();
    } else {
        let moveDir = -1;
        if (key === 'w') moveDir = 0;
        else if (key === 'd') moveDir = 1;
        else if (key === 's') moveDir = 2;
        else if (key === 'a') moveDir = 3;

        if (moveDir !== -1) {
            const available = currentRoom.getAvailableMoves();
            if (available.includes(moveDir)) {
                const nx = currentRoom.x + DIRS[moveDir].x;
                const ny = currentRoom.y + DIRS[moveDir].y;
                const nextRoom = rooms.find(r => r.x === nx && r.y === ny);
                if (nextRoom) {
                    currentRoom = nextRoom;
                    if (currentRoom.isExit) {
                        won = true;
                        statusEl.style.color = '#44ff44';
                    }
                    draw();
                }
            }
        }
    }
});

draw();
