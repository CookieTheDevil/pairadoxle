import {
    describe,
    expect,
    test
} from "vitest";

import {
    validatePuzzle
} from "../puzzles/puzzle-validator.js";

const VALID_SOLUTION = [
    ["y", "x", "y", "x", "x", "y"],
    ["x", "y", "x", "y", "y", "x"],
    ["x", "y", "y", "x", "x", "y"],
    ["y", "x", "x", "y", "x", "y"],
    ["x", "y", "x", "y", "y", "x"],
    ["y", "x", "y", "x", "y", "x"]
];

function createValidPuzzle() {
    return {
        id: "test-puzzle",

        startingBoard: [
            ["y", null, null, null, null, "y"],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null],
            [null, null, null, null, null, null],
            ["y", null, null, null, null, "x"]
        ],

        solution: VALID_SOLUTION.map(
            (row) => [...row]
        ),

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
}

describe("validatePuzzle", () => {
    test("accepts a valid puzzle", () => {
        const puzzle = createValidPuzzle();

        expect(
            validatePuzzle(puzzle)
        ).toBe(true);
    });

    test("rejects a missing puzzle object", () => {
        expect(() => {
            validatePuzzle(null);
        }).toThrow();
    });

    test("rejects an empty puzzle id", () => {
        const puzzle = createValidPuzzle();

        puzzle.id = "";

        expect(() => {
            validatePuzzle(puzzle);
        }).toThrow();
    });

    test("rejects a starting board with the wrong number of rows", () => {
        const puzzle = createValidPuzzle();

        puzzle.startingBoard.pop();

        expect(() => {
            validatePuzzle(puzzle);
        }).toThrow();
    });

    test("rejects a starting board row with the wrong length", () => {
        const puzzle = createValidPuzzle();

        puzzle.startingBoard[0].pop();

        expect(() => {
            validatePuzzle(puzzle);
        }).toThrow();
    });

    test("rejects an invalid starting cell value", () => {
        const puzzle = createValidPuzzle();

        puzzle.startingBoard[0][1] = "z";

        expect(() => {
            validatePuzzle(puzzle);
        }).toThrow();
    });

    test("rejects an incomplete solution", () => {
        const puzzle = createValidPuzzle();

        puzzle.solution[0][0] = null;

        expect(() => {
            validatePuzzle(puzzle);
        }).toThrow();
    });

    test("rejects an invalid solution value", () => {
        const puzzle = createValidPuzzle();

        puzzle.solution[0][0] = "z";

        expect(() => {
            validatePuzzle(puzzle);
        }).toThrow();
    });

    test("rejects a starting cell that disagrees with the solution", () => {
        const puzzle = createValidPuzzle();

        puzzle.startingBoard[0][0] = "x";

        expect(() => {
            validatePuzzle(puzzle);
        }).toThrow();
    });

    test("rejects a relation with an invalid type", () => {
        const puzzle = createValidPuzzle();

        puzzle.relations[0].type = "similar";

        expect(() => {
            validatePuzzle(puzzle);
        }).toThrow();
    });

    test("rejects a relation with an invalid direction", () => {
        const puzzle = createValidPuzzle();

        puzzle.relations[0].direction =
            "diagonal";

        expect(() => {
            validatePuzzle(puzzle);
        }).toThrow();
    });

    test("rejects a horizontal relation that extends outside the board", () => {
        const puzzle = createValidPuzzle();

        puzzle.relations = [
            {
                row: 0,
                col: 5,
                direction: "horizontal",
                type: "same"
            }
        ];

        expect(() => {
            validatePuzzle(puzzle);
        }).toThrow();
    });

    test("rejects a vertical relation that extends outside the board", () => {
        const puzzle = createValidPuzzle();

        puzzle.relations = [
            {
                row: 5,
                col: 0,
                direction: "vertical",
                type: "same"
            }
        ];

        expect(() => {
            validatePuzzle(puzzle);
        }).toThrow();
    });

    test("rejects a relation that disagrees with the solution", () => {
        const puzzle = createValidPuzzle();

        puzzle.relations = [
            {
                row: 0,
                col: 0,
                direction: "horizontal",
                type: "same"
            }
        ];

        /*
         * solution[0][0] = y
         * solution[0][1] = x
         *
         * So "same" is invalid.
         */
        expect(() => {
            validatePuzzle(puzzle);
        }).toThrow();
    });
});