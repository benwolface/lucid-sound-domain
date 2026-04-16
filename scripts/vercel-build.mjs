import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';

const repoRoot = resolve(import.meta.dirname, '..');
const webDir = resolve(repoRoot, 'apps/web');
const webDistDir = resolve(webDir, 'dist');
const rootDistDir = resolve(repoRoot, 'dist');

execSync('npm run build', {
  cwd: webDir,
  stdio: 'inherit',
});

if (!existsSync(webDistDir)) {
  throw new Error(`Expected build output at ${webDistDir}`);
}

rmSync(rootDistDir, { force: true, recursive: true });
mkdirSync(rootDistDir, { recursive: true });
cpSync(webDistDir, rootDistDir, { recursive: true });
