import {
    describe,
    expect,
    test
} from "vitest";

import {
    getDailyPuzzleId,
    formatPuzzleDate
} from "../daily-puzzle.js";

describe("getDailyPuzzleId", () => {
    test("uses the calendar date in Oslo", () => {
        const date = new Date("2026-08-08T12:00:00Z");
        expect(getDailyPuzzleId(date)).toBe("2026-08-08");
    });

    test("rolls over at midnight in Oslo", () => {
        //Oslo is UTC+2 in August.
        const beforeMidnight = new Date("2026-08-07T21:59:59Z");
        const afterMidnight = new Date("2026-08-07T22:00:00Z");

        expect(getDailyPuzzleId(beforeMidnight)).toBe("2026-08-07");
        expect(getDailyPuzzleId(afterMidnight)).toBe("2026-08-08");
    });
}); 

describe("formatPuzzleDate", () => {
    test("formats a puzzle id for display",() => {
        const formatted = formatPuzzleDate("2026-08-08", "nb-NO");

        expect(formatted).toContain("2026");
        expect(formatted).toContain("august");
    } );
});