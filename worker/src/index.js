export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (url.pathname === "/api/health") {
            return jsonResponse({
                ok: true
            });
        }

        if (
            url.pathname === "/api/leaderboard" &&
            request.method === "GET"
        ) {
            return getLeaderboard(
                url,
                env
            );
        }

        return jsonResponse(
            {
                error: "Not found"
            },
            404
        );
    }
};


async function getLeaderboard(
    url,
    env
) {
    const puzzleId =
        url.searchParams.get(
            "puzzle"
        );

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

    return jsonResponse({
        puzzleId,
        entries:
            result.results
    });
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