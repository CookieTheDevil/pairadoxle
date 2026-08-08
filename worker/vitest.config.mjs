import path from "node:path";

import {
    defineWorkersConfig,
    readD1Migrations
} from "@cloudflare/vitest-pool-workers/config";


export default defineWorkersConfig(
    async () => {
        const migrationsPath =
            path.join(
                process.cwd(),
                "migrations"
            );

        const migrations =
            await readD1Migrations(
                migrationsPath
            );

        return {
            test: {
                setupFiles: [
                    "./test/apply-migrations.js"
                ],

                poolOptions: {
                    workers: {
                        wrangler: {
                            configPath:
                                "./wrangler.jsonc"
                        },

                        miniflare: {
                            bindings: {
                                TEST_MIGRATIONS:
                                    migrations
                            }
                        }
                    }
                }
            }
        };
    }
);