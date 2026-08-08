ALTER TABLE leaderboard_entries
ADD COLUMN submission_id TEXT;

CREATE UNIQUE INDEX idx_leaderboard_submission_id
ON leaderboard_entries (submission_id);