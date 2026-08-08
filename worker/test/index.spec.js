import {
    describe,
    expect,
    test
} from "vitest";

import {
    env,
    createExecutionContext,
    waitOnExecutionContext
} from "cloudflare:test";

import worker from "../src/index.js";

describe("Pairadoxle Worker", () => {
    test("health endpoint returns ok", async () => {
        const request = new Request("http://example.com/api/health");

        const ctx = createExecutionContext();

        const response = await worker.fetch(
            request,
            env,
            ctx
        );

        await waitOnExecutionContext(ctx);

        expect(response.status).toBe(200);

        await expect(response.json()).resolves.toEqual({ok: true});
    });

	test("returns an empty leaderboard", async () => {
		const request = new Request(
			"http://example.com/api/leaderboard?puzzle=2026-08-08"
		);

		const ctx = createExecutionContext();

		const response = await worker.fetch(request, env, ctx);

		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(200);

		const body = await response.json();

		expect(body.puzzleId).toBe("2026-08-08");

		expect(body.entries).toEqual([]);
	});

	test("submits a leaderboard entry", async () => {
		const request = new Request(
			"http://example.com/api/leaderboard", {
				method: "POST",

				headers: {
					"Content-Type": "application/json"
				},

				body:
					JSON.stringify({
					puzzleId: "2026-08-08",
					playerName: "Sandra",
					timeMs: 90000,
					hintsUsed: 1
				})
			}
		);

		const ctx = createExecutionContext();

		const response = await worker.fetch(request, env, ctx);

		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(201);

		const body = await response.json();

		expect(body.ok).toBe(true);

		expect(body.entry).toEqual({
			puzzleId: "2026-08-08",
			playerName: "Sandra",
			timeMs: 90000,
			hintsUsed: 1
		});
	});

	test("rejects an invalid leaderboard entry", async () => {
		const request = new Request(
			"http://example.com/api/leaderboard", {
				method: "POST",

				headers: {
					"Content-Type": "application/json"
				},

				body: JSON.stringify({
					puzzleId: "bad-id",
					playerName: "",
					timeMs: -1,
					hintsUsed: -2
				})
			}
		);

		const ctx = createExecutionContext();

		const response = await worker.fetch(request, env, ctx);

		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(400);
	});

	test("ranks equal times by fewer hints first", async () => {
		const entries = [
			{
				playerName: "ThreeHints",
				timeMs: 90000,
				hintsUsed: 3
			},
			{
				playerName: "NoHints",
				timeMs: 90000,
				hintsUsed: 0
			},
			{
				playerName: "OneHint",
				timeMs: 90000,
				hintsUsed: 1
			}
		];

		for (const entry of entries) {
			const request = new Request(
				"http://example.com/api/leaderboard",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({
						puzzleId: "2026-08-09",
						...entry
					})
				}
			);

			const ctx = createExecutionContext();

			await worker.fetch(
				request,
				env,
				ctx
			);

			await waitOnExecutionContext(ctx);
		}

		const request = new Request(
			"http://example.com/api/leaderboard?puzzle=2026-08-09"
		);

		const ctx = createExecutionContext();

		const response = await worker.fetch(request, env, ctx);

		await waitOnExecutionContext(ctx);

		const body = await response.json();

		expect(body.entries.map((entry) => entry.player_name)).toEqual([
			"NoHints",
			"OneHint",
			"ThreeHints"
		]);
	});
});