import {
    CELL_STATES
} from "./game-constants.js";

import {
    findLogicalDeductions
} from "./hint-engine.js";

import {
    findViolations,
    isBoardSolved
} from "./validator.js";

//returns stats for how to solve a given puzzle
export function getLogicSolveSummary(result) {
    const ruleCounts = {};

    for (const step of result.steps) {
        const rule = step.rule ?? "unknown";
        ruleCounts[rule] = (ruleCounts[rule] ?? 0) + 1;
    }

    return {
        solved: result.solved,
        stuck: result.stuck,
        contradiction: result.contradiction,
        totalSteps: result.steps.length,
        ruleCounts
    };
}

function copyBoard(board) {
    return board.map((row) => [...row]);
}

function getDeductionConflict(deductions) {
    const valuesByCell = new Map();

    for (const deduction of deductions) {
        const key = `${deduction.row},${deduction.col}`;

        if (!valuesByCell.has(key)) {
            valuesByCell.set(
                key,
                deduction.value
            );

            continue;
        }

        const existingValue =  valuesByCell.get(key);

        if (existingValue !== deduction.value) {
            return {
                row: deduction.row,
                col: deduction.col,
                firstValue: existingValue,
                secondValue: deduction.value
            };
        }
    }

    return null;
}

function chooseDeduction(deductions) {
    if (deductions.length === 0) {
        return null;
    }

    /*
     * Deterministic order makes tests and
     * difficulty scoring reproducible.
     */
    return [...deductions].sort(
        (a, b) =>
            a.row - b.row ||
            a.col - b.col ||
            a.value.localeCompare(b.value)
    )[0];
}

export function solveLogically(startingBoard, relations = []) {
    const board = copyBoard(startingBoard);
    const steps = [];

    while (true) {
        const violations = findViolations(board, relations);

        if (violations.size > 0) {
            return {
                solved: false,
                stuck: false,
                contradiction: true,
                board,
                steps,
                reason:
                    "The board contains a rule violation."
            };
        }

        if (isBoardSolved(board, relations)) {
            return {
                solved: true,
                stuck: false,
                contradiction: false,
                board,
                steps,
                reason: null
            };
        }

        const deductions = findLogicalDeductions(board, relations);
        const conflict = getDeductionConflict(deductions);

        if (conflict) {
            return {
                solved: false,
                stuck: false,
                contradiction: true,
                board,
                steps,
                reason:
                    "Logical rules produced conflicting deductions.",
                conflict
            };
        }

        const availableDeductions = deductions.filter(
            (deduction) => 
                board[deduction.row][deduction.col] === CELL_STATES.EMPTY
        );

        const deduction = chooseDeduction(availableDeductions);

        if (!deduction) {
            return {
                solved: false,
                stuck: true,
                contradiction: false,
                board,
                steps,
                reason:
                    "No further logical deduction is available."
            };
        }

        board[deduction.row][deduction.col] = deduction.value;

        steps.push( {...deduction, step: steps.length + 1} );
    }
}