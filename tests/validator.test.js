import {
    describe,
    expect,
    test
} from "vitest";

import {
    findViolations,
    isBoardComplete,
    isBoardSolved
} from "../validator.js";

const EMPTY_BOARD = () =>
    Array.from(
        { length: 6 },
        () => Array(6).fill(null)
    );

const VALID_SOLUTION = [
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

describe("findViolations", () => {
    test("returns no violations for an empty board", () => {
        const board = EMPTY_BOARD();

        const violations = findViolations(board);

        expect(violations.size).toBe(0);
    });

    test("detects three identical symbols horizontally", () => {
        const board = EMPTY_BOARD();

        board[0][0] = "x";
        board[0][1] = "x";
        board[0][2] = "x";

        const violations = findViolations(board);

        expect(violations).toEqual(
            new Set([
                "0,0",
                "0,1",
                "0,2"
            ])
        );
    });

    test("detects three identical symbols vertically", () => {
        const board = EMPTY_BOARD();

        board[0][2] = "y";
        board[1][2] = "y";
        board[2][2] = "y";

        const violations = findViolations(board);

        expect(violations).toEqual(
            new Set([
                "0,2",
                "1,2",
                "2,2"
            ])
        );
    });

    test("does not treat two identical symbols as a violation", () => {
        const board = EMPTY_BOARD();

        board[0][0] = "x";
        board[0][1] = "x";

        const violations = findViolations(board);

        expect(violations.size).toBe(0);
    });

    test("does not treat empty cells as a triple", () => {
        const board = EMPTY_BOARD();

        const violations = findViolations(board);

        expect(violations.size).toBe(0);
    });

    test("detects too many X symbols in a row", () => {
        const board = EMPTY_BOARD();

        board[2] = [
            "x",
            "x",
            "y",
            "x",
            null,
            "x"
        ];

        const violations = findViolations(board);

        expect(violations.has("2,0")).toBe(true);
        expect(violations.has("2,1")).toBe(true);
        expect(violations.has("2,3")).toBe(true);
        expect(violations.has("2,5")).toBe(true);
    });

    test("detects too many Y symbols in a column", () => {
        const board = EMPTY_BOARD();

        board[0][4] = "y";
        board[1][4] = "y";
        board[3][4] = "y";
        board[5][4] = "y";

        const violations = findViolations(board);

        expect(violations.has("0,4")).toBe(true);
        expect(violations.has("1,4")).toBe(true);
        expect(violations.has("3,4")).toBe(true);
        expect(violations.has("5,4")).toBe(true);
    });

    test("accepts three X and three Y in a row", () => {
        const board = EMPTY_BOARD();

        board[0] = [
            "x",
            "y",
            "x",
            "y",
            "x",
            "y"
        ];

        const violations = findViolations(board);

        expect(violations.size).toBe(0);
    });
});

describe("relations", () => {
    test("accepts a valid same relation", () => {
        const board = EMPTY_BOARD();

        board[0][0] = "x";
        board[0][1] = "x";

        const relations = [
            {
                row: 0,
                col: 0,
                direction: "horizontal",
                type: "same"
            }
        ];

        const violations =
            findViolations(board, relations);

        expect(violations.size).toBe(0);
    });

    test("detects an invalid same relation", () => {
        const board = EMPTY_BOARD();

        board[0][0] = "x";
        board[0][1] = "y";

        const relations = [
            {
                row: 0,
                col: 0,
                direction: "horizontal",
                type: "same"
            }
        ];

        const violations =
            findViolations(board, relations);

        expect(violations.has("0,0")).toBe(true);
        expect(violations.has("0,1")).toBe(true);
    });

    test("accepts a valid different relation", () => {
        const board = EMPTY_BOARD();

        board[1][3] = "x";
        board[2][3] = "y";

        const relations = [
            {
                row: 1,
                col: 3,
                direction: "vertical",
                type: "different"
            }
        ];

        const violations =
            findViolations(board, relations);

        expect(violations.size).toBe(0);
    });

    test("detects an invalid different relation", () => {
        const board = EMPTY_BOARD();

        board[1][3] = "x";
        board[2][3] = "x";

        const relations = [
            {
                row: 1,
                col: 3,
                direction: "vertical",
                type: "different"
            }
        ];

        const violations =
            findViolations(board, relations);

        expect(violations.has("1,3")).toBe(true);
        expect(violations.has("2,3")).toBe(true);
    });

    test("does not flag a relation when one cell is empty", () => {
        const board = EMPTY_BOARD();

        board[0][0] = "x";

        const relations = [
            {
                row: 0,
                col: 0,
                direction: "horizontal",
                type: "same"
            }
        ];

        const violations =
            findViolations(board, relations);

        expect(violations.size).toBe(0);
    });
});

describe("isBoardComplete", () => {
    test("returns false for an incomplete board", () => {
        const board = copyBoard(VALID_SOLUTION);

        board[3][2] = null;

        expect(
            isBoardComplete(board)
        ).toBe(false);
    });

    test("returns true for a completely filled board", () => {
        expect(
            isBoardComplete(VALID_SOLUTION)
        ).toBe(true);
    });
});

describe("isBoardSolved", () => {
    test("returns true for a valid completed board", () => {
        expect(
            isBoardSolved(VALID_SOLUTION)
        ).toBe(true);
    });

    test("returns false when the board is incomplete", () => {
        const board = copyBoard(VALID_SOLUTION);

        board[0][0] = null;

        expect(
            isBoardSolved(board)
        ).toBe(false);
    });

    test("returns false when the completed board violates a rule", () => {
        const board = copyBoard(VALID_SOLUTION);

        board[0] = [
            "x",
            "x",
            "x",
            "y",
            "y",
            "y"
        ];

        expect(
            isBoardSolved(board)
        ).toBe(false);
    });

    test("includes relation rules when checking solved state", () => {
        const relations = [
            {
                row: 0,
                col: 0,
                direction: "horizontal",
                type: "same"
            }
        ];

        /*
         * VALID_SOLUTION begins with Y, X,
         * so this 'same' relation is intentionally invalid.
         */
        expect(
            isBoardSolved(
                VALID_SOLUTION,
                relations
            )
        ).toBe(false);
    });
});