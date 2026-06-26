#!/usr/bin/env node
/**
 * blog-publish.mjs — Publish blog content to a separate `blog/*` branch
 *
 * Usage:
 *   node scripts/blog-publish.mjs "My Blog Title"
 *   # or auto-detect title from latest changed file:
 *   node scripts/blog-publish.mjs
 *
 * This script:
 *   1. Detects uncommitted blog changes in src/content/blog/
 *   2. Creates a new branch blog/<title-slug>
 *   3. Commits only blog files to that branch
 *   4. Pushes to GitHub
 *   5. Switches back to your original branch
 *   6. Prints the PR link
 */

import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { readdirSync } from 'node:fs';
import path from 'node:path';

const BLOG_DIR = 'src/content/blog';
const IMAGES_DIR = 'public/images/blog';

function run(cmd, opts = {}) {
  return execSync(cmd, { encoding: 'utf-8', stdio: opts.silent ? 'pipe' : 'inherit', ...opts });
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^$/, 'untitled');
}

function getLatestFile(dir) {
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir).filter(f => f.endsWith('.mdoc'));
  if (files.length === 0) return null;
  return files.sort().reverse()[0] || null;
}

function extractTitle(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const match = content.match(/^title:\s*(.+)/m);
    return match ? match[1].replace(/^["']|["']$/g, '') : null;
  } catch {
    return null;
  }
}

// ── Main ────────────────────────────────────────────────────────────

console.log('\n\x1b[34m📝 Blog Publisher\x1b[0m\n');

// 1. Check for uncommitted blog changes
const statusResult = run('git status --short src/content/blog/', { silent: true }).trim();
const hasChanges = statusResult.length > 0;

if (!hasChanges) {
  console.log('\x1b[33mNo uncommitted blog changes found.\x1b[0m');
  console.log('Write a blog post via Keystatic first (http://localhost:4321/keystatic),');
  console.log('then run this script again.\n');
  process.exit(0);
}

// 2. Determine blog title
let title = process.argv[2];

if (!title) {
  // Try to extract from the first changed file
  const lines = statusResult.split('\n').filter(l => l.trim());
  const firstFile = lines[0]?.replace(/^[?\sMARCUD]+\s+/, '').trim();
  if (firstFile) {
    title = extractTitle(firstFile);
  }
}

if (!title) {
  // Fallback: latest .mdoc file alphabetically
  const latest = getLatestFile(BLOG_DIR);
  if (latest) {
    title = extractTitle(path.join(BLOG_DIR, latest));
  }
}

if (!title) {
  console.log('\x1b[31mCould not detect blog title.\x1b[0m');
  console.log('Usage: npm run blog:publish -- "My Blog Title"\n');
  process.exit(1);
}

// 3. Determine branch name (must use let — may be reassigned if branch exists)
let branchName = `blog/${slugify(title)}`;

// Check if branch already exists remotely
try {
  const remoteCheck = run(`git ls-remote --heads origin ${branchName}`, { silent: true }).trim();
  if (remoteCheck) {
    const timestamp = Math.floor(Date.now() / 1000);
    console.log(`\x1b[33m⚠️  Branch '${branchName}' already exists. Appending timestamp...\x1b[0m`);
    branchName = `blog/${slugify(title)}-${timestamp}`;
  }
} catch {
  // remote doesn't exist or no connection — continue
}

console.log(`\x1b[32m📄 Blog:\x1b[0m  ${title}`);
console.log(`\x1b[32m🌿 Branch:\x1b[0m ${branchName}\n`);

// 4. Save current branch
const currentBranch = run('git rev-parse --abbrev-ref HEAD', { silent: true }).trim();

// 5. Create and switch to new branch
console.log('\x1b[34mCreating branch...\x1b[0m');
run(`git checkout -b ${branchName}`);

try {
  // 6. Add blog files
  console.log('\x1b[34mStaging blog content...\x1b[0m');
  run(`git add ${BLOG_DIR}/`);
  if (existsSync(IMAGES_DIR)) {
    run(`git add ${IMAGES_DIR}/`);
  }

  // 7. Commit
  console.log('\x1b[34mCommitting...\x1b[0m');
  run(`git commit -m "blog: add \\"${title}\\""`);

  // 8. Push
  console.log('\x1b[34mPushing to GitHub...\x1b[0m');
  run(`git push -u origin ${branchName}`);

  console.log(`\n\x1b[32m✅ Published to branch:\x1b[0m ${branchName}\n`);
  console.log('\x1b[33mNext step:\x1b[0m');
  console.log(`  1. Open:  https://github.com/james-matoy/gospel-nature-grace/pull/new/${branchName}`);
  console.log('  2. Create a Pull Request → review → merge');
  console.log('  3. Cloudflare auto-deploys after merge\n');
} catch (err) {
  console.error('\n\x1b[31m❌ Failed. Cleaning up...\x1b[0m');
  run(`git checkout ${currentBranch}`);
  run(`git branch -D ${branchName}`);
  console.error(`\x1b[31m${err.message}\x1b[0m`);
  process.exit(1);
} finally {
  // 9. Switch back
  console.log(`\x1b[34mSwitching back to ${currentBranch}...\x1b[0m`);
  run(`git checkout ${currentBranch}`);
}