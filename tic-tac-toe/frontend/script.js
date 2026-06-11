const API = "http://localhost:5000";

const boardDiv = document.getElementById("board");
const statusDiv = document.getElementById("status");

async function loadGame() {

    const response =
        await fetch(`${API}/game`);

    const game = await response.json();

    render(game);
}

function render(game) {

    boardDiv.innerHTML = "";

    game.board.forEach((value,index)=>{

        const cell =
            document.createElement("div");

        cell.classList.add("cell");

        cell.innerText = value;

        cell.addEventListener(
            "click",
            ()=>makeMove(index)
        );

        boardDiv.appendChild(cell);
    });

    if(game.status === "ongoing") {
        statusDiv.innerText = "Your Turn";
    }
    else if(game.status === "win") {
        statusDiv.innerText = "You Won!";
    }
    else if(game.status === "lose") {
        statusDiv.innerText = "Computer Won!";
    }
    else {
        statusDiv.innerText = "Draw!";
    }
}

async function makeMove(index) {

    try{

        const response =
        await fetch(`${API}/move`,{
            method:"POST",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({
                index:index
            })
        });

        const game =
            await response.json();

        render(game);

    }
    catch(error){
        alert("Error updating game");
    }
}

document
.getElementById("resetBtn")
.addEventListener("click",async()=>{

    const response =
    await fetch(`${API}/reset`,{
        method:"POST"
    });

    const game =
    await response.json();

    render(game);
});

loadGame();