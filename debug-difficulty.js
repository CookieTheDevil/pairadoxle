import {
    generatePuzzle
} from "./generator.js";

for (let i = 0; i < 50; i++) {
    const puzzle =
        generatePuzzle(`sample-${i}`);

    console.log({
        id: puzzle.id,
        score: puzzle.difficulty.score,
        level: puzzle.difficulty.level,
        relations: puzzle.relations.length,
        startingClues:
            puzzle.startingBoard
                .flat()
                .filter(
                    (cell) => cell !== null
                )
                .length
    });
}