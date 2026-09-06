#!/bin/bash
# ==============================================================================
# VIEWPOINT - Instant GitHub Auto-Sync & Push Script
# Target Repository: https://github.com/jagdishsakle29-creator/VIEWPOINT
# ==============================================================================

set -e

# Change to project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "⚡ [VIEWPOINT] Checking for project updates..."

# Sync root to public/ for static hosts
cp index.html public/index.html 2>/dev/null || true
cp -r js/* public/js/ 2>/dev/null || true
cp -r css/* public/css/ 2>/dev/null || true
cp -r api/* public/api/ 2>/dev/null || true
cp sitemap.xml public/sitemap.xml 2>/dev/null || true
cp robots.txt public/robots.txt 2>/dev/null || true
cp manifest.json public/manifest.json 2>/dev/null || true

# Add all changes
git add -A

# Check if there are changes to commit
if git diff-index --quiet HEAD --; then
    echo "✅ No local changes to commit. Working directory is already up to date."
else
    COMMIT_MSG="${1:-Update VIEWPOINT casino live: $(date '+%Y-%m-%d %H:%M:%S')}"
    echo "📝 Committing changes: '$COMMIT_MSG'"
    git commit -m "$COMMIT_MSG"
fi

# Sync across branches
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "🚀 Pushing current branch ($CURRENT_BRANCH) to GitHub (VIEWPOINT)..."
git push origin "$CURRENT_BRANCH"

# Keep master and production branches updated
if [ "$CURRENT_BRANCH" = "main" ]; then
    echo "🔄 Syncing master and production branches..."
    git checkout production && git merge main --no-edit && git push origin production
    git checkout master && git merge main --no-edit && git push origin master
    git checkout main
fi

echo "🎉 SUCCESS! All changes pushed to https://github.com/jagdishsakle29-creator/VIEWPOINT"
echo "🌐 Vercel will automatically build and deploy the latest version."
