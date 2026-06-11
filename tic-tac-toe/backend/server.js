const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const FILE = "./data/game.json";

function readGame() {
    const data = fs.readFileSync(FILE, "utf8");
    return JSON.parse(data);
}

function saveGame(game) {
    fs.writeFileSync(FILE, JSON.stringify(game, null, 2));
}

function checkWinner(board) {
    const patterns = [
        [0,1,2],
        [3,4,5],
        [6,7,8],
        [0,3,6],
        [1,4,7],
        [2,5,8],
        [0,4,8],
        [2,4,6]
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

    for(let i=0;i<9;i++) {
        if(board[i] === "") {
            available.push(i);
        }
    }

    if(available.length === 0) return;

    const random =
        available[Math.floor(Math.random()*available.length)];

    board[random] = "O";
}

app.get("/game", (req,res)=>{
    res.json(readGame());
});

app.post("/move",(req,res)=>{

    const { index } = req.body;

    let game = readGame();

    if(game.board[index] !== "") {
        return res.status(400).json({
            error:"Cell occupied"
        });
    }

    if(game.status !== "ongoing") {
        return res.status(400).json({
            error:"Game over"
        });
    }

    game.board[index] = "X";

    let result = checkWinner(game.board);

    if(result === "X") {
        game.status = "win";
    }
    else if(result === "draw") {
        game.status = "draw";
    }
    else {

        computerMove(game.board);

        result = checkWinner(game.board);

        if(result === "O") {
            game.status = "lose";
        }
        else if(result === "draw") {
            game.status = "draw";
        }
    }

    saveGame(game);

    res.json(game);
});

app.post("/reset",(req,res)=>{

    const game = {
        board:["","","","","","","","",""],
        turn:"X",
        status:"ongoing"
    };

    saveGame(game);

    res.json(game);
});

app.listen(5000,()=>{
    console.log("Server running on port 5000");
});