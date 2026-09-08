import { spawnSync } from 'node:child_process';

// Keep the Sites preview build available while producing a standalone Worker.
const result = spawnSync(process.execPath, ['node_modules/vinext/dist/cli.js', 'build'], {
  stdio: 'inherit',
  env: { ...process.env, ASTRO_HOST: 'cloudflare' },
});
process.exit(result.status ?? 1);
