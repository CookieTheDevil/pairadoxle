import { GameState } from "./game-state.js";
import { GameTimer } from "./timer.js";
import { GameBoard } from "./components/board.js";
import { Leaderboard } from "./components/leaderboard.js";
import { submitScore } from "./leaderboard-api.js";
import { solveLogically } from "./logic-solver.js";
import { calculateDifficulty } from "./difficulty.js";
import {
    saveProgress,
    loadProgress,
    clearProgress,
    getDeviceId
} from "./storage.js";
import {
    getDailyPuzzleId,
    formatPuzzleDate
} from "./daily-puzzle.js";
import { generatePuzzle } from "./generator.js";

function formatDifficulty(level) {
    return ( level.charAt(0).toUpperCase() + level.slice(1));
}

function getPuzzleDifficulty(puzzle) {
    if (puzzle.difficulty) {
        return puzzle.difficulty;
    }

    const result = solveLogically(
        puzzle.startingBoard,
        puzzle.relations
    );

    return calculateDifficulty(result);
}

function displayPuzzleDate(puzzleId) {
    const dateElement = document.querySelector("#date");

    if (!dateElement) {
        return;
    }

    dateElement.textContent = formatPuzzleDate(puzzleId);
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
    const difficultyMessage = document.querySelector( "#difficulty-message" );
    const boardElement = document.querySelector("#game-board");
    const hintButton = document.querySelector("#hint-button");
    const resetButton = document.querySelector("#reset-button");
    const hintMessage = document.querySelector("#hint-message");

    let hintMessageTimeoutId = null;
    let hintsUsed = 0;
    let scoreSubmissionId = null;
    let scoreSubmitted = false; 

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
        !difficultyMessage ||
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

    const puzzleId = getDailyPuzzleId();
    const currentPuzzle = generatePuzzle(puzzleId);
    const gameState = new GameState(currentPuzzle);
    const timer = new GameTimer(timerElement); 

    const deviceId = getDeviceId();

    const difficulty = getPuzzleDifficulty(currentPuzzle);
    difficultyMessage.textContent = formatDifficulty(difficulty.level);
    difficultyMessage.hidden = false;

    const leaderboard = new Leaderboard({
        tableBody: document.querySelector("#leaderboard-table tbody"),
        statusElement: document.querySelector("#leaderboard-status"),
        puzzleId: currentPuzzle.id
    });

    leaderboard.load();

    const playerNameInput = document.querySelector("#player-name");
    const submitScoreButton = document.querySelector("#submit-score-button");
    const scoreSubmitStatus = document.querySelector("#score-submit-status");

    async function handleScoreSubmit() {
        const playerName = playerNameInput.value.trim();

        if (!playerName) {
            showScoreStatus("Enter a name first.");
            return;
        }

        submitScoreButton.disabled = true;
        showScoreStatus("Submitting...");

        try {
            await submitScore({
                puzzleId: currentPuzzle.id,
                playerName,
                timeMs: timer.getElapsedMilliseconds(),
                hintsUsed,
                submissionId: scoreSubmissionId,
                deviceId
            });

            scoreSubmitted = true;
            saveCurrentProgress();

            showScoreStatus("Score submitted!");

            playerNameInput.disabled = true;
            submitScoreButton.disabled = true;

            await leaderboard.load();
        } catch (error) {
            console.error(
                "Could not submit score:",
                error
            );
            showScoreStatus(error.message);
            submitScoreButton.disabled = false;
        }
    }

    function showScoreStatus(message) {
        scoreSubmitStatus.textContent = message;
    }

    function showSolvedModal() {
        solvedTime.textContent = timer.getFormattedTime();
        solvedHints.textContent = String(hintsUsed);
        shareStatus.textContent = "";

        if (scoreSubmitted) {
            playerNameInput.disabled = true;
            submitScoreButton.disabled = true;

            showScoreStatus("Your score has already been submitted.");
        } else {
            playerNameInput.disabled = false;
            submitScoreButton.disabled = false;

            showScoreStatus("");
        }

        if (!solvedModal.open) {
            solvedModal.showModal();
        }
    }

    const gameBoard = new GameBoard(
        boardElement,
        gameState,
        {
            onBoardChange: () => {
                saveCurrentProgress();
            },

            onSolved: () => {
                timer.stop();

                if (!scoreSubmissionId) {
                    scoreSubmissionId = crypto.randomUUID();
                }

                resetButton.disabled = true;
                hintButton.disabled = true;

                saveCurrentProgress();

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
                if (gameBoard.hasBeenSolved) {
                    hintButton.disabled = true;
                    hintButton.textContent = "Hint";
                    return;
                }

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

    function restoreSavedProgress() {
        const saved = loadProgress();

        if (!saved) {
            return;
        }

        if ( saved.puzzleId !== gameState.getPuzzleId() ) {
            clearProgress();
            return;
        }

        const boardWasRestored = gameState.setBoard(saved.board);

        if (!boardWasRestored) {
            clearProgress();
            return;
        }

        if (
            Number.isFinite(saved.elapsedMilliseconds) &&
            saved.elapsedMilliseconds >= 0
        ) {
            timer.setElapsedMilliseconds(
                saved.elapsedMilliseconds
            );
        }

        if (
            Number.isInteger(saved.hintsUsed) &&
            saved.hintsUsed >= 0
        ) {
            hintsUsed = saved.hintsUsed;
        }

        scoreSubmissionId = typeof saved.scoreSubmissionId === "string" ? saved.scoreSubmissionId : null; 
        scoreSubmitted = saved.scoreSubmitted === true; 

        gameBoard.render();
        gameBoard.renderViolations();

        if (saved.hasStarted) {
            gameBoard.setHasProgress(true);
        }

        if (saved.solved) {
            gameBoard.hasBeenSolved = true;
            gameBoard.isLockedAfterSolve = true;

            gameBoard.lockBoard();

            hintButton.disabled = true;
            resetButton.disabled = true;

            if (!scoreSubmissionId) {
                scoreSubmissionId = crypto.randomUUID();
                saveCurrentProgress();
            }

            showSolvedModal();

            return;
        }
    }

    window.setInterval(() => {
        if (!gameBoard.hasBeenSolved) {
            saveCurrentProgress();
        }
    }, 5000);

    window.addEventListener("beforeunload", () => {
        if (!gameBoard.hasBeenSolved) {
            saveCurrentProgress();
        }
    });

    function saveCurrentProgress() {
        saveProgress({
            puzzleId: gameState.getPuzzleId(),
            board: gameState.getBoard(),

            elapsedMilliseconds: timer.getElapsedMilliseconds(),

            hintsUsed,
            solved: gameBoard.hasBeenSolved,
            hasStarted: gameBoard.hasMadeFirstMove,

            scoreSubmissionId,
            scoreSubmitted
        });
    }

    resetButton.addEventListener("click", () => {
        if (gameBoard.hasBeenSolved) {
            return;
        }

        gameBoard.reset();

        shareStatus.textContent = "";

        if (hintMessageTimeoutId !== null) {
            window.clearTimeout(hintMessageTimeoutId);
            hintMessageTimeoutId = null;
        }

        hintMessage.classList.remove("hint-message--visible");
        hintMessage.textContent = "";

        saveCurrentProgress();
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

    submitScoreButton.addEventListener("click", handleScoreSubmit);

    playerNameInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            handleScoreSubmit();
        }
    });

    gameBoard.create();
    restoreSavedProgress(); 
    displayPuzzleDate(currentPuzzle.id);

    if (!gameBoard.hasBeenSolved) {
        timer.start(); 
        saveCurrentProgress(); 
    }
}

initialiseGame();
