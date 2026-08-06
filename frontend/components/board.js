import {
    BOARD_SIZE,
    CELL_STATES
} from "../game-constants.js";

import {
    findViolations,
    isBoardSolved
} from "../validator.js";

import { 
    findHint 
} from "../hint-engine.js";

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
        this.onHintUsed = options.onHintUsed ?? (() => {}); 
        this.onHintCooldownChange = options.onHintCooldownChange ?? (() => {}); 
        this.hintCooldownMilliseconds = 5000; 
        this.hintCooldownTimeoutId = null; 
        this.isHintOnCooldown = false; 
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

        this.renderRelations(); 
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
            isBoardSolved(board, this.gameState.getRelations())
        ) {
            this.hasBeenSolved = true;
            this.isLockedAfterSolve = true;
            this.cancelHintCooldown();
            this.lockBoard();
            this.onSolved();
        }
    }

    renderCell(cell) {
        const row = Number(cell.dataset.row);
        const col = Number(cell.dataset.col);
        const cellState = this.gameState.getCell(row, col);
        const symbol = STATE_SYMBOLS[cellState];

        cell.dataset.state =  cellState ?? "empty";
        cell.textContent = symbol;

        cell.disabled =
            this.gameState.isLocked(row, col) ||
            this.isLockedAfterSolve;

        const position = `row ${row + 1}, column ${col + 1}`;

        if (this.gameState.isLocked(row, col)) {
            cell.setAttribute(
                "aria-label",
                `${symbol}, fixed cell, ${position}`
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
        this.cancelScheduledViolationRender();
        this.cancelHintCooldown();

        this.hasMadeFirstMove = false;
        this.hasBeenSolved = false;
        this.isLockedAfterSolve = false;

        this.gameState.reset();
        this.render();
        this.renderViolations();

        this.onHintCooldownChange({
            active: false,
            remainingMilliseconds: 0
        });
    }

    renderViolations() {
        const violations = findViolations(
            this.gameState.getBoard(),
            this.gameState.getRelations()
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
        if ( this.hasBeenSolved || this.isLockedAfterSolve || this.isHintOnCooldown ) {
            return false;
        }

        const hint = findHint( 
            this.gameState.getBoard(), 
            this.gameState.getSolution(),
            this.gameState.getRelations()
        );

        if (!hint) {
            return false;
        }

        if (!this.hasMadeFirstMove) {
            this.hasMadeFirstMove = true;
            this.onFirstMove();
        }

        const applied = this.gameState.applyHint( hint.row, hint.col, hint.value );

        if (!applied) {
            return false;
        }

        const cell = this.getCellElement( hint.row, hint.col );

        if (cell) {
            this.renderCell(cell);
            cell.focus();
        }

        this.cancelScheduledViolationRender();
        this.renderViolations();

        this.onHintUsed(hint);
        this.startHintCooldown();

        const board = this.gameState.getBoard();

        if ( !this.hasBeenSolved && isBoardSolved(board) ) {
            this.hasBeenSolved = true;
            this.isLockedAfterSolve = true;

            this.cancelHintCooldown();
            this.lockBoard();
            this.onSolved();
        }

        return true;
    }

    startHintCooldown() {
        this.cancelHintCooldown();

        this.isHintOnCooldown = true;

        const cooldownEndsAt =
            Date.now() + this.hintCooldownMilliseconds;

        const updateCooldown = () => {
            const remainingMilliseconds =
                Math.max(0, cooldownEndsAt - Date.now());

            this.onHintCooldownChange({
                active: remainingMilliseconds > 0,
                remainingMilliseconds
            });

            if (remainingMilliseconds <= 0) {
                this.isHintOnCooldown = false;
                this.hintCooldownTimeoutId = null;
                return;
            }

            this.hintCooldownTimeoutId =
                window.setTimeout(updateCooldown, 200);
        };

        updateCooldown();
    }

    cancelHintCooldown() {
        if (this.hintCooldownTimeoutId !== null) {
            window.clearTimeout(
                this.hintCooldownTimeoutId
            );

            this.hintCooldownTimeoutId = null;
        }

        this.isHintOnCooldown = false;
    }

    renderRelations() {
        const relations = this.gameState.getRelations();
        const cellSizePercent = 100 / BOARD_SIZE;

        relations.forEach((relation) => {
            const marker = document.createElement("span");

            marker.classList.add(
                "relation-marker",
                relation.type === "same"
                    ? "relation-marker--same"
                    : "relation-marker--different"
            );

            marker.setAttribute("aria-hidden", "true");

            if (relation.direction === "horizontal") {
                marker.style.left =
                    `${(relation.col + 1) * cellSizePercent}%`;

                marker.style.top =
                    `${(relation.row + 0.5) * cellSizePercent}%`;
            } else {
                marker.style.left =
                    `${(relation.col + 0.5) * cellSizePercent}%`;

                marker.style.top =
                    `${(relation.row + 1) * cellSizePercent}%`;
            }

            this.boardElement.appendChild(marker);
        });
    }
}