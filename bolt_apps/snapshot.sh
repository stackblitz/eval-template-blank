#!/bin/bash

if [ $# -eq 0 ]; then
    echo "Usage: $0 <git-url>"
    echo "Example: $0 git@github.com:user/repo.git"
    echo "         $0 https://github.com/user/repo"
    exit 1
fi

GIT_URL="$1"

# Extract repo name from URL
REPO_NAME=$(basename "$GIT_URL" .git)

# Change to bolt_apps directory
cd "$(dirname "$0")" || exit 1

# Check if directory already exists
if [ -d "$REPO_NAME" ]; then
    echo "Error: Directory $REPO_NAME already exists"
    exit 1
fi

echo "Cloning $GIT_URL..."
git clone "$GIT_URL" "$REPO_NAME"

if [ $? -ne 0 ]; then
    echo "Error: Failed to clone repository"
    exit 1
fi

echo "Removing .git directory..."
rm -rf "$REPO_NAME/.git"

echo "Snapshot created: bolt_apps/$REPO_NAME"