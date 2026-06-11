const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// 1. Serve static files first
app.use(express.static(path.join(__dirname, '../frontend')));

// 2. Setup Persistence File Tracking
const DATA_DIR = path.join(__dirname, "data");
const FILE = path.join(DATA_DIR, "game.json");

// Helper function to ensure data directory and file exist safely
function initializeFile() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(FILE)) {
        const initialGame = {
            board: ["","","","","","","","",""],
            turn: "X",
            status: "ongoing"
        };
        fs.writeFileSync(FILE, JSON.stringify(initialGame, null, 2));
    }
}

function readGame() {
    initializeFile(); // Prevent crash if file is missing
    const data = fs.readFileSync(FILE, "utf8");
    return JSON.parse(data);
}

function saveGame(game) {
    initializeFile();
    fs.writeFileSync(FILE, JSON.stringify(game, null, 2));
}

function checkWinner(board) {
    const patterns = [
        [0,1,2], [3,4,5], [6,7,8], // Rows
        [0,3,6], [1,4,7], [2,5,8], // Columns
        [0,4,8], [2,4,6]           // Diagonals
    ];

    for(let p of patterns) {
        const [a,b,c] = p;
        if(
            board[a] &&
            board[a] === board[b] &&
            board[b] === board[c]
        ) {
            return board[a];
        }
    }

    if(!board.includes("")) {
        return "draw";
    }

    return null;
}

function computerMove(board) {
    const available = [];
    for(let i=0; i<9; i++) {
        if(board[i] === "") {
            available.push(i);
        }
    }

    if(available.length === 0) return;

    const random = available[Math.floor(Math.random() * available.length)];
    board[random] = "O";
}

// 3. API endpoints placed ABOVE the catch-all wildcard route
app.get("/game", (req, res) => {
    try {
        res.json(readGame());
    } catch (err) {
        res.status(500).json({ error: "Failed to read game state" });
    }
});

app.post("/move", (req, res) => {
    try {
        const { index } = req.body;
        let game = readGame();

        if(game.board[index] !== "") {
            return res.status(400).json({ error: "Cell occupied" });
        }

        if(game.status !== "ongoing") {
            return res.status(400).json({ error: "Game over" });
        }

        game.board[index] = "X";
        let result = checkWinner(game.board);

        if(result === "X") {
            game.status = "win";
        } else if(result === "draw") {
            game.status = "draw";
        } else {
            computerMove(game.board);
            result = checkWinner(game.board);

            if(result === "O") {
                game.status = "lose";
            } else if(result === "draw") {
                game.status = "draw";
            }
        }

        saveGame(game);
        res.json(game);
    } catch (error) {
        res.status(500).json({ error: "Internal server state error" });
    }
});

app.post("/reset", (req, res) => {
    try {
        const game = {
            board: ["","","","","","","","",""],
            turn: "X",
            status: "ongoing"
        };
        saveGame(game);
        res.json(game);
    } catch (err) {
        res.status(500).json({ error: "Failed to reset game state" });
    }
});

// 4. Wildcard / Catch-all route placed at the bottom
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// 5. Start the server using the dynamic environmental variable path
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});