import {
    BOARD_SIZE,
    CELL_STATES
} from "../game-constants.js";

const VALID_CELL_VALUES = new Set([
    CELL_STATES.EMPTY,
    CELL_STATES.X,
    CELL_STATES.Y
]);

const VALID_RELATION_TYPES = new Set([
    "same",
    "different"
]);

const VALID_RELATION_DIRECTIONS = new Set([
    "horizontal",
    "vertical"
]);

export function validatePuzzle(puzzle) {
    if (!puzzle || typeof puzzle !== "object") {
        throw new TypeError("Puzzle must be an object.");
    }

    validatePuzzleId(puzzle.id);                                    // Non-empty string id
    validateBoard(puzzle.startingBoard, "startingBoard");           // Starting-board is valid 6x6 board
    validateBoard(puzzle.solution, "solution");                     // Solution-board is valid 6x6 board
    validateStartingValues(puzzle.startingBoard, puzzle.solution);  // Starting-board is a subvalue of Solution-board, and Solution contains only non-empty cells
    validateRelations(puzzle.relations, puzzle.solution);           // Validate relations-behaviour

    return true;
}

function validatePuzzleId(id) {
    if (typeof id !== "string" || id.trim() === "") {
        throw new Error(
            "Puzzle must have a non-empty string ID."
        );
    }
}

function validateBoard(board, propertyName) {
    if (!Array.isArray(board)) {
        throw new TypeError(
            `${propertyName} must be an array.`
        );
    }

    if (board.length !== BOARD_SIZE) {
        throw new Error(
            `${propertyName} must contain exactly ` +
            `${BOARD_SIZE} rows.`
        );
    }

    board.forEach((row, rowIndex) => {
        if (!Array.isArray(row)) {
            throw new TypeError(
                `${propertyName}[${rowIndex}] must be an array.`
            );
        }

        if (row.length !== BOARD_SIZE) {
            throw new Error(
                `${propertyName}[${rowIndex}] must contain exactly ` +
                `${BOARD_SIZE} cells.`
            );
        }

        row.forEach((value, colIndex) => {
            if (!VALID_CELL_VALUES.has(value)) {
                throw new Error(
                    `Invalid value in ${propertyName} at ` +
                    `row ${rowIndex}, column ${colIndex}: ${value}`
                );
            }
        });
    });
}

function validateStartingValues(startingBoard, solution) {
    for (let row = 0; row < BOARD_SIZE; row += 1) {
        for (let col = 0; col < BOARD_SIZE; col += 1) {
            const startingValue = startingBoard[row][col];
            const solutionValue = solution[row][col];

            if (solutionValue === CELL_STATES.EMPTY) {
                throw new Error(
                    `The solution cannot contain an empty cell at ` +
                    `row ${row}, column ${col}.`
                );
            }

            if (
                startingValue !== CELL_STATES.EMPTY &&
                startingValue !== solutionValue
            ) {
                throw new Error(
                    `The starting value at row ${row}, column ${col} ` +
                    `does not match the solution.`
                );
            }
        }
    }
}

function validateRelations(relations, solution) {
    if (!Array.isArray(relations)) {
        throw new TypeError(
            "Puzzle relations must be an array."
        );
    }

    relations.forEach((relation, index) => {
        validateRelationShape(relation, index);                     // Correct syntax      
        validateRelationPosition(relation, index);                  // Correct semantics
        validateRelationAgainstSolution(                            // Proper solution
            relation, 
            solution, 
            index
        );
    });
}

function validateRelationShape(relation, index) {
    if (!relation || typeof relation !== "object") {
        throw new TypeError(
            `Relation ${index} must be an object.`
        );
    }

    if (!Number.isInteger(relation.row)) {
        throw new Error(
            `Relation ${index} must have an integer row.`
        );
    }

    if (!Number.isInteger(relation.col)) {
        throw new Error(
            `Relation ${index} must have an integer column.`
        );
    }

    if (!VALID_RELATION_TYPES.has(relation.type)) {
        throw new Error(
            `Relation ${index} has an invalid type: ` +
            `${relation.type}`
        );
    }

    if (
        !VALID_RELATION_DIRECTIONS.has(
            relation.direction
        )
    ) {
        throw new Error(
            `Relation ${index} has an invalid direction: ` +
            `${relation.direction}`
        );
    }
}

function validateRelationPosition(relation, index) {
    const { row, col, direction } = relation;

    const firstCellIsInside =
        row >= 0 &&
        row < BOARD_SIZE &&
        col >= 0 &&
        col < BOARD_SIZE;

    if (!firstCellIsInside) {
        throw new Error(
            `Relation ${index} starts outside the board.`
        );
    }

    const secondRow =
        direction === "vertical"
            ? row + 1
            : row;

    const secondCol =
        direction === "horizontal"
            ? col + 1
            : col;

    const secondCellIsInside =
        secondRow >= 0 &&
        secondRow < BOARD_SIZE &&
        secondCol >= 0 &&
        secondCol < BOARD_SIZE;

    if (!secondCellIsInside) {
        throw new Error(
            `Relation ${index} ends outside the board.`
        );
    }
}

function validateRelationAgainstSolution(
    relation,
    solution,
    index
) {
    const firstValue =
        solution[relation.row][relation.col];

    const secondRow =
        relation.direction === "vertical"
            ? relation.row + 1
            : relation.row;

    const secondCol =
        relation.direction === "horizontal"
            ? relation.col + 1
            : relation.col;

    const secondValue =
        solution[secondRow][secondCol];

    const relationIsValid =
        relation.type === "same"
            ? firstValue === secondValue
            : firstValue !== secondValue;

    if (!relationIsValid) {
        throw new Error(
            `Relation ${index} conflicts with the solution.`
        );
    }
}