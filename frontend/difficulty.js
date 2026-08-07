const RULE_WEIGHTS = {
    relation: 1,
    balance: 1,
    "adjacent-pair": 1,
    "separated-pair": 2,
    "equal-edge": 3,
    "unequal-edge": 3
};

export function calculateDifficulty(result) {
    if (!result.solved) {
        return {
            score: Infinity,
            level: "unsolved"
        };
    }

    let score = 0;

    for (const step of result.steps) {
        score += RULE_WEIGHTS[step.rule] ?? 1;
    }

    let level;

    if (score <= 20) {
        level = "easy";
    } else if (score <= 40) {
        level = "medium";
    } else {
        level = "hard";
    }

    return { score, level };
}