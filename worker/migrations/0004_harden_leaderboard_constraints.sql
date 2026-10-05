-- Migration number: 0004 	 2026-10-05T14:52:13.161Z
CREATE TABLE leaderboard_entries_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    puzzle_id TEXT NOT NULL,

    player_name TEXT NOT NULL
        CHECK (
            length(player_name) BETWEEN 1 AND 20
        ),

    time_ms INTEGER NOT NULL
        CHECK (
            time_ms >= 5000
        ),

    hints_used INTEGER NOT NULL DEFAULT 0
        CHECK (
            hints_used >= 0
        ),

    created_at TEXT NOT NULL
        DEFAULT CURRENT_TIMESTAMP,

    submission_id TEXT
        CHECK (
            submission_id IS NULL
            OR length(submission_id) BETWEEN 1 AND 100
        ),

    device_id TEXT
        CHECK (
            device_id IS NULL
            OR length(device_id) BETWEEN 1 AND 100
        )
);

INSERT INTO leaderboard_entries_new (
    id,
    puzzle_id,
    player_name,
    time_ms,
    hints_used,
    created_at,
    submission_id,
    device_id
)
SELECT
    id,
    puzzle_id,
    player_name,
    time_ms,
    hints_used,
    created_at,
    submission_id,
    device_id
FROM leaderboard_entries;

DROP TABLE leaderboard_entries;

ALTER TABLE leaderboard_entries_new
RENAME TO leaderboard_entries;

CREATE INDEX idx_leaderboard_ranking
ON leaderboard_entries (
    puzzle_id,
    time_ms,
    hints_used,
    created_at
);

CREATE UNIQUE INDEX idx_leaderboard_submission_id
ON leaderboard_entries (
    submission_id
);

CREATE UNIQUE INDEX idx_one_attempt_per_device
ON leaderboard_entries (
    puzzle_id,
    device_id
);

UPDATE sqlite_sequence
SET seq = (
    SELECT COALESCE(MAX(id), 0)
    FROM leaderboard_entries
)
WHERE name = 'leaderboard_entries';