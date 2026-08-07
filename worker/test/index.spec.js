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
});