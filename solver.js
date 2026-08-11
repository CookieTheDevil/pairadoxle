import {
    BOARD_SIZE,
    CELL_STATES
} from "./game-constants.js";

import {
    findViolations
} from "./validator.js";

function copyBoard(board) {
    return board.map((row) => [...row]);
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

function isValidPartialBoard(board, relations = []) {
    return findViolations(board, relations).size === 0;
}

export function solveBoard(startingBoard, relations = []) {
    const board = copyBoard(startingBoard);

    const solved = solveRecursive(board, relations);

    if (!solved) {
        return null;
    }

    return copyBoard(board);
}

//tries out all possible solutions: returns the first one
function solveRecursive(board, relations) {
    const emptyCell = findFirstEmptyCell(board);

    if (!emptyCell) {
        return true;
    }

    const { row, col } = emptyCell;

    const candidates = [
        CELL_STATES.X,
        CELL_STATES.Y
    ];

    for (const candidate of candidates) {
        board[row][col] = candidate;

        if (
            isValidPartialBoard(
                board,
                relations
            ) &&
            solveRecursive(
                board,
                relations
            )
        ) {
            return true;
        }

        board[row][col] =
            CELL_STATES.EMPTY;
    }

    return false;
}

export function countSolutions(
    startingBoard,
    relations = [],
    limit = 2                       //stops testing when the limit is met
) {
    const board = copyBoard(startingBoard);

    return countSolutionsRecursive(
        board,
        relations,
        limit
    );
}

function countSolutionsRecursive(
    board,
    relations,
    limit
) {
    if (limit <= 0) {
        return 0;
    }

    const emptyCell =
        findFirstEmptyCell(board);

    if (!emptyCell) {
        return 1;
    }

    const { row, col } = emptyCell;

    let count = 0;

    for (
        const candidate
        of [CELL_STATES.X, CELL_STATES.Y]
    ) {
        board[row][col] = candidate;

        if (
            isValidPartialBoard(
                board,
                relations
            )
        ) {
            count +=
                countSolutionsRecursive(
                    board,
                    relations,
                    limit - count
                );
        }

        board[row][col] =
            CELL_STATES.EMPTY;

        if (count >= limit) {
            return count;
        }
    }

    return count;
}