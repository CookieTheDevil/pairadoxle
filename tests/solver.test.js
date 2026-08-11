import {
    describe,
    expect,
    test
} from "vitest";

import {
    solveBoard,
    countSolutions
} from "../solver.js";

import {
    TEST_SOLUTION,
    testPuzzles
} from "../puzzles/test-puzzles.js";

describe("solveBoard", () => {
    test("solves a nearly completed puzzle", () => {
        const puzzle =
            testPuzzles.nearlySolved;

        const result = solveBoard(
            puzzle.startingBoard,
            puzzle.relations
        );

        expect(result).toEqual(
            TEST_SOLUTION
        );
    });

    test("returns a valid solution for the standard puzzle", () => {
        const puzzle =
            testPuzzles.standard;

        const result = solveBoard(
            puzzle.startingBoard,
            puzzle.relations
        );

        expect(result).not.toBeNull();
    });
});

describe("countSolutions", () => {
    test("a completed valid board has one solution", () => {
        expect(
            countSolutions(
                TEST_SOLUTION,
                [],
                2
            )
        ).toBe(1);
    });

    test("the standard test puzzle has multiple solutions", () => {
        const puzzle =
            testPuzzles.standard;

        expect(
            countSolutions(
                puzzle.startingBoard,
                puzzle.relations,
                2
            )
        ).toBe(2);
    });

    test("a nearly solved puzzle has a unique solution", () => {
        const puzzle =
            testPuzzles.nearlySolved;

        expect(
            countSolutions(
                puzzle.startingBoard,
                puzzle.relations,
                2
            )
        ).toBe(1);
    });
});