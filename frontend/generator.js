import {
    BOARD_SIZE,
    CELL_STATES
} from "./game-constants.js";

import {
    findViolations
} from "./validator.js";

function createEmptyBoard() {
    return Array.from(
        { length: BOARD_SIZE },
        () => Array(BOARD_SIZE).fill(CELL_STATES.EMPTY)
    );
}

function shuffle(values) {
    const copy = [...values];

    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
}

function findFirstEmptyCell(board) {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === CELL_STATES.EMPTY) {
                return { row, col };
            }
        }
    }

    return null;
}

function fillBoard(board) {
    const emptyCell = findFirstEmptyCell(board);

    if (!emptyCell) {
        return true;
    }

    const { row, col } = emptyCell;

    const candidates = shuffle([
        CELL_STATES.X,
        CELL_STATES.Y
    ]);

    for (const candidate of candidates) {
        board[row][col] = candidate;

        if ( findViolations(board).size === 0 && fillBoard(board) ) {
            return true;
        }

        board[row][col] = CELL_STATES.EMPTY;
    }

    return false;
}

export function generateSolution() {
    const board = createEmptyBoard();
    const generated = fillBoard(board);

    if (!generated) {
        throw new Error(
            "Could not generate a valid solution."
        );
    }

    return board.map( (row) => [...row] );
}