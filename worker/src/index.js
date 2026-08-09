const ALLOWED_ORIGINS = new Set([
    "https://sandrakubosch.no",
    "https://www.sandrakubosch.no",
    "http://localhost:5500",
    "http://127.0.0.1:5500"
]);

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (request.method === "OPTIONS") {
            const origin = request.headers.get("Origin");

            if (!ALLOWED_ORIGINS.has(origin)) {
                return new Response(null, {
                    status: 403
                });
            }

            return new Response(null, {
                status: 204,
                headers: corsHeaders(request)
            });
        }

        if (url.pathname === "/api/health") {
            return jsonResponse(
                { ok: true },
                200,
                request
            );
        }

        if (url.pathname === "/api/leaderboard") {
            if (request.method === "GET") {
                return getLeaderboard(url, env, request);
            }

            if (request.method === "POST") {
                return submitLeaderboardEntry(request, env);
            }
        }

        return jsonResponse(
            { error: "Not found" },
            404,
            request
        );
    }
};

function corsHeaders(request) {
    const origin = request.headers.get("Origin");

    if (!ALLOWED_ORIGINS.has(origin)) {
        return {};
    }

    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Vary": "Origin"
    };
}


async function getLeaderboard(url, env, request) {
    const puzzleId = url.searchParams.get("puzzle");

    if (!isValidPuzzleId(puzzleId)) {
        return jsonResponse(
            {
                error:
                    "Invalid puzzle id."
            },
            400,
            request
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

    return jsonResponse(
        {
            puzzleId,
            entries: result.results
        },
        200,
        request
    );
}


async function submitLeaderboardEntry(request, env) {
    let body;

    try {
        body = await request.json();
    } catch {
        return jsonResponse(
            {
                error: "Request body must be valid JSON."
            },
            400,
            request
        );
    }

    const validation = validateLeaderboardEntry(body);

    if (!validation.valid) {
        return jsonResponse(
            {
                error: validation.error
            },
            400,
            request
        );
    }

    const {
        puzzleId,
        playerName,
        timeMs,
        hintsUsed,
        submissionId,
        deviceId
    } = validation.entry;

    try {
        await env.pairadoxle_db
            .prepare(`
                INSERT INTO leaderboard_entries (
                    puzzle_id,
                    player_name,
                    time_ms,
                    hints_used,
                    submission_id,
                    device_id
                )
                VALUES (?, ?, ?, ?, ?, ?)
            `).bind(puzzleId, playerName, timeMs, hintsUsed, submissionId, deviceId).run();
    } catch (error) {
        const errorMessage = String(error);

        if (
            errorMessage.includes(
                "leaderboard_entries.puzzle_id, leaderboard_entries.device_id"
            )
        ) {
            return jsonResponse(
                {
                    error: "You have already submitted a score for today's puzzle."
                },
                409,
                request
            );
        }

        if (
            errorMessage.includes("leaderboard_entries.submission_id")
        ) {
            return jsonResponse(
                {
                    error: "This result has already been submitted."
                },
                409,
                request
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
        201,
        request
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
    const deviceId = body.deviceId; 

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
        typeof deviceId !== "string" ||
        deviceId.length < 1 ||
        deviceId.length > 100
    ) {
        return {
            valid: false,
            error: "Invalid device id."
        }
    }

    return {
        valid: true,

        entry: {
            puzzleId,
            playerName,
            timeMs,
            hintsUsed,
            submissionId,
            deviceId
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

function jsonResponse(
    data,
    status = 200,
    request
) {
    return new Response(
        JSON.stringify(data),
        {
            status,
            headers: {
                "Content-Type": "application/json",
                ...corsHeaders(request)
            }
        }
    );
}