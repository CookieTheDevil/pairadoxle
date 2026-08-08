const API_BASE_URL = "https://api.sandrakubosch.no";

export async function fetchLeaderboard(puzzleId) {
    const url = new URL("/api/leaderboard", API_BASE_URL);

    url.searchParams.set("puzzle", puzzleId);

    const response = await fetch(url);

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.error ||
            "Could not load leaderboard."
        );
    }

    return data;
}


export async function submitScore({
    puzzleId,
    playerName,
    timeMs,
    hintsUsed,
    submissionId
}) {
    const response = await fetch(
        `${API_BASE_URL}/api/leaderboard`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                puzzleId,
                playerName,
                timeMs,
                hintsUsed,
                submissionId
            })
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Could not submit score.");
    }

    return data;
}