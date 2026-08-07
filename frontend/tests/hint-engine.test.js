import {
    describe,
    expect,
    test
} from "vitest";


import {
    findHint,
    findLogicalDeductions
} from "../hint-engine.js";

const SOLUTION = [
    ["y", "x", "y", "x", "x", "y"],
    ["x", "y", "x", "y", "y", "x"],
    ["x", "y", "y", "x", "x", "y"],
    ["y", "x", "x", "y", "x", "y"],
    ["x", "y", "x", "y", "y", "x"],
    ["y", "x", "y", "x", "y", "x"]
];

function emptyBoard() {
    return Array.from(
        { length: 6 },
        () => Array(6).fill(null)
    );
}

describe("findHint", () => {
    test("corrects an incorrect cell before giving a deduction", () => {
        const board = emptyBoard();

        // Wrong: solution[0][0] is "y"
        board[0][0] = "x";

        // Also create a valid deduction elsewhere
        board[1][0] = "x";
        board[1][2] = "x";

        const hint = findHint(
            board,
            SOLUTION,
            []
        );

        expect(hint.type).toBe("incorrect");
        expect(hint.row).toBe(0);
        expect(hint.col).toBe(0);
        expect(hint.value).toBe("y");
    });

    test("uses the balance rule when possible", () => {
        const board = emptyBoard();

        board[0] = [
            "y",
            null,
            "y",
            null,
            null,
            "y"
        ];

        const hint = findHint(
            board,
            SOLUTION,
            []
        );

        expect(hint.type).toBe("deduced");
        expect(hint.value).toBe("x");
        expect(hint.row).toBe(0);
    });

    test("uses an adjacent pair deduction", () => {
        const board = emptyBoard();

        board[0][3] = "x";
        board[0][4] = "x";

        const hint = findHint(
            board,
            SOLUTION,
            []
        );

        expect(hint.type).toBe("deduced");
        expect(hint.value).toBe("y");
        expect(hint.row).toBe(0);
        expect([2, 5]).toContain(hint.col);
    });

    test("uses a separated pair deduction", () => {
        const board = emptyBoard();

        board[0][0] = "y";
        board[0][2] = "y";

        const hint = findHint(
            board,
            SOLUTION,
            []
        );

        expect(hint.type).toBe("deduced");
        expect(hint.row).toBe(0);
        expect(hint.col).toBe(1);
        expect(hint.value).toBe("x");
    });

    test("uses a same relation deduction", () => {
        const board = emptyBoard();

        board[0][3] = "x";

        const relations = [
            {
                row: 0,
                col: 3,
                direction: "horizontal",
                type: "same"
            }
        ];

        const hint = findHint(
            board,
            SOLUTION,
            relations
        );

        expect(hint.type).toBe("deduced");
        expect(hint.row).toBe(0);
        expect(hint.col).toBe(4);
        expect(hint.value).toBe("x");
    });

    test("uses a different relation deduction", () => {
        const board = emptyBoard();

        board[0][0] = "y";

        const relations = [
            {
                row: 0,
                col: 0,
                direction: "horizontal",
                type: "different"
            }
        ];

        const hint = findHint(
            board,
            SOLUTION,
            relations
        );

        expect(hint.type).toBe("deduced");
        expect(hint.row).toBe(0);
        expect(hint.col).toBe(1);
        expect(hint.value).toBe("x");
    });

    test("falls back to an unresolved cell when nothing is deducible", () => {
        const board = emptyBoard();

        const hint = findHint(
            board,
            SOLUTION,
            []
        );

        expect(hint.type).toBe("fallback");
        expect(hint.value).toBe(
            SOLUTION[hint.row][hint.col]
        );
    });

    test("uses the equal-edge rule", () => {
        const board = emptyBoard();

        board[0][0] = "y";
        board[0][5] = "y";

        const hint = findHint(
            board,
            SOLUTION,
            []
        );

        expect(hint.type).toBe("deduced");
        expect(hint.row).toBe(0);
        expect([1, 4]).toContain(hint.col);
        expect(hint.value).toBe("x");
    });

    test("uses the unequal-edge rule", () => {
        const board = emptyBoard();

        // Solution row 2:
        // X Y Y X X Y
        //
        // Give the engine:
        // X _ _ _ X _
        //
        // Therefore the final cell must be Y.
        board[2][0] = "x";
        board[2][4] = "x";

        const hint = findHint(
            board,
            SOLUTION,
            []
        );

        expect(hint.type).toBe("deduced");
        expect(hint.row).toBe(2);
        expect(hint.col).toBe(5);
        expect(hint.value).toBe("y");
    });

    test("findLogicalDeductions works without a solution", () => {
        const board = emptyBoard();

        board[0][0] = "y";
        board[0][2] = "y";

        const deductions = findLogicalDeductions(board, []);

        expect(
            deductions.some(
                (hint) =>
                    hint.row === 0 &&
                    hint.col === 1 &&
                    hint.value === "x"
            )
        ).toBe(true);
    });

    test("logical deductions identify their rule", () => {
        const board = emptyBoard();

        board[0][0] = "y";
        board[0][2] = "y";

        const deductions =
            findLogicalDeductions(
                board,
                []
            );

        const deduction =
            deductions.find(
                (item) =>
                    item.row === 0 &&
                    item.col === 1
            );

        expect(deduction.rule)
            .toBe("separated-pair");
    });
});