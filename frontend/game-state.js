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
const puzzle = {
    id: "test-puzzle-1",

    startingBoard: [
        ["y",  null, null, null, null, "y"],
        [null, null, null, null, null, null],
        [null, null, null, null, null, null],
        [null, null, null, null, null, null],
        [null, null, null, null, null, null],
        ["y",  null, null, null, null, "x"]
    ],

    solution: [
        ["y", "x", "y", "x", "x", "y"],
        ["x", "y", "x", "y", "y", "x"],
        ["x", "y", "y", "x", "x", "y"],
        ["y", "x", "x", "y", "x", "y"],
        ["x", "y", "x", "y", "y", "x"],
        ["y", "x", "y", "x", "y", "x"]
    ],

    // Marked at the lower number, either by row or col
    relations: [
        {
            row: 0,
            col: 3,
            direction: "horizontal",
            type: "same"
        },
        {
            row: 2,
            col: 1,
            direction: "vertical",
            type: "different"
        }
    ]
};

function copyBoard(board) {
    return board.map((row) => [...row]);
}

function createLockedCells(puzzle) {
    return puzzle.map((row) =>
        row.map((value) => value !== CELL_STATES.EMPTY)
    );
}

export class GameState {
    constructor(currentPuzzle = puzzle) {
        this.puzzle = currentPuzzle; 

        this.startingBoard = copyBoard(currentPuzzle.startingBoard);
        this.board = copyBoard(currentPuzzle.startingBoard);
        this.solution = copyBoard(currentPuzzle.solution); 
        this.lockedCells = createLockedCells(currentPuzzle.startingBoard);

        this.hintedCells = new Set(); 
    }

    getCell(row, col) {
        return this.board[row][col];
    }

    getSolutionCell(row, col) {
        return this.solution[row][col]; 
    }

    getSolution() {
        return copyBoard(this.solution);
    }
    
    getBoard() {
        return copyBoard(this.board);
    }

    getRelations() {
        return this.puzzle.relations.map((relation) => ({
            ...relation
        }));
    }
    
    reset() {
        this.board = copyBoard(this.startingBoard);
    }

    isLocked(row, col) {
        return this.lockedCells[row][col];
    }

    cycleCell(row, col) {
        if (this.isLocked(row, col)) {
            return this.getCell(row, col);
        }

        const currentState = this.board[row][col];

        let nextState;

        if (currentState === CELL_STATES.EMPTY) {
            nextState = CELL_STATES.X;
        } else if (currentState === CELL_STATES.X) {
            nextState = CELL_STATES.Y;
        } else {
            nextState = CELL_STATES.EMPTY;
        }

        this.board[row][col] = nextState;

        return nextState;
    }

    applyHint(row, col, value) {
        if (this.isLocked(row, col)) {
            return false;
        }

        this.board[row][col] = value;

        return true;
    }

    getHintCandidates() {
        const candidates = [];

        for (let row = 0; row < BOARD_SIZE; row += 1) {
            for (let col = 0; col < BOARD_SIZE; col += 1) {
                const current = this.board[row][col];
                const correct = this.solution[row][col];

                if (
                    !this.isLocked(row, col) &&
                    !this.isHinted(row, col) &&
                    current !== correct
                ) {
                    candidates.push({ row, col });
                }
            }
        }

        return candidates;
    }
}