import {
    BOARD_SIZE,
    CELL_STATES
} from "./game-constants.js";

import {
    validatePuzzle
} from "./puzzles/puzzle-validator.js";

import {
    testPuzzles
} from "./puzzles/test-puzzles.js";

function copyBoard(board) {
    return board.map((row) => [...row]);
}

function createLockedCells(puzzle) {
    return puzzle.map((row) =>
        row.map((value) => value !== CELL_STATES.EMPTY)
    );
}

export class GameState {
    constructor(currentPuzzle = testPuzzles.standard) {
        validatePuzzle(currentPuzzle);

        this.puzzle = currentPuzzle; 

        this.startingBoard = copyBoard(currentPuzzle.startingBoard);
        this.board = copyBoard(currentPuzzle.startingBoard);
        this.solution = copyBoard(currentPuzzle.solution); 
        this.lockedCells = createLockedCells(currentPuzzle.startingBoard);
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