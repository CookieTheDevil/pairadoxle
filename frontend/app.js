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

    let hintsUsed = 0; 
    const solvedModal = document.querySelector("#solved-modal"); 
    const solvedTime = document.querySelector("#solved-time"); 
    const solvedHints = document.querySelector("#solved-hints"); 
    const closeModalButton = document.querySelector("#close-modal-button"); 

    if (
        !boardElement ||
        !timerElement ||
        !resetButton ||
        !hintButton ||
        !solvedModal ||
        !solvedTime ||
        !solvedHints ||
        !closeModalButton
    ) {
        throw new Error(
            "One or more required game elements are missing."
        );
    }

    const gameState = new GameState();
    const timer = new GameTimer(timerElement);

    const gameBoard = new GameBoard(
        boardElement,
        gameState,
        {
            onFirstMove: () => {
                timer.start();
            },

            onSolved: () => {
                timer.stop();

                solvedTime.textContent = timer.getFormattedTime();
                solvedHints.textContent = String(hintsUsed);
                solvedModal.showModal();
            }
        }
    );

    gameBoard.create();

    resetButton.addEventListener("click", () => {
        gameBoard.reset();
        timer.reset();
        
        hintsUsed = 0; 

        if (solvedModal.open) {
            solvedModal.close(); 
        }
    });

    hintButton.addEventListener("click", () => {
        hintsUsed += 1; 

        console.log(`Hints used: ${hintsUsed}`); 
    });

    solvedModal.addEventListener("click", (event) => {
        if (event.target === solvedModal) {
            solvedModal.close();
        }
    });

    closeModalButton.addEventListener("click", () => {
        solvedModal.close();
    });

    displayPuzzleDate();
}

initialiseGame();
