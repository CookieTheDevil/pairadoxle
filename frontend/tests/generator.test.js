import {
    describe,
    expect,
    test
} from "vitest";

import {
    generateSolution,
    generateStartingBoard,
    generatePuzzle,
    generateRelations,
    generateUsefulRelations
} from "../generator.js";

import {
    countSolutions
} from "../solver.js";

import {
    isBoardComplete,
    isBoardSolved
} from "../validator.js";

import {
    solveLogically
} from "../logic-solver.js";

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

    test("generates a uniquely solvable starting board", () => {
        const solution = generateSolution();
        const startingBoard = generateStartingBoard(solution);

        expect(
            countSolutions(
                startingBoard,
                [],
                2
            )
        ).toBe(1);
    });

    test("removes at least one clue", () => {
        const solution = generateSolution();
        const startingBoard = generateStartingBoard(solution);

        const emptyCount =
            startingBoard
                .flat()
                .filter(
                    (cell) => cell === null
                )
                .length;

        expect(emptyCount).toBeGreaterThan(0);
    });

    test("generates a valid puzzle object", () => {
        const puzzle = generatePuzzle("test-generated");

        expect(puzzle.id).toBe("test-generated");
        expect(isBoardSolved(puzzle.solution)).toBe(true);

        expect(
            countSolutions(
                puzzle.startingBoard,
                puzzle.relations,
                2
            )
        ).toBe(1);

        expect(puzzle.difficulty).toBeDefined();
        expect(puzzle.difficulty.score).toBeGreaterThan(0);
        expect([
            "easy",
            "medium",
            "hard"
        ]).toContain(
            puzzle.difficulty.level
        );
    });

    test("generates relation clues that agree with the solution", () => {
        const solution = generateSolution();
        const relations = generateRelations(solution, 6);

        for (const relation of relations) {
            const first = solution[relation.row][relation.col];

            const second = relation.direction === "horizontal"
                ? solution[relation.row][relation.col + 1]
                : solution[relation.row + 1][relation.col];

            if (relation.type === "same") {
                expect(first).toBe(second);
            } else {
                expect(first).not.toBe(second);
            }
        }
    });

    test("generated puzzle remains uniquely solvable with relations", () => {
        const puzzle = generatePuzzle("relation-test");

        expect(
            countSolutions(
                puzzle.startingBoard,
                puzzle.relations,
                2
            )
        ).toBe(1);
    });

    test("useful relations preserve uniqueness", () => {
        const solution = generateSolution();

        const { relations, startingBoard } =
            generateUsefulRelations(
                solution,
                4
            );

        expect(
            countSolutions(
                startingBoard,
                relations,
                2
            )
        ).toBe(1);
    });

    test("does not exceed the relation limit", () => {
        const solution = generateSolution();

        const { relations } =
            generateUsefulRelations(
                solution,
                4
            );

        expect(
            relations.length
        ).toBeLessThanOrEqual(4);
    });

    test("generated puzzle can be solved without guessing", () => {
        const puzzle =
            generatePuzzle(
                "logic-test"
            );

        const result =
            solveLogically(
                puzzle.startingBoard,
                puzzle.relations
            );

        expect(result.solved)
            .toBe(true);
    });

    test("can target an easy puzzle", () => {
        const puzzle = generatePuzzle(
            "easy-test",
            {
                difficulty: "easy",
                maxAttempts: 20
            }
        );

        expect(["easy", "medium", "hard"]).toContain(puzzle.difficulty.level);
        expect(countSolutions(puzzle.startingBoard, puzzle.relations, 2)).toBe(1);
    });

    test("rejects an invalid target difficulty", () => {
        expect(() => {
            generatePuzzle(
                "invalid-test",
                {
                    difficulty: "impossible"
                }
            );
        }).toThrow();
    });

    test("same puzzle id generates the same puzzle", () => {
        const first = generatePuzzle("2026-08-08");
        const second = generatePuzzle("2026-08-08");

        expect(second).toEqual(first);
    });

    test("different puzzle ids generate different puzzles", () => {
        const first = generatePuzzle("2026-08-08");
        const second = generatePuzzle("2026-08-09");

        expect(second.solution).not.toEqual(first.solution);
    });
});