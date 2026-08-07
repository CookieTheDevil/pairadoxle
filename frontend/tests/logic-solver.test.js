import {
    describe,
    expect,
    test
} from "vitest";

import {
    solveLogically,
    getLogicSolveSummary
} from "../logic-solver.js";

import {
    TEST_SOLUTION,
    testPuzzles
} from "../puzzles/test-puzzles.js";

describe("solveLogically", () => {
    test("solves a nearly completed puzzle using logic", () => {
        const puzzle = testPuzzles.nearlySolved;

        const result = solveLogically(
            puzzle.startingBoard,
            puzzle.relations
        );

        expect(result.solved).toBe(true); 
        expect(result.stuck).toBe(false); 
        expect(result.contradiction).toBe(false); 
        expect(result.board).toEqual(TEST_SOLUTION); 
    });

    test("gets stuck instead of guessing", () => {
        const board = Array.from({ length: 6 }, () =>
            Array(6).fill(null)
        );

        const result = solveLogically(board, []);

        expect(result.solved).toBe(false);
        expect(result.stuck).toBe(true);
        expect(result.contradiction).toBe(false);
        expect(result.steps.length).toBe(0);
    });

    test("detects a contradictory board", () => {
        const board = Array.from({ length: 6 }, () =>
            Array(6).fill(null)
        );

        board[0][0] = "x";
        board[0][1] = "x";
        board[0][2] = "x";

        const result = solveLogically(board, []);

        expect(result.solved).toBe(false);
        expect(result.contradiction).toBe(true);
    });

    test("returns solve metadata", () => {
        const puzzle = testPuzzles.nearlySolved;
        const result = solveLogically(puzzle.startingBoard, puzzle.relations);
        const summary = getLogicSolveSummary(result);

        expect(summary.solved).toBe(true);
        expect(summary.totalSteps).toBeGreaterThan(0);
        expect(Object.values(summary.ruleCounts)
            .reduce((total, count) => total + count, 0))
            .toBe(summary.totalSteps);
    });
});