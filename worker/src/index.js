export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (url.pathname === "/api/health") {
            return jsonResponse({
                ok: true
            });
        }

        if (url.pathname === "/api/leaderboard") {
            if (request.method === "GET") {
                return getLeaderboard(url, env);
            }

            if (request.method === "POST") {
                return submitLeaderboardEntry(request, env);
            }
        }

        return jsonResponse(
            {
                error: "Not found"
            },
            404
        );
    }
};


async function getLeaderboard(url, env) {
    const puzzleId = url.searchParams.get("puzzle");

    if (!isValidPuzzleId(puzzleId)) {
        return jsonResponse(
            {
                error:
                    "Invalid puzzle id."
            },
            400
        );
    }

    const result = await env.pairadoxle_db.prepare(`
        SELECT
            player_name,
            time_ms,
            hints_used,
            created_at
        FROM leaderboard_entries
        WHERE puzzle_id = ?
        ORDER BY
            time_ms ASC,
            hints_used ASC,
            created_at ASC
        LIMIT 50
    `).bind(puzzleId).all();

    return jsonResponse({puzzleId, entries: result.results});
}


async function submitLeaderboardEntry(request, env) {
    let body;

    try {
        body = await request.json();
    } catch {
        return jsonResponse(
            {
                error:
                    "Request body must be valid JSON."
            },
            400
        );
    }

    const validation = validateLeaderboardEntry(body);

    if (!validation.valid) {
        return jsonResponse(
            {
                error:
                    validation.error
            },
            400
        );
    }

    const {
        puzzleId,
        playerName,
        timeMs,
        hintsUsed
    } = validation.entry;

    await env.pairadoxle_db.prepare(`
        INSERT INTO leaderboard_entries (
            puzzle_id,
            player_name,
            time_ms,
            hints_used
        )
        VALUES (?, ?, ?, ?)
    `).bind(puzzleId, playerName, timeMs, hintsUsed).run();

    return jsonResponse(
        {
            ok: true,
            entry: {
                puzzleId,
                playerName,
                timeMs,
                hintsUsed
            }
        },
        201
    );
}


function validateLeaderboardEntry(body) {
    if (
        body === null ||
        typeof body !== "object" ||
        Array.isArray(body)
    ) {
        return {
            valid: false,
            error: "Invalid request body."
        };
    }

    const puzzleId = body.puzzleId;
    const playerName = typeof body.playerName === "string" ? body.playerName.trim() : "";
    const timeMs = body.timeMs;
    const hintsUsed = body.hintsUsed;

    if (!isValidPuzzleId(puzzleId)) {
        return {
            valid: false,
            error: "Invalid puzzle id."
        };
    }

    if (playerName.length < 1 || playerName.length > 20) {
        return {
            valid: false,
            error:
                "Player name must be between 1 and 20 characters."
        };
    }

    if (!Number.isInteger(timeMs) || timeMs <= 0) {
        return {
            valid: false,
            error:
                "Time must be a positive integer."
        };
    }

    if (!Number.isInteger(hintsUsed) || hintsUsed < 0) {
        return {
            valid: false,
            error:
                "Hints used must be a non-negative integer."
        };
    }

    return {
        valid: true,

        entry: {
            puzzleId,
            playerName,
            timeMs,
            hintsUsed
        }
    };
}


function isValidPuzzleId(puzzleId) {
    if (typeof puzzleId !== "string") {
        return false;
    }

    return /^\d{4}-\d{2}-\d{2}$/.test(puzzleId);
}


function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status, headers: { "Content-Type": "application/json" }
    });
}