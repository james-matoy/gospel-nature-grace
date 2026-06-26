#!/bin/bash
# blog-publish.sh — Automate blog publishing to a separate blog/* branch
#
# Usage: npm run blog:publish -- "My blog post title"
# Or with no title: npm run blog:publish  (auto-detects from files)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📝 Blog Publisher${NC}"
echo ""

# Check for uncommitted changes in blog content
if git diff --quiet -- src/content/blog/ && git diff --cached --quiet -- src/content/blog/; then
  echo -e "${YELLOW}No uncommitted blog changes found.${NC}"
  echo -e "Did you write a blog post in Keystatic? Make sure you saved it."
  exit 0
fi

# Determine blog title from arg or from changed files
BLOG_TITLE="$1"

if [ -z "$BLOG_TITLE" ]; then
  # Try to auto-detect from the most recently changed .mdoc file
  LATEST_FILE=$(git diff --name-only -- src/content/blog/ | head -1 || true)
  if [ -z "$LATEST_FILE" ]; then
    LATEST_FILE=$(git diff --cached --name-only -- src/content/blog/ | head -1 || true)
  fi
  if [ -z "$LATEST_FILE" ]; then
    LATEST_FILE=$(ls -t src/content/blog/*.mdoc 2>/dev/null | head -1 || true)
  fi
  if [ -n "$LATEST_FILE" ]; then
    # Extract title from frontmatter
    BLOG_TITLE=$(head -10 "$LATEST_FILE" | grep -i "^title:" | head -1 | sed 's/^title: *//' | sed 's/^"//' | sed 's/"$//' || true)
  fi
fi

if [ -z "$BLOG_TITLE" ]; then
  echo -e "${RED}Could not detect blog title.${NC}"
  echo -e "Usage: npm run blog:publish -- \"My Blog Title\""
  exit 1
fi

# Create a branch name from the title
BRANCH_SLUG=$(echo "$BLOG_TITLE" \
  | tr '[:upper:]' '[:lower:]' \
  | sed 's/[^a-z0-9]/-/g' \
  | sed 's/--*/-/g' \
  | sed 's/^-//' \
  | sed 's/-$//' \
  | sed 's/^$/untitled/')

BRANCH_NAME="blog/${BRANCH_SLUG}"

# Check if branch already exists remotely
if git ls-remote --exit-code --heads origin "$BRANCH_NAME" > /dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  Branch '$BRANCH_NAME' already exists on remote.${NC}"
  echo -e "Appending timestamp..."
  TIMESTAMP=$(date +%s)
  BRANCH_NAME="blog/${BRANCH_SLUG}-${TIMESTAMP}"
fi

echo -e "${GREEN}📄 Blog:${NC} $BLOG_TITLE"
echo -e "${GREEN}🌿 Branch:${NC} $BRANCH_NAME"
echo ""

# Save current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Create and switch to new branch
echo -e "${BLUE}Creating branch...${NC}"
git checkout -b "$BRANCH_NAME"

# Add only blog-related files
git add src/content/blog/
git add public/images/blog/ 2>/dev/null || true

# Commit
echo -e "${BLUE}Committing blog content...${NC}"
git commit -m "blog: add \"${BLOG_TITLE}\""

# Push to origin
echo -e "${BLUE}Pushing to GitHub...${NC}"
git push -u origin "$BRANCH_NAME"

# Switch back to original branch
echo -e "${BLUE}Switching back to $CURRENT_BRANCH...${NC}"
git checkout "$CURRENT_BRANCH"

echo ""
echo -e "${GREEN}✅ Published to branch:${NC} $BRANCH_NAME"
echo ""
echo -e "${YELLOW}Next step:${NC}"
echo -e "  1. Go to:  https://github.com/james-matoy/gospel-nature-grace/pull/new/$BRANCH_NAME"
echo -e "  2. Create a Pull Request → review → merge"
echo -e "  3. Cloudflare auto-deploys after merge"
echo ""