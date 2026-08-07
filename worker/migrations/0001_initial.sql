CREATE TABLE leaderboard_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    puzzle_id TEXT NOT NULL,
    player_name TEXT NOT NULL,
    time_ms INTEGER NOT NULL
        CHECK (time_ms > 0),
    hints_used INTEGER NOT NULL DEFAULT 0
        CHECK (hints_used >= 0),
    created_at TEXT NOT NULL
        DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leaderboard_ranking
ON leaderboard_entries (
    puzzle_id,
    time_ms,
    hints_used,
    created_at
);