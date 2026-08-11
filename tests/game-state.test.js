import {
    describe,
    expect,
    test
} from "vitest";

import {
    GameState
} from "../game-state.js";

import {
    testPuzzles
} from "../puzzles/test-puzzles.js";

describe("GameState", () => {
    test("starts with the puzzle starting board", () => {
        const gameState =
            new GameState(testPuzzles.standard);

        expect(
            gameState.getBoard()
        ).toEqual(
            testPuzzles.standard.startingBoard
        );
    });

    test("returns the puzzle id", () => {
        const gameState =
            new GameState(testPuzzles.standard);

        expect(
            gameState.getPuzzleId()
        ).toBe("test-standard");
    });

    test("cycles an editable cell from empty to X", () => {
        const gameState =
            new GameState(testPuzzles.standard);

        gameState.cycleCell(0, 1);

        expect(
            gameState.getCell(0, 1)
        ).toBe("x");
    });

    test("cycles X to Y", () => {
        const gameState =
            new GameState(testPuzzles.standard);

        gameState.cycleCell(0, 1);
        gameState.cycleCell(0, 1);

        expect(
            gameState.getCell(0, 1)
        ).toBe("y");
    });

    test("cycles Y back to empty", () => {
        const gameState =
            new GameState(testPuzzles.standard);

        gameState.cycleCell(0, 1);
        gameState.cycleCell(0, 1);
        gameState.cycleCell(0, 1);

        expect(
            gameState.getCell(0, 1)
        ).toBe(null);
    });

    test("does not change a locked starting cell", () => {
        const gameState =
            new GameState(testPuzzles.standard);

        const before =
            gameState.getCell(0, 0);

        gameState.cycleCell(0, 0);

        expect(
            gameState.getCell(0, 0)
        ).toBe(before);
    });

    test("reports starting cells as locked", () => {
        const gameState =
            new GameState(testPuzzles.standard);

        expect(
            gameState.isLocked(0, 0)
        ).toBe(true);

        expect(
            gameState.isLocked(0, 1)
        ).toBe(false);
    });

    test("applies a hint to an editable cell", () => {
        const gameState =
            new GameState(testPuzzles.standard);

        const applied =
            gameState.applyHint(
                0,
                1,
                "x"
            );

        expect(applied).toBe(true);

        expect(
            gameState.getCell(0, 1)
        ).toBe("x");
    });

    test("does not apply a hint to a locked cell", () => {
        const gameState =
            new GameState(testPuzzles.standard);

        const before =
            gameState.getCell(0, 0);

        const applied =
            gameState.applyHint(
                0,
                0,
                "x"
            );

        expect(applied).toBe(false);

        expect(
            gameState.getCell(0, 0)
        ).toBe(before);
    });

    test("reset restores the original starting board", () => {
        const gameState =
            new GameState(testPuzzles.standard);

        gameState.cycleCell(0, 1);
        gameState.cycleCell(1, 0);
        gameState.applyHint(2, 0, "x");

        gameState.reset();

        expect(
            gameState.getBoard()
        ).toEqual(
            testPuzzles.standard.startingBoard
        );
    });

    test("getBoard returns a copy instead of internal state", () => {
        const gameState =
            new GameState(testPuzzles.standard);

        const board =
            gameState.getBoard();

        board[0][1] = "x";

        expect(
            gameState.getCell(0, 1)
        ).toBe(null);
    });

    test("getSolution returns a copy instead of internal state", () => {
        const gameState =
            new GameState(testPuzzles.standard);

        const solution =
            gameState.getSolution();

        solution[0][0] = "x";

        expect(
            gameState.getSolutionCell(0, 0)
        ).toBe("y");
    });

    test("restores a saved board", () => {
        const gameState =
            new GameState(testPuzzles.standard);

        const savedBoard =
            gameState.getBoard();

        savedBoard[0][1] = "x";
        savedBoard[0][2] = "y";

        const restored =
            gameState.setBoard(savedBoard);

        expect(restored).toBe(true);

        expect(
            gameState.getCell(0, 1)
        ).toBe("x");

        expect(
            gameState.getCell(0, 2)
        ).toBe("y");
    });

    test("rejects a saved board with the wrong dimensions", () => {
        const gameState =
            new GameState(testPuzzles.standard);

        const badBoard = [
            [null]
        ];

        const restored =
            gameState.setBoard(badBoard);

        expect(restored).toBe(false);
    });

    test("getRelations returns copies", () => {
        const gameState =
            new GameState(testPuzzles.standard);

        const relations =
            gameState.getRelations();

        relations[0].type = "different";

        expect(
            gameState.getRelations()[0].type
        ).toBe("same");
    });
});