import {
    BOARD_SIZE,
    CELL_STATES
} from "../game-state.js";

import {
    findViolations,
    isBoardSolved
} from "../validator.js";

const STATE_SYMBOLS = {
    [CELL_STATES.EMPTY]: '',
    [CELL_STATES.X]: 'X',
    [CELL_STATES.Y]: 'Y'
};

export class GameBoard {
    constructor(boardElement, gameState, options = {}) {
        if (!(boardElement instanceof HTMLElement)) {
            throw new Error("GameBoard requires a valid HTML element.");
        }

        this.boardElement = boardElement;
        this.gameState = gameState;
        this.onFirstMove = options.onFirstMove ?? (() => {});
        this.onSolved = options.onSolved ?? (() => {}); 
        this.onHintUsed = options.onHintUSed ?? (() => {}); 
        this.hasMadeFirstMove = false;
        this.hasBeenSolved = false; 
        this.isLockedAfterSolve = false; 
        this.violationTimeoutId = null; 
    }

    create() {
        this.boardElement.replaceChildren();

        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const cell = this.createCell(row, col);
                this.boardElement.appendChild(cell);
            }
        }
    }

    createCell(row, col) {
        const cell = document.createElement("button"); 

        cell.type = "button"; 
        cell.classList.add("cell");

        cell.dataset.row = row;
        cell.dataset.col = col;

        cell.setAttribute("role", "gridcell");

        if (this.gameState.isLocked(row, col)) {
            cell.classList.add("cell--locked");
            cell.disabled = true;
        }

        cell.addEventListener("click", () => {
            this.handleCellClick(cell);
        }); 

        this.renderCell(cell);

        return cell;
    }

    handleCellClick(cell) {
        if (this.isLockedAfterSolve) {
            return; 
        }

        const row = Number(cell.dataset.row);
        const col = Number(cell.dataset.col);

        if (!this.hasMadeFirstMove) {
            this.hasMadeFirstMove = true;
            this.onFirstMove();
        }

        const previousState =
            this.gameState.getCell(row, col);

        this.gameState.cycleCell(row, col);
        this.renderCell(cell);

        if (previousState === CELL_STATES.EMPTY) {
            this.scheduleViolationRender(450);
        } else {
            this.cancelScheduledViolationRender();
            this.renderViolations();
        }

        const board = this.gameState.getBoard(); 

        if (
            !this.hasBeenSolved && 
            isBoardSolved(board)
        ) {
            this.hasBeenSolved = true; 
            this.isLockedAfterSolve = true; 
            this.lockBoard(); 
            this.onSolved(); 
        }
    }

    renderCell(cell) {
        const row = Number(cell.dataset.row);
        const col = Number(cell.dataset.col);
        const cellState = this.gameState.getCell(row, col);
        const symbol = STATE_SYMBOLS[cellState];
        const isHinted = this.gameState.isHinted(row, col);

        cell.dataset.state =  cellState ?? "empty";
        cell.textContent = symbol;
        cell.classList.toggle("cell--hinted", isHinted);

        cell.disabled =
            this.gameState.isLocked(row, col) ||
            isHinted ||
            this.isLockedAfterSolve;

        const position = `row ${row + 1}, column ${col + 1}`;

        if (this.gameState.isLocked(row, col)) {
            cell.setAttribute(
                "aria-label",
                `${symbol}, fixed cell, ${position}`
            );
        } else if (isHinted) {
            cell.setAttribute(
                "aria-label",
                `${symbol}, hinted cell, ${position}`
            );
        } else if (cellState === CELL_STATES.EMPTY) {
            cell.setAttribute(
                "aria-label",
                `Empty cell, ${position}`
            );
        } else {
            cell.setAttribute(
                "aria-label",
                `${symbol}, ${position}`
            );
        }
    }

    render() {
        const cells = this.boardElement.querySelectorAll(".cell");

        cells.forEach((cell) => {
            this.renderCell(cell);
        });
    }

    reset() {
        if (this.violationTimeoutId !== null) {
            window.clearTimeout(this.violationTimeoutId);
            this.violationTimeoutId = null;
        }

        this.hasMadeFirstMove = false;
        this.hasBeenSolved = false;
        this.isLockedAfterSolve = false;

        this.gameState.reset();
        this.render();

        const cells = this.boardElement.querySelectorAll(".cell");

        cells.forEach(cell  => {
            const row = Number(cell.dataset.row);
            const col = Number(cell.dataset.col);

            cell.classList.remove(
                "cell--solved",
                "cell--invalid"
            );

            cell.disabled = this.gameState.isLocked(row, col);
        });

        this.renderViolations();
    }

    renderViolations() {
        const violations = findViolations(
            this.gameState.getBoard()
        );

        const cells = this.boardElement.querySelectorAll(".cell");

        cells.forEach((cell) => {
            const row = Number(cell.dataset.row);
            const col = Number(cell.dataset.col);
            const key = `${row},${col}`;

            cell.classList.toggle(
                "cell--invalid",
                violations.has(key)
            );
        });
    }

    scheduleViolationRender(delay = 400) {
        if (this.violationTimeoutId !== null) {
            window.clearTimeout(this.violationTimeoutId);
        }

        this.violationTimeoutId = window.setTimeout( () => {
            this.renderViolations(); 
            this.violationTimeoutId = null; 
        }, delay); 
    }

    cancelScheduledViolationRender() {
        if (this.violationTimeoutId !== null) {
            window.clearTimeout(this.violationTimeoutId);
            this.violationTimeoutId = null;
        }
    }

    lockBoard() {
        const cells =
            this.boardElement.querySelectorAll(".cell");

        cells.forEach((cell) => {
            cell.disabled = true;
            cell.classList.add("cell--solved");
        });
    }

    getCellElement(row, col) {
        return this.boardElement.querySelector(
            `.cell[data-row="${row}"][data-col="${col}"]`
        );
    }

    giveHint() {
        if (this.hasBeenSolved || this.isLockedAfterSolve) {
            return false;
        }

        const candidates = this.gameState.getHintCandidates();

        if (candidates.length === 0) {
            return false;
        }

        const randomIndex = Math.floor(Math.random() * candidates.length);

        const { row, col } =  candidates[randomIndex];

        if (!this.hasMadeFirstMove) {
            this.hasMadeFirstMove = true;
            this.onFirstMove();
        }

        const applied = this.gameState.applyHint(row, col);

        if (!applied) {
            return false;
        }

        const cell = this.getCellElement(row, col);

        if (cell) {
            cell.classList.add("cell--hinted");
            cell.disabled = true;
            this.renderCell(cell);
        }

        this.cancelScheduledViolationRender();
        this.renderViolations();

        this.onHintUsed({ row, col });

        const board = this.gameState.getBoard();

        if ( !this.hasBeenSolved && isBoardSolved(board) ) {
            this.hasBeenSolved = true;
            this.isLockedAfterSolve = true;
            this.lockBoard();
            this.onSolved();
        }

        return true;
    }
}