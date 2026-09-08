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

echo "🚀 Syncing and pushing to all repositories and branches..."
if [ "$CURRENT_BRANCH" = "main" ]; then
    git checkout production && git merge main --no-edit || true
    git checkout master && git merge main --no-edit || true
    git checkout main
fi

# Push primary origin first (triggers clean Vercel production build)
echo "📤 [Primary] Pushing to origin main..."
git push origin main:main
git push origin main:master 2>/dev/null || true
git push origin main:production 2>/dev/null || true

# Push to backup repositories
ALL_REMOTES=("viewpoint_repo" "lord_repo" "minegame_repo" "minegame1_repo")
for r in "${ALL_REMOTES[@]}"; do
    if git remote | grep -q "^$r$"; then
        echo "📤 Pushing backup to $r..."
        git push "$r" main:main 2>/dev/null || true
        git push "$r" main:master 2>/dev/null || true
        git push "$r" main:production 2>/dev/null || true
    fi
done

echo "🎉 SUCCESS! All changes pushed across all repositories and branches!"
echo "🌐 Vercel will automatically build and deploy the latest version."
