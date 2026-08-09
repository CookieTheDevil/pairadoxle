ALTER TABLE leaderboard_entries
ADD COLUMN device_id TEXT;

CREATE UNIQUE INDEX
idx_one_attempt_per_device
ON leaderboard_entries (
    puzzle_id,
    device_id
);