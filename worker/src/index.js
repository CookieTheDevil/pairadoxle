export default {
    async fetch(request, env) {
        if (request.method === "OPTIONS") {
            return new Response(
                null, {
                    status: 204,
                    headers: {
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Headers": "Content-Type",
                        "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
                    }
                }
            );
        }
        
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

const result =
    await env.pairadoxle_db.prepare(`
        SELECT
            ROW_NUMBER() OVER (
                ORDER BY
                    time_ms ASC,
                    hints_used ASC,
                    created_at ASC
            ) AS rank,
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
        hintsUsed,
        submissionId
    } = validation.entry;

    try {
        await env.pairadoxle_db
            .prepare(`
                INSERT INTO leaderboard_entries (
                    puzzle_id,
                    player_name,
                    time_ms,
                    hints_used,
                    submission_id
                )
                VALUES (?, ?, ?, ?, ?)
            `).bind(puzzleId, playerName, timeMs, hintsUsed, submissionId).run();
    } catch (error) {
        if (String(error).includes("UNIQUE constraint failed")) {
            return jsonResponse(
                {
                    error: "This result has already been submitted."
                },
                409
            );
        }

        throw error;
    }

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
    const submissionId = body.submissionId;

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

    if ( typeof submissionId !== "string" ||
        submissionId.length < 1 || submissionId.length > 100
    ) {
        return {
            valid: false,
            error: "Invalid submission id."
        };
    }

    if (
        !Number.isInteger(timeMs) ||
        timeMs < 1000 ||
        timeMs > 24 * 60 * 60 * 1000
    ) {
        return {
            valid: false,
            error: "Invalid completion time."
        };
    }

    if (
        !Number.isInteger(hintsUsed) ||
        hintsUsed < 0 || hintsUsed > 36
    ) {
        return {
            valid: false,
            error: "Invalid hint count."
        };
    }

    return {
        valid: true,

        entry: {
            puzzleId,
            playerName,
            timeMs,
            hintsUsed,
            submissionId
        }
    };
}


function isValidPuzzleId(puzzleId) {
    if ( typeof puzzleId !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(puzzleId)) {
        return false;
    }

    const [year, month, day] = puzzleId.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    const isRealDate =
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day;

    if (!isRealDate) {
        return false;
    }

    const today =getTodayPuzzleId();
    return puzzleId <= today;
}

function getTodayPuzzleId() {
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/Oslo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    });

    const parts = formatter.formatToParts(new Date());
    const year = parts.find( (part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;

    return `${year}-${month}-${day}`;
}

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
        }
    });
}