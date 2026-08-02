import {
    BOARD_SIZE,
    CELL_STATES
} from "../game-state.js";

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
        this.hasMadeFirstMove = false;
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
        const row = Number(cell.dataset.row);
        const col = Number(cell.dataset.col);

        if (!this.hasMadeFirstMove) {
            this.hasMadeFirstMove = true;
            this.onFirstMove();
        }

        this.gameState.cycleCell(row, col);

        this.renderCell(cell);
    }

    renderCell(cell) {
        const row = Number(cell.dataset.row);
        const col = Number(cell.dataset.col);
        const cellState = this.gameState.getCell(row, col);
        const symbol = STATE_SYMBOLS[cellState];

        cell.dataset.state = cellState ?? "empty"; 
        cell.textContent = symbol;

        const position = `row ${row + 1}, column ${col + 1}`;

        if (this.gameState.isLocked(row, col)) {
            cell.setAttribute(
                "aria-label",
                `${symbol}, fixed cell, ${position}`
            );        
        } else if (cellState === CELL_STATES.EMPTY) {
            cell.setAttribute(
                "aria-label",
                `empty cell, ${position}`
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
        this.hasMadeFirstMove = false;
        this.gameState.reset();
        this.render();
    }

}