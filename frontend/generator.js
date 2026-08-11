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

import {
    createSeededRandom  //Unique pseudo-random based on todays date
} from "./random.js";

function createEmptyBoard() {
    return Array.from(
        { length: BOARD_SIZE },
        () =>
            Array(BOARD_SIZE).fill(
                CELL_STATES.EMPTY
            )
    );
}

function copyBoard(board) {
    return board.map(
        (row) => [...row]
    );
}

// The magic happens here! Fisher-Yates my beloved
function shuffle(values, random = Math.random) {
    const copy = [...values];

    /**
     * random is value between 0 and 1. If this value is 0.50 or above, the candidates are shuffled.
     * The the value is below 0.50, no real switch occurs.
     * 
     * Even if a switch occurs, it doesn't mean Y is used. It is only used if no violation occurs from it. 
     */
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
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

function fillBoard(board, random = Math.random) {
    const emptyCell = findFirstEmptyCell(board);

    //only false when there are no empty cells -> board is filled
    if (!emptyCell) {
        return true;
    }

    const { row, col } = emptyCell;

    const candidates = shuffle([CELL_STATES.X, CELL_STATES.Y], random);

    for (const candidate of candidates) {
        board[row][col] = candidate;

        if (findViolations(board).size === 0 && fillBoard(board, random)) {
            return true;
        }

        board[row][col] = CELL_STATES.EMPTY;
    }

    return false;
}

//Start of the recursive function
export function generateSolution(random = Math.random) {
    const board = createEmptyBoard();
    const generated = fillBoard(board, random);

    if (!generated) {
        throw new Error(
            "Could not generate a valid solution."
        );
    }

    return copyBoard(board);
}

//flattens the array for easy shuffling -> pseudo-random minimal puzzle
function getAllPositions() {
    const positions = [];

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            positions.push({ row, col });
        }
    }

    return positions;
}


/*
 * Removes as many fixed cells as possible, pseudorandomly,
 * while preserving exactly one solution.
 */
export function generateStartingBoard(
    solution,
    relations = [],
    random = Math.random
) {
    const board = copyBoard(solution);

    const positions = shuffle(getAllPositions(), random);

    for ( const { row, col } of positions ) {
        const previousValue = board[row][col];
        board[row][col] = CELL_STATES.EMPTY;

        const solutionCount = countSolutions(board, relations, 2);

        if (solutionCount !== 1) {
            board[row][col] = previousValue;
        }
    }

    return board;
}


export function generatePuzzle(id = "generated-puzzle", options = {}) {
    const { difficulty = null, maxAttempts = 20 } = options;

    if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
        throw new Error(
            "maxAttempts must be a positive integer."
        );
    }

    /*
     * Every random decision for this puzzle
     * now comes from this deterministic RNG.
     */
    const random = createSeededRandom(id);

    // difficulty isn't preset (unless it is)
    if (difficulty === null) {
        return generatePuzzleCandidate(id, random);
    }

    const validDifficulties = [
        "easy",
        "medium",
        "hard"
    ];

    if (!validDifficulties.includes(difficulty)) {
        throw new Error(
            `Invalid difficulty: ${difficulty}`
        );
    }

    let closestCandidate = null;
    let closestDistance = Infinity;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const candidate = generatePuzzleCandidate(
            id,
            random
        );

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

    return closestCandidate;
}


function generatePuzzleCandidate(id, random) {
    const solution = generateSolution(random);
    const generated = generateUsefulRelations(solution, 4, random);

    const startingBoard =
        makeLogicSolvable(
            generated.startingBoard,
            solution,
            generated.relations,
            random
        );

    const result =
        solveLogically(
            startingBoard,
            generated.relations
        );

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

    /*
     * Horizontal relations.
     */
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

    /*
     * Vertical relations.
     */
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
    maxRelations = 4,
    random = Math.random
) {
    const candidates = shuffle(getRelationCandidates(solution), random);

    return candidates.slice(0, Math.min(maxRelations, candidates.length));
}

function countFilledCells(board) {
    return board
        .flat()
        .filter(
            (cell) =>
                cell !==
                CELL_STATES.EMPTY
        )
        .length;
}

/*
 * Keeps relation clues only when they allow
 * the puzzle to use fewer fixed X/Y clues.
 */
export function generateUsefulRelations(
    solution,
    maxRelations = 4,
    random = Math.random
) {
    let relations = [];
    let bestStartingBoard = generateStartingBoard(solution, relations, random);
    let bestFilledCount = countFilledCells(bestStartingBoard);

    const candidates = shuffle(getRelationCandidates(solution), random);

    for (const candidate of candidates) {
        if (relations.length >= maxRelations) {
            break;
        }

        const testRelations = [...relations, candidate];
        const testStartingBoard = generateStartingBoard(solution, testRelations, random);
        const testFilledCount = countFilledCells(testStartingBoard);

        if (testFilledCount < bestFilledCount) {
            relations = testRelations;
            bestStartingBoard = testStartingBoard;
            bestFilledCount = testFilledCount;
        }
    }

    return {relations, startingBoard: bestStartingBoard};
}


/*
 * If a unique puzzle cannot be solved using
 * our supported logical rules, restore fixed
 * clues until the logic solver can complete it.
 */
function makeLogicSolvable(
    startingBoard,
    solution,
    relations = [],
    random = Math.random
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

    const positions = shuffle(emptyPositions, random);

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