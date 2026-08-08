import {
    applyD1Migrations,
    env
} from "cloudflare:test";


await applyD1Migrations(
    env.pairadoxle_db,
    env.TEST_MIGRATIONS
);