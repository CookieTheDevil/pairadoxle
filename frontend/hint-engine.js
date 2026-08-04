// hint-engine.js

import {
    BOARD_SIZE,
    CELL_STATES
} from "./game-state.js";

/**
 * Returns one hint in this format:
 *
 * {
 *     row: 2,
 *     col: 4,
 *     value: "x",
 *     type: "incorrect",
 *     reason: "This cell conflicts with the solution."
 * }
 *
 * Returns null when no hint is available.
 */
export function findHint(board, solution) {
    return (
        findIncorrectCell(board, solution) ??
        findDeducibleCell(board, solution) ??
        findFallbackCell(board, solution)
    );
}

/**
 * Priority 1:
 * Find a filled cell whose value differs from the solution.
 */
function findIncorrectCell(board, solution) {
    const incorrectCells = [];

    for (let row = 0; row < BOARD_SIZE; row += 1) {
        for (let col = 0; col < BOARD_SIZE; col += 1) {
            const currentValue = board[row][col];
            const correctValue = solution[row][col];

            if (
                currentValue !== CELL_STATES.EMPTY &&
                currentValue !== correctValue
            ) {
                incorrectCells.push({
                    row,
                    col,
                    value: correctValue,
                    type: "incorrect",
                    reason: "This cell had the wrong symbol."
                });
            }
        }
    }

    return chooseRandom(incorrectCells);
}

/**
 * Priority 2:
 * Find a cell that can be deduced from the current rules.
 */
function findDeducibleCell(board, solution) {
    const deductions = [
        ...findBalanceDeductions(board),
        ...findAdjacentPairDeductions(board),
        ...findSeparatedPairDeductions(board)
    ];

    /*
     * Several rules may deduce the same cell.
     * Remove duplicates before choosing one.
     */
    const uniqueDeductions = removeDuplicateDeductions(deductions);

    /*
     * The deduction logic should already be correct, but comparing it
     * with the known solution protects against bugs while developing.
     */
    const verifiedDeductions = uniqueDeductions.filter((hint) =>
        hint.value === solution[hint.row][hint.col]
    );

    return chooseRandom(verifiedDeductions);
}

/**
 * Balance rule:
 *
 * On a 6×6 board, if a row or column already has three X symbols,
 * every remaining empty cell must be Y, and vice versa.
 */
function findBalanceDeductions(board) {
    const deductions = [];
    const requiredPerSymbol = BOARD_SIZE / 2;

    for (let row = 0; row < BOARD_SIZE; row += 1) {
        const values = board[row];

        addBalanceDeductions(
            values,
            requiredPerSymbol,
            (position) => ({
                row,
                col: position
            }),
            deductions,
            `row ${row + 1}`
        );
    }

    for (let col = 0; col < BOARD_SIZE; col += 1) {
        const values = board.map((row) => row[col]);

        addBalanceDeductions(
            values,
            requiredPerSymbol,
            (position) => ({
                row: position,
                col
            }),
            deductions,
            `column ${col + 1}`
        );
    }

    return deductions;
}

function addBalanceDeductions(
    values,
    requiredPerSymbol,
    getCoordinates,
    deductions,
    locationName
) {
    const xCount = countSymbol(values, CELL_STATES.X);
    const yCount = countSymbol(values, CELL_STATES.Y);

    let requiredValue = null;

    if (xCount === requiredPerSymbol) {
        requiredValue = CELL_STATES.Y;
    } else if (yCount === requiredPerSymbol) {
        requiredValue = CELL_STATES.X;
    }

    if (requiredValue === null) {
        return;
    }

    values.forEach((value, position) => {
        if (value !== CELL_STATES.EMPTY) {
            return;
        }

        const { row, col } = getCoordinates(position);

        deductions.push({
            row,
            col,
            value: requiredValue,
            type: "deduced",
            reason:
                `${locationName} already contains the maximum ` +
                `number of the other symbol.`
        });
    });
}

/**
 * Adjacency rule:
 *
 * XX_ must become XXY
 * _XX must become YXX
 *
 * The same applies to Y.
 */
