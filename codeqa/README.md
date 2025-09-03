# CodeQA Snapshot System

This directory contains frozen snapshots of open source applications used for code evaluation and analysis.

## Directory Structure

```
codeqa/
├── snapshot.sh           # Script to create new snapshots
├── README.md            # This documentation
└── apps/               # Snapshot storage
    └── <repo-name>/    # Each repository gets its own directory
        ├── .snapshot.json  # Metadata about the snapshot
        ├── .qa.json       # Questions and answers (optional)
        └── src/           # Pristine source code
```

## Creating Snapshots

Use the `snapshot.sh` script to create a new snapshot of a GitHub repository:

```bash
./codeqa/snapshot.sh https://github.com/owner/repository
```

### Example

```bash
./codeqa/snapshot.sh https://github.com/webtorrent/webtorrent
```

This creates:
```
codeqa/apps/webtorrent/
├── .snapshot.json
├── .qa.json (optional)
└── src/
    ├── package.json
    ├── lib/
    └── ...
```

## Snapshot Metadata

Each snapshot includes a `.snapshot.json` file with complete traceability information:

```json
{
  "url": "https://github.com/webtorrent/webtorrent",
  "owner": "webtorrent",
  "repo": "webtorrent",
  "commit": "a1b2c3d",
  "version": "2.4.0",
  "snapshotDate": "2024-09-03T15:30:00Z"
}
```

## What Gets Excluded

The snapshot process excludes common development artifacts:
- `.git/` - Version control history
- `.github/` - GitHub workflows and templates  
- `node_modules/` - Node.js dependencies
- `.DS_Store` - macOS system files
- `*.log` - Log files
- `.npm/`, `.cache/` - Build caches

## Finding Original Repositories

To trace any snapshot back to its source:

1. Check the `.snapshot.json` file in the app directory
2. The `url` field contains the original GitHub repository
3. The `commit` field shows the exact commit that was snapshotted
4. The `version` field shows the release version (or "main" if no releases)

## Questions and Answers (.qa.json)

Each snapshot can optionally include a `.qa.json` file with questions and answers for evaluation:

```json
{
  "questions": [
    {
      "id": "example-001",
      "question": "What is the main entry point for this application?",
      "answer": "index.js",
      "difficulty": 1,
      "tags": ["architecture"],
      "type": "factual",
      "files": ["index.js"]
    }
  ]
}
```

### Q&A Structure Guidelines

- **answers**: Keep answers **direct and simple** for easier scoring
  - Good: `"answer": "index.js"`
  - Avoid: `"answer": "The main entry point is the index.js file located in the root directory"`
- **difficulty**: Scale 1-5 (1=basic, 5=expert)
- **tags**: Array of relevant topics/concepts
- **type**: Question category (`factual`, `conceptual`)
- **files**: Array of relevant source files (paths relative to `src/`)
- **id**: Unique identifier for the question

## Purpose

These snapshots provide:
- **Stable references** for evaluation platforms
- **Frozen codebases** that won't change over time  
- **Clean source code** without development artifacts
- **Full traceability** back to the original repository
- **Consistent structure** for automated analysis tools
- **Optional Q&A datasets** for code comprehension evaluation