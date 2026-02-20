#!/bin/bash
set -e

echo "📦 Publishing beacon.js to npm..."

cd packages/beacon-js

# Version bump
echo "Current version: $(node -p "require('./package.json').version")"
read -p "New version (e.g., 3.0.0): " VERSION

npm version $VERSION --no-git-tag-version

# Build
echo "🔨 Building..."
npm run build

# Test build
echo "🧪 Testing build..."
node -e "require('./dist/index.js')"

# Publish to npm
echo "🚀 Publishing to npm..."
npm publish --access public

# Create git tag
echo "🏷️  Creating git tag..."
git add package.json
git commit -m "Release beacon.js v$VERSION"
git tag "v$VERSION"
git push origin main --tags

echo "✅ Published beacon.js v$VERSION successfully!"
echo "📝 Update CHANGELOG.md and create GitHub release"
