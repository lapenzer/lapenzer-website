import { spawnSync } from "node:child_process";
const result = spawnSync(process.execPath, ["node_modules/next/dist/bin/next", "build"], { stdio: "inherit", env: { ...process.env, LAPENZER_STATIC_PREVIEW: "1" } });
process.exit(result.status ?? 1);
