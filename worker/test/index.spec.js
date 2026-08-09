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
			"http://example.com/api/leaderboard?puzzle=2025-01-02"
		);

		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(200);

		const body = await response.json();

		expect(body.puzzleId).toBe("2025-01-02");
		expect(body.entries).toEqual([]);
	});

	test("submits a leaderboard entry", async () => {
		const request = new Request(
			"http://example.com/api/leaderboard", {
				method: "POST",

				headers: {
					"Content-Type": "application/json"
				},

				body: JSON.stringify({
					puzzleId: "2026-08-08",
					playerName: "Sandra",
					timeMs: 90000,
					hintsUsed: 1,
					submissionId: "test-submission-1",
					deviceId: "device-submit-1"
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
				hintsUsed: 3,
				submissionId: "ranking-three-hints",
				deviceId: "device-ranking-3"
			},
			{
				playerName: "NoHints",
				timeMs: 90000,
				hintsUsed: 0,
				submissionId: "ranking-no-hints",
				deviceId: "device-ranking-0"
			},
			{
				playerName: "OneHint",
				timeMs: 90000,
				hintsUsed: 1,
				submissionId: "ranking-one-hint",
				deviceId: "device-ranking-1"
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
						puzzleId: "2025-01-04",
						...entry
					})
				}
			);

			const ctx = createExecutionContext();

			const response = await worker.fetch(
				request,
				env,
				ctx
			);

			await waitOnExecutionContext(ctx);

			// POST creates an entry
			expect(response.status).toBe(201);
		}

		const request = new Request(
			"http://example.com/api/leaderboard?puzzle=2025-01-04"
		);

		const ctx = createExecutionContext();

		const response = await worker.fetch(
			request,
			env,
			ctx
		);

		await waitOnExecutionContext(ctx);

		// GET successfully returns the leaderboard
		expect(response.status).toBe(200);

		const body = await response.json();

		expect(
			body.entries.map(
				(entry) => entry.player_name
			)
		).toEqual([
			"NoHints",
			"OneHint",
			"ThreeHints"
		]);
	});

	test(
		"rejects a duplicate submission", async () => {
			const entry = {
				puzzleId: "2025-01-03",
				playerName: "Sandra",
				timeMs: 90000,
				hintsUsed: 0,
				submissionId: "duplicate-test",
				deviceId: "device-duplicate-1"
			};

			const createRequest = () => new Request("http://example.com/api/leaderboard", {
				method: "POST",

				headers: {
					"Content-Type": "application/json"
				},

				body: JSON.stringify(
					entry
				)
			});

			let ctx = createExecutionContext();
			const firstResponse = await worker.fetch(createRequest(), env, ctx);
			await waitOnExecutionContext(ctx);
			expect(firstResponse.status).toBe(201);

			ctx = createExecutionContext();
			const secondResponse = await worker.fetch(createRequest(), env, ctx);
			await waitOnExecutionContext(ctx);
			expect(secondResponse.status).toBe(409);
		}
	);

	test("rejects an impossible puzzle date", async () => {
		const request = new Request("http://example.com/api/leaderboard?puzzle=2026-99-99");
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(400);
	});

	test("rejects a future puzzle date", async () => {
		const request = new Request("http://example.com/api/leaderboard?puzzle=2999-01-01");
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);

		await waitOnExecutionContext(ctx);

		expect(response.status).toBe(400);
	});
});