#!/bin/bash

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if URL is provided
if [ $# -eq 0 ]; then
    print_error "Usage: $0 <github-url>"
    print_error "Example: $0 https://github.com/webtorrent/webtorrent"
    exit 1
fi

URL="$1"

# Validate GitHub URL
if [[ ! "$URL" =~ ^https://github\.com/[^/]+/[^/]+/?$ ]]; then
    print_error "Invalid GitHub URL format. Expected: https://github.com/owner/repo"
    exit 1
fi

# Extract owner and repo from URL
REPO_PATH=$(echo "$URL" | sed 's|https://github.com/||' | sed 's|/$||')
OWNER=$(echo "$REPO_PATH" | cut -d'/' -f1)
REPO=$(echo "$REPO_PATH" | cut -d'/' -f2)

print_status "Processing repository: $OWNER/$REPO"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APPS_DIR="$SCRIPT_DIR/apps"
TEMP_DIR=$(mktemp -d)

# Cleanup function
cleanup() {
    if [ -d "$TEMP_DIR" ]; then
        rm -rf "$TEMP_DIR"
    fi
}
trap cleanup EXIT

# Create apps directory if it doesn't exist
mkdir -p "$APPS_DIR"

# Get latest commit info from GitHub API
print_status "Fetching repository metadata..."
API_URL="https://api.github.com/repos/$OWNER/$REPO"

if command -v curl >/dev/null 2>&1; then
    REPO_INFO=$(curl -sL "$API_URL")
    COMMIT_INFO=$(curl -sL "$API_URL/commits/HEAD")
else
    print_error "curl is required but not installed"
    exit 1
fi

# Extract commit hash and date
COMMIT_HASH=$(echo "$COMMIT_INFO" | grep '"sha"' | head -1 | sed 's/.*"sha": *"\([^"]*\)".*/\1/' | cut -c1-7)
COMMIT_DATE=$(echo "$COMMIT_INFO" | grep '"date"' | head -1 | sed 's/.*"date": *"\([^"]*\)".*/\1/')

if [ -z "$COMMIT_HASH" ]; then
    print_error "Failed to fetch commit information"
    exit 1
fi

# Try to get latest release version
print_status "Checking for latest release..."
RELEASE_INFO=$(curl -sL "$API_URL/releases/latest" 2>/dev/null || echo "")
if echo "$RELEASE_INFO" | grep -q '"tag_name"'; then
    VERSION=$(echo "$RELEASE_INFO" | grep '"tag_name"' | sed 's/.*"tag_name": *"\([^"]*\)".*/\1/')
    print_status "Found latest release: $VERSION"
else
    VERSION="main"
    print_warning "No releases found, using 'main' as version"
fi

# Clone repository
print_status "Cloning repository..."
cd "$TEMP_DIR"
if ! git clone --depth 1 "$URL.git" repo; then
    print_error "Failed to clone repository"
    exit 1
fi

# Create target directory
TARGET_DIR="$APPS_DIR/$REPO"
if [ -d "$TARGET_DIR" ]; then
    print_warning "Directory $TARGET_DIR already exists, removing it..."
    rm -rf "$TARGET_DIR"
fi

mkdir -p "$TARGET_DIR"

# Create metadata file
print_status "Creating metadata file..."
SNAPSHOT_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

cat > "$TARGET_DIR/.snapshot.json" << EOF
{
  "url": "$URL",
  "owner": "$OWNER",
  "repo": "$REPO",
  "commit": "$COMMIT_HASH",
  "version": "$VERSION",
  "snapshotDate": "$SNAPSHOT_DATE"
}
EOF

# Copy source files to src/ directory
print_status "Copying source files..."
mkdir -p "$TARGET_DIR/src"

cd "$TEMP_DIR/repo"

# Copy all files except excluded ones
rsync -av \
    --exclude='.git' \
    --exclude='.github' \
    --exclude='node_modules' \
    --exclude='.DS_Store' \
    --exclude='*.log' \
    --exclude='.npm' \
    --exclude='.cache' \
    . "$TARGET_DIR/src/"

print_status "Successfully created snapshot at: $TARGET_DIR"
print_status "Repository: $OWNER/$REPO"
print_status "Version: $VERSION"
print_status "Commit: $COMMIT_HASH"
print_status "Files copied to: $TARGET_DIR/src/"
print_status "Metadata stored in: $TARGET_DIR/.snapshot.json"