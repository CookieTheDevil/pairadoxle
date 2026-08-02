import { GameState } from "./game-state.js";
import { GameTimer } from "./timer.js";
import { GameBoard } from "./components/board.js";

function displayPuzzleDate() {
    const dateElement = document.querySelector("#date"); 

    if (!dateElement) {
        return; 
    }

    const today = new Date();

    dateElement.textContent = new Intl.DateTimeFormat("nb-NO", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    }).format(today);
}

function initialiseGame() {
    const timerElement = document.querySelector("#timer");
    const boardElement = document.querySelector("#game-board");
    const hintButton = document.querySelector("#hint-button");
    const resetButton = document.querySelector("#reset-button");

    if (!boardElement || !timerElement || !resetButton || !hintButton) {
        throw new Error("One or more required game elements are missing.");
    }

    const gameState = new GameState();
    const timer = new GameTimer(timerElement);

    const gameBoard = new GameBoard(boardElement, gameState, {
        onFirstMove: () => {
            timer.start();
        }
    });

    gameBoard.create();

    resetButton.addEventListener("click", () => {
        gameBoard.reset();
        timer.reset();
    });

    hintButton.addEventListener("click", () => {
        console.log("Hint functionality will be added later.");
    });

    displayPuzzleDate();
}

initialiseGame();