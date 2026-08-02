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

function createShareText(time, hints) {
    const hintLabel =
        hints === 1 ? "hint" : "hints";

    return [
        "Pairadoxle",
        `Solved in ${time}`,
        `${hints} ${hintLabel} used`,
        window.location.href
    ].join("\n");
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

    const shareResultButton = document.querySelector("#share-result-button"); 
    const shareStatus = document.querySelector("#share-status"); 

    if (
        !boardElement ||
        !timerElement ||
        !resetButton ||
        !hintButton ||
        !solvedModal ||
        !solvedTime ||
        !solvedHints ||
        !closeModalButton ||
        !shareResultButton ||
        !shareStatus
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

            onHintUsed: () => {
                hintsUsed += 1;
            },

            onSolved: () => {
                timer.stop();

                solvedTime.textContent = timer.getFormattedTime();
                solvedHints.textContent = String(hintsUsed);
                shareStatus.textContent = "";

                if (!solvedModal.open) {
                    solvedModal.showModal();
                }
            }
        }
    );

    gameBoard.create();

    resetButton.addEventListener("click", () => {
        gameBoard.reset();
        timer.reset();
        hintsUsed = 0;
        shareStatus.textContent = "";

        if (solvedModal.open) {
            solvedModal.close(); 
        }
    });

    hintButton.addEventListener("click", () => {
        gameBoard.giveHint();
    });

    solvedModal.addEventListener("click", (event) => {
        if (event.target === solvedModal) {
            solvedModal.close();
        }
    });

    closeModalButton.addEventListener("click", () => {
        solvedModal.close();
    });

    shareResultButton.addEventListener("click", async () => {
        const shareText = createShareText(
            solvedTime.textContent,
            hintsUsed
        );

        try {
            await navigator.clipboard.writeText(shareText);

            const originalText =
                shareResultButton.textContent;

            shareResultButton.textContent = "Copied!";
            shareStatus.textContent =
                "Result copied to clipboard!";

            window.setTimeout(() => {
                shareResultButton.textContent =
                    originalText;
            }, 1800);
        } catch (error) {
            console.error("Could not copy result:", error);

            shareStatus.textContent =
                "Could not copy the result.";
        }
    });

    displayPuzzleDate();
}

initialiseGame();