function findAdjacentPairDeductions(board) {
    const deductions = [];

    for (let row = 0; row < BOARD_SIZE; row += 1) {
        for (let col = 0; col <= BOARD_SIZE - 2; col += 1) {
            const first = board[row][col];
            const second = board[row][col + 1];

            if (!isMatchingFilledPair(first, second)) {
                continue;
            }

            const opposite = getOpposite(first);

            if (
                col > 0 &&
                board[row][col - 1] === CELL_STATES.EMPTY
            ) {
                deductions.push({
                    row,
                    col: col - 1,
                    value: opposite,
                    type: "deduced",
                    reason:
                        "Three identical symbols cannot appear horizontally."
                });
            }

            if (
                col + 2 < BOARD_SIZE &&
                board[row][col + 2] === CELL_STATES.EMPTY
            ) {
                deductions.push({
                    row,
                    col: col + 2,
                    value: opposite,
                    type: "deduced",
                    reason:
                        "Three identical symbols cannot appear horizontally."
                });
            }
        }
    }

    for (let col = 0; col < BOARD_SIZE; col += 1) {
        for (let row = 0; row <= BOARD_SIZE - 2; row += 1) {
            const first = board[row][col];
            const second = board[row + 1][col];

            if (!isMatchingFilledPair(first, second)) {
                continue;
            }

            const opposite = getOpposite(first);

            if (
                row > 0 &&
                board[row - 1][col] === CELL_STATES.EMPTY
            ) {
                deductions.push({
                    row: row - 1,
                    col,
                    value: opposite,
                    type: "deduced",
                    reason:
                        "Three identical symbols cannot appear vertically."
                });
            }

            if (
                row + 2 < BOARD_SIZE &&
                board[row + 2][col] === CELL_STATES.EMPTY
            ) {
                deductions.push({
                    row: row + 2,
                    col,
                    value: opposite,
                    type: "deduced",
                    reason:
                        "Three identical symbols cannot appear vertically."
                });
            }
        }
    }

    return deductions;
}

/**
 * Separated-pair rule:
 *
 * X_X must become XYX.
 * Y_Y must become YXY.
 */
function findSeparatedPairDeductions(board) {
    const deductions = [];

    for (let row = 0; row < BOARD_SIZE; row += 1) {
        for (let col = 0; col <= BOARD_SIZE - 3; col += 1) {
            const first = board[row][col];
            const middle = board[row][col + 1];
            const third = board[row][col + 2];

            if (
                first !== CELL_STATES.EMPTY &&
                first === third &&
                middle === CELL_STATES.EMPTY
            ) {
                deductions.push({
                    row,
                    col: col + 1,
                    value: getOpposite(first),
                    type: "deduced",
                    reason:
                        "The middle symbol must differ from both neighbours."
                });
            }
        }
    }

    for (let col = 0; col < BOARD_SIZE; col += 1) {
        for (let row = 0; row <= BOARD_SIZE - 3; row += 1) {
            const first = board[row][col];
            const middle = board[row + 1][col];
            const third = board[row + 2][col];

            if (
                first !== CELL_STATES.EMPTY &&
                first === third &&
                middle === CELL_STATES.EMPTY
            ) {
                deductions.push({
                    row: row + 1,
                    col,
                    value: getOpposite(first),
                    type: "deduced",
                    reason:
                        "The middle symbol must differ from both neighbours."
                });
            }
        }
    }

    return deductions;
}

/**
 * Priority 3:
 * Pick an unresolved cell and reveal its solution value.
 */
function findFallbackCell(board, solution) {
    const candidates = [];

    for (let row = 0; row < BOARD_SIZE; row += 1) {
        for (let col = 0; col < BOARD_SIZE; col += 1) {
            if (board[row][col] === CELL_STATES.EMPTY) {
                candidates.push({
                    row,
                    col,
                    value: solution[row][col],
                    type: "fallback",
                    reason:
                        "No direct deduction was available, so a cell was revealed."
                });
            }
        }
    }

    return chooseRandom(candidates);
}

function removeDuplicateDeductions(deductions) {
    const unique = new Map();

    for (const deduction of deductions) {
        const key =
            `${deduction.row},${deduction.col},${deduction.value}`;

        if (!unique.has(key)) {
            unique.set(key, deduction);
        }
    }

    return [...unique.values()];
}

function countSymbol(values, symbol) {
    return values.filter((value) => value === symbol).length;
}

function isMatchingFilledPair(first, second) {
    return (
        first !== CELL_STATES.EMPTY &&
        first === second
    );
}

function getOpposite(symbol) {
    return symbol === CELL_STATES.X
        ? CELL_STATES.Y
        : CELL_STATES.X;
}

function chooseRandom(items) {
    if (items.length === 0) {
        return null;
    }

    const index = Math.floor(Math.random() * items.length);
    return items[index];
}