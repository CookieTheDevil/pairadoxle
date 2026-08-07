import {
    BOARD_SIZE,
    CELL_STATES
} from "./game-constants.js";

import {
    findViolations
} from "./validator.js";

import {
    solveLogically
} from "./logic-solver.js";

import {
    countSolutions
} from "./solver.js";

import {
    calculateDifficulty
} from "./difficulty.js";

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

function copyBoard(board) {
    return board.map((row) => [...row]);
}

function getAllPositions() {
    const positions = [];

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            positions.push({ row, col });
        }
    }

    return positions;
}

//generates a minimal board with only one solution
export function generateStartingBoard(
    solution,
    relations = []
) {
    const board = copyBoard(solution);

    const positions = shuffle(getAllPositions());

    for (const { row, col } of positions) {
        const previousValue = board[row][col];

        board[row][col] = CELL_STATES.EMPTY;

        const solutionCount =
            countSolutions(
                board,
                relations,
                2
            );

        if (solutionCount !== 1) {
            board[row][col] =
                previousValue;
        }
    }

    return board;
}

export function generatePuzzle(id = "generated-puzzle", options = {}) {
    const { difficulty = null, maxAttempts = 20 } = options;

    /*
     * No requested difficulty:
     * just generate one valid puzzle.
     */
    if (difficulty === null) {
        return generatePuzzleCandidate(id);
    }

    const validDifficulties = [
        "easy",
        "medium",
        "hard"
    ];

    if ( !validDifficulties.includes(difficulty)) {
        throw new Error(
            `Invalid difficulty: ${difficulty}`
        );
    }

    let closestCandidate = null;
    let closestDistance = Infinity;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const candidate = generatePuzzleCandidate(id);

        if (candidate.difficulty.level === difficulty) {
            return candidate;
        }

        const distance = getDifficultyDistance(
            candidate.difficulty.score,
            difficulty
        );

        if (distance < closestDistance) {
            closestCandidate = candidate;
            closestDistance = distance;
        }
    }

    /*
     * We failed to hit the exact band,
     * so return the closest good puzzle
     * rather than failing generation.
     */
    return closestCandidate;
}

function generatePuzzleCandidate(id) {
    const solution = generateSolution();

    const generated = generateUsefulRelations(solution, 4);

    const startingBoard = makeLogicSolvable(
        generated.startingBoard,
        solution,
        generated.relations
    );

    const result = solveLogically(startingBoard, generated.relations);
    const difficulty = calculateDifficulty(result);

    return {
        id,
        startingBoard,
        solution,
        relations: generated.relations,
        difficulty
    };
}

function getDifficultyDistance(score, targetDifficulty) {
    const ranges = {
        easy: {
            min: 0,
            max: 24
        },

        medium: {
            min: 25,
            max: 31
        },

        hard: {
            min: 32,
            max: Infinity
        }
    };

    const range = ranges[targetDifficulty];

    if (score >= range.min && score <= range.max) {
        return 0;
    }

    if (score < range.min) {
        return range.min - score;
    }

    return score - range.max;
}

function getRelationCandidates(solution) {
    const candidates = [];

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE - 1; col++) {
            candidates.push({
                row,
                col,
                direction: "horizontal",
                type:
                    solution[row][col] === solution[row][col + 1]
                        ? "same"
                        : "different"
            });
        }
    }

    for (let row = 0; row < BOARD_SIZE - 1; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            candidates.push({
                row,
                col,
                direction: "vertical",
                type:
                    solution[row][col] === solution[row + 1][col]
                        ? "same"
                        : "different"
            });
        }
    }

    return candidates;
}

export function generateRelations(
    solution,
    maxRelations = 4
) {
    const candidates =
        shuffle(
            getRelationCandidates(solution)
        );

    return candidates.slice(
        0,
        Math.min(
            maxRelations,
            candidates.length
        )
    );
}

function countFilledCells(board) {
    return board
        .flat()
        .filter((cell) => cell !== CELL_STATES.EMPTY)
        .length;
}

export function generateUsefulRelations(
    solution,
    maxRelations = 4
) {
    let relations = [];
    let bestStartingBoard = generateStartingBoard(solution, relations);

    let bestFilledCount = countFilledCells(bestStartingBoard);

    const candidates = shuffle(getRelationCandidates(solution));

    for (const candidate of candidates) {
        if (relations.length >= maxRelations) {
            break;
        }

        const testRelations = [...relations, candidate];

        const testStartingBoard =
            generateStartingBoard(
                solution,
                testRelations
            );

        const testFilledCount = countFilledCells(testStartingBoard);

        if (testFilledCount < bestFilledCount) {
            relations = testRelations;
            bestStartingBoard = testStartingBoard;
            bestFilledCount = testFilledCount;
        }
    }

    return {
        relations,
        startingBoard:
            bestStartingBoard
    };
}

function makeLogicSolvable(
    startingBoard,
    solution,
    relations = []
) {
    const board = copyBoard(startingBoard);
    const emptyPositions = [];

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === CELL_STATES.EMPTY) {
                emptyPositions.push({ row, col });
            }
        }
    }

    const positions = shuffle(emptyPositions);
    let result = solveLogically(board, relations);
    
    if (result.solved) {
        return board;
    }

    for (const { row, col } of positions) {
        board[row][col] = solution[row][col];

        result = solveLogically(board, relations);

        if (result.solved) {
            return board;
        }
    }

    throw new Error(
        "Could not create a logically solvable puzzle."
    );
}