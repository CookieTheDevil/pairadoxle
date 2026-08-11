// puzzles/test-puzzles.js

export const TEST_SOLUTION = [
    ["y", "x", "y", "x", "x", "y"],
    ["x", "y", "x", "y", "y", "x"],
    ["x", "y", "y", "x", "x", "y"],
    ["y", "x", "x", "y", "x", "y"],
    ["x", "y", "x", "y", "y", "x"],
    ["y", "x", "y", "x", "y", "x"]
];

function copyBoard(board) {
    return board.map((row) => [...row]);
}

function createBoardWithEmptyCells(emptyCells) {
    const board = copyBoard(TEST_SOLUTION);

    emptyCells.forEach(({ row, col }) => {
        board[row][col] = null;
    });

    return board;
}

export const testPuzzles = {
    standard: {
        id: "test-standard",

        startingBoard: [
            ["y", null, null, null, null, "y"],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null],
            ["y", null, null, null, null, "x"]
        ],

        solution: copyBoard(TEST_SOLUTION),

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
    },

    nearlySolved: {
        id: "test-nearly-solved",

        startingBoard: createBoardWithEmptyCells([
            { row: 5, col: 4 }
        ]),

        solution: copyBoard(TEST_SOLUTION),

        relations: []
    },

    horizontalSameRelation: {
        id: "test-horizontal-same-relation",

        startingBoard: [
            [null, null, null, "x", null, null],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null]
        ],

        solution: copyBoard(TEST_SOLUTION),

        relations: [
            {
                row: 0,
                col: 3,
                direction: "horizontal",
                type: "same"
            }
        ]
    },

    horizontalDifferentRelation: {
        id: "test-horizontal-different-relation",

        startingBoard: [
            ["y", null, null, null, null, null],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null]
        ],

        solution: copyBoard(TEST_SOLUTION),

        relations: [
            {
                row: 0,
                col: 0,
                direction: "horizontal",
                type: "different"
            }
        ]
    },

    verticalDifferentRelation: {
        id: "test-vertical-different-relation",

        startingBoard: [
            [null, null, null, null, null, null],
            [null, null, null, null, null, null],
            [null, "y", null, null, null, null],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null]
        ],

        solution: copyBoard(TEST_SOLUTION),

        relations: [
            {
                row: 2,
                col: 1,
                direction: "vertical",
                type: "different"
            }
        ]
    },

    verticalSameRelation: {
        id: "test-vertical-same-relation",

        startingBoard: [
            [null, null, null, null, null, null],
            [null, null, null, null, null, null],
            [null, null, null, null, "x", null],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null]
        ],

        solution: copyBoard(TEST_SOLUTION),

        relations: [
            {
                row: 2,
                col: 4,
                direction: "vertical",
                type: "same"
            }
        ]
    },

    balanceHint: {
        id: "test-balance-hint",

        startingBoard: [
            ["y", null, "y", null, null, "y"],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null]
        ],

        solution: copyBoard(TEST_SOLUTION),

        relations: []
    },

    adjacentPairHint: {
        id: "test-adjacent-pair-hint",

        startingBoard: [
            [null, null, null, "x", "x", null],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null]
        ],

        solution: copyBoard(TEST_SOLUTION),

        relations: []
    },

    separatedPairHint: {
        id: "test-separated-pair-hint",

        startingBoard: [
            ["y", null, "y", null, null, null],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null]
        ],

        solution: copyBoard(TEST_SOLUTION),

        relations: []
    },

    verticalAdjacentPairHint: {
        id: "test-vertical-adjacent-pair-hint",

        startingBoard: [
            [null, null, null, null, null, null],
            ["x", null, null, null, null, null],
            ["x", null, null, null, null, null],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null]
        ],

        solution: copyBoard(TEST_SOLUTION),

        relations: []
    },

    fallbackHint: {
        id: "test-fallback-hint",

        startingBoard: [
            [null, null, null, null, null, null],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null]
        ],

        solution: copyBoard(TEST_SOLUTION),

        relations: []
    }
};