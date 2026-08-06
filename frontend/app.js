import { GameState } from "./game-state.js";
import { GameTimer } from "./timer.js";
import { GameBoard } from "./components/board.js";
import {
    testPuzzles
} from "./puzzles/test-puzzles.js";

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
    const hintMessage = document.querySelector("#hint-message");

    let hintMessageTimeoutId = null;
    let hintsUsed = 0;

    function showHintMessage(message) {
        if (hintMessageTimeoutId !== null) {
            window.clearTimeout(hintMessageTimeoutId);
        }

        hintMessage.textContent = message;
        hintMessage.classList.add("hint-message--visible");

        hintMessageTimeoutId = window.setTimeout(() => {
            hintMessage.classList.remove("hint-message--visible");
            hintMessageTimeoutId = null;
        }, 3500);
    }

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
        !hintMessage ||
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

    const gameState = new GameState(testPuzzles.standard);              //change testPuzzles.<XXX> for testing
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
                shareStatus.textContent = "";
                
                if (!solvedModal.open) {
                    solvedModal.showModal();
                }
            }, 

            onHintUsed: (hint) => {
                hintsUsed += 1;
                showHintMessage(hint.reason);
            },

            onHintCooldownChange: ({
                active,
                remainingMilliseconds
            }) => {
                hintButton.disabled = active;

                if (!active) {
                    hintButton.textContent = "Hint";
                    return;
                }

                const remainingSeconds = Math.ceil(
                    remainingMilliseconds / 1000
                );

                hintButton.textContent =
                    `Hint (${remainingSeconds})`;
            }
        }
    );

    gameBoard.create();

    resetButton.addEventListener("click", () => {
        gameBoard.reset();
        timer.reset();
        hintsUsed = 0;
        shareStatus.textContent = "";

        if (hintMessageTimeoutId !== null) {
            window.clearTimeout(hintMessageTimeoutId);
            hintMessageTimeoutId = null;
        }

        hintMessage.classList.remove("hint-message--visible");
        hintMessage.textContent = "";

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
