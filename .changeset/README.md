# Changesets

Add one Markdown file here for every user-facing change that should appear in
the package release notes.

Create a changeset with:

```bash
bun run changeset
```

Choose `astro-ascendant` and the appropriate semver bump. The release process
consumes pending changesets with `bun run version`, then publishes the
resulting package with `bun run release`.
