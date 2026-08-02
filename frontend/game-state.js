export const BOARD_SIZE = 6;
export const CELL_STATES = {
    EMPTY: null, 
    X: "x",
    Y: "y"
}

/*
 * Temporary puzzle used while building the interface.
 *
 * null means the player can edit the cell.
 * "x" or "y" means the cell starts with that value.
 */
const startingPuzzle = [
    ["y",  null, null, null, null, "y" ],
    [null, null, null, null, null, null],
    [null, null, null, null, null, null],
    [null, null, null, null, null, null],
    [null, null, null, null, null, null],
    ["y",  null, null, null, null, "x" ]
];

function copyBoard(board) {
    return board.map((row) => [...row]);
}

function createLockedCells(puzzle) {
    return puzzle.map((row) =>
        row.map((value) => value !== CELL_STATES.EMPTY)
    );
}

export class GameState {
    constructor(puzzle = startingPuzzle) {
        this.startingBoard = copyBoard(puzzle);
        this.board = copyBoard(puzzle);
        this.lockedCells = createLockedCells(puzzle);
    }

    getCell(row, col) {
        return this.board[row][col];
    }
    
    getBoard() {
        return copyBoard(this.board);
    }
    
    reset() {
        this.board = copyBoard(this.startingBoard);
    }

    isLocked(row, col) {
        return this.lockedCells[row][col];
    }

    cycleCell(row, column) {
        if (this.isLocked(row, column)) {
            return this.getCell(row, column);
        }

        const currentState = this.board[row][column];

        let nextState;

        if (currentState === null) {
            nextState = "x";
        } else if (currentState === "x") {
            nextState = "y";
        } else {
            nextState = null;
        }

        this.board[row][column] = nextState;

        return nextState;
    }
}