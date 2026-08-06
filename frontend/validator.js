import {
    BOARD_SIZE,
    CELL_STATES
} from "./game-state.js";

export function findViolations(board, relations = []) {
    const violations = new Set();

    checkThreeInARow(board, violations);
    checkBalance(board, violations);
    checkRelations(board, relations, violations);

    return violations;
}

export function isBoardComplete(board) {
    return board.every(row => 
        row.every(
            cell => cell !== CELL_STATES.EMPTY
        )
    ); 
}

export function isBoardSolved(board, relations=[]) {
    return ( 
        isBoardComplete(board) &&
        findViolations(board, relations).size === 0
    ); 
}

function isTriple(values) {
    return (
        values[0] !== CELL_STATES.EMPTY &&
        values[0] === values[1] &&
        values[1] === values[2]
    );
}

function checkThreeInARow(board, violations) {
    // Check horizontal triples
    for (let row = 0; row < BOARD_SIZE; row += 1) {
        for (let col = 0; col <= BOARD_SIZE - 3; col += 1) {
            const values = [
                board[row][col],
                board[row][col + 1],
                board[row][col + 2]
            ];

            if (isTriple(values)) {
                violations.add(`${row},${col}`);
                violations.add(`${row},${col + 1}`);
                violations.add(`${row},${col + 2}`);
            }
        }
    }

    // Check vertical triples
    for (let col = 0; col < BOARD_SIZE; col += 1) {
        for (let row = 0; row <= BOARD_SIZE - 3; row += 1) {
            const values = [
                board[row][col],
                board[row + 1][col],
                board[row + 2][col]
            ];

            if (isTriple(values)) {
                violations.add(`${row},${col}`);
                violations.add(`${row + 1},${col}`);
                violations.add(`${row + 2},${col}`);
            }
        }
    }
}

function markExcessSymbols(
    values,
    index,
    direction,
    violations,
    maxPerSymbol
) {
    for (const symbol of [CELL_STATES.X, CELL_STATES.Y]) {
        const count = values.filter((value) => value === symbol).length;

        if (count <= maxPerSymbol) {
            continue;
        }

        values.forEach((value, position) => {
            if (value !== symbol) {
                return;
            }

            const row = direction === "row" ? index : position;
            const col = direction === "row" ? position : index;

            violations.add(`${row},${col}`);
        });
    }
}

function checkBalance(board, violations) {
    const maxPerSymbol = BOARD_SIZE / 2;

    for (let row = 0; row < BOARD_SIZE; row += 1) {
        const rowValues = board[row];
        markExcessSymbols(rowValues, row, "row", violations, maxPerSymbol);
    }

    for (let col = 0; col < BOARD_SIZE; col += 1) {
        const columnValues = board.map((row) => row[col]);
        markExcessSymbols(columnValues, col, "column", violations, maxPerSymbol);
    }
}

function checkRelations(board, relations, violations) {
    for (const relation of relations) {
        const firstRow = relation.row;
        const firstCol = relation.col;

        const secondRow = relation.direction === "vertical" ? firstRow + 1 : firstRow;

        const secondCol = relation.direction === "horizontal" ? firstCol + 1 : firstCol;

        const firstValue = board[firstRow][firstCol];
        const secondValue = board[secondRow][secondCol];

        if ( firstValue === CELL_STATES.EMPTY || secondValue === CELL_STATES.EMPTY ) {
            continue;
        }

        const isValid = relation.type === "same" ? firstValue === secondValue : firstValue !== secondValue;

        if (!isValid) {
            violations.add(`${firstRow},${firstCol}`);
            violations.add(`${secondRow},${secondCol}`);
        }
    }
}