import {
    describe,
    expect,
    test
} from "vitest";

import {
    generateSolution
} from "../generator.js";

import {
    isBoardComplete,
    isBoardSolved
} from "../validator.js";

describe("generateSolution", () => {
    test("generates a complete board", () => {
        const board = generateSolution();
        expect( isBoardComplete(board) ).toBe(true);
    });

    test("generates a valid solved board", () => {
        const board = generateSolution();
        expect( isBoardSolved(board) ).toBe(true);
    });

    test("generates several valid boards", () => {
        for (let i = 0; i < 25; i++) {
            const board = generateSolution();

            expect( isBoardSolved(board) ).toBe(true);
        }
    });
});